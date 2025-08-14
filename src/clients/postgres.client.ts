import { Pool, PoolClient } from 'pg';
import type { PostgresClientInterface, PostgresConfig, Logger } from '@/types';
import { PostgresError } from '@/interfaces/exceptions';

/**
 * PostgreSQL client optimized for AWS Lambda
 * Implements connection pooling and proper error handling
 */
export class PostgresClient implements PostgresClientInterface {
  private pool: Pool | null = null;
  private readonly config: PostgresConfig;
  private readonly logger: Logger;

  constructor(config: PostgresConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Establishes connection pool to PostgreSQL
   */
  async connect(): Promise<void> {
    try {
      if (this.pool) {
        this.logger.debug('PostgreSQL pool already exists');
        return;
      }

      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl ?? false,
        max: this.config.maxConnections ?? 10,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis ?? 30000,
        idleTimeoutMillis: this.config.idleTimeoutMillis ?? 30000,
      });

      // Test connection
      const client = await this.pool.connect();
      try {
        await client.query('SELECT 1');
      } catch (testError) {
        client.release();
        throw testError;
      }
      client.release();

      this.logger.info('PostgreSQL connection pool established', {
        host: this.config.host,
        database: this.config.database,
        maxConnections: this.config.maxConnections ?? 10,
      });
    } catch (error) {
      const pgError = new PostgresError('Failed to connect to PostgreSQL', { error });
      this.logger.error('PostgreSQL connection failed', pgError, {
        host: this.config.host,
        database: this.config.database,
      });
      throw pgError;
    }
  }

  /**
   * Closes the connection pool
   */
  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.logger.info('PostgreSQL connection pool closed');
      }
    } catch (error) {
      const pgError = new PostgresError('Failed to close PostgreSQL connection', { error });
      this.logger.error('PostgreSQL disconnect failed', pgError);
      throw pgError;
    }
  }

  /**
   * Executes a query and returns all results
   */
  async query<T = FBOLambda.UnknownRecord>(text: string, params?: unknown[]): Promise<T[]> {
    await this.ensureConnection();

    try {
      const start = Date.now();
      const result = await this.pool!.query(text, params);
      const duration = Date.now() - start;

      this.logger.debug('PostgreSQL query executed', {
        query: text.substring(0, 100),
        params: params?.length ?? 0,
        rowCount: result.rowCount,
        duration,
      });

      return result.rows as T[];
    } catch (error) {
      const pgError = new PostgresError('Query execution failed', { error, query: text, params });
      this.logger.error('PostgreSQL query failed', pgError, {
        query: text.substring(0, 100),
        params: params?.length ?? 0,
      });
      throw pgError;
    }
  }

  /**
   * Executes a query and returns the first result or null
   */
  async queryOne<T = FBOLambda.UnknownRecord>(text: string, params?: unknown[]): Promise<T | null> {
    const results = await this.query<T>(text, params);
    return results.length > 0 ? (results[0] ?? null) : null;
  }

  /**
   * Executes multiple queries within a transaction
   */
  async transaction<T>(callback: (client: PostgresClientInterface) => Promise<T>): Promise<T> {
    await this.ensureConnection();

    const client = await this.pool!.connect();
    const transactionClient = new PostgresTransactionClient(client, this.logger);

    try {
      await client.query('BEGIN');
      this.logger.debug('PostgreSQL transaction started');

      const result = await callback(transactionClient);

      await client.query('COMMIT');
      this.logger.debug('PostgreSQL transaction committed');

      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
        this.logger.debug('PostgreSQL transaction rolled back');
      } catch (rollbackError) {
        this.logger.error('PostgreSQL rollback failed', rollbackError as Error);
        // Still throw the original error, but wrapped in PostgresError
      }

      const pgError = new PostgresError('Transaction failed', { error });
      this.logger.error('PostgreSQL transaction failed', pgError);
      throw pgError;
    } finally {
      try {
        client.release();
      } catch (releaseError) {
        this.logger.error('Failed to release PostgreSQL client', releaseError as Error);
      }
    }
  }

  /**
   * Ensures connection pool is established
   */
  private async ensureConnection(): Promise<void> {
    if (!this.pool) {
      await this.connect();
    }
  }
}

/**
 * PostgreSQL client for transaction operations
 */
class PostgresTransactionClient implements PostgresClientInterface {
  constructor(
    private readonly client: PoolClient,
    private readonly logger: Logger
  ) {}

  async query<T = FBOLambda.UnknownRecord>(text: string, params?: unknown[]): Promise<T[]> {
    try {
      const start = Date.now();
      const result = await this.client.query(text, params);
      const duration = Date.now() - start;

      this.logger.debug('PostgreSQL transaction query executed', {
        query: text.substring(0, 100),
        params: params?.length ?? 0,
        rowCount: result.rowCount,
        duration,
      });

      return result.rows as T[];
    } catch (error) {
      const pgError = new PostgresError('Transaction query execution failed', { error, query: text, params });
      this.logger.error('PostgreSQL transaction query failed', pgError);
      throw pgError;
    }
  }

  async queryOne<T = FBOLambda.UnknownRecord>(text: string, params?: unknown[]): Promise<T | null> {
    const results = await this.query<T>(text, params);
    return results.length > 0 ? (results[0] ?? null) : null;
  }

  async transaction<T>(callback: (client: PostgresClientInterface) => Promise<T>): Promise<T> {
    // Nested transactions are not supported, just execute the callback
    return callback(this);
  }

  async connect(): Promise<void> {
    // Already connected in transaction context
  }

  async disconnect(): Promise<void> {
    // Connection will be released by parent transaction
  }
}

/**
 * Factory function to create PostgreSQL client
 */
export function createPostgresClient(config: PostgresConfig, logger: Logger): PostgresClientInterface {
  return new PostgresClient(config, logger);
}
