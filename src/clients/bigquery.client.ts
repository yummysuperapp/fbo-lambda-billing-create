import { BigQuery } from '@google-cloud/bigquery';
import type { 
  BigQueryClientInterface,
  BigQueryConfig,
  BigQueryQueryOptions,
  BigQueryInsertOptions,
  BigQueryTableSchema,
  Logger
} from '@/types';
import { BigQueryError } from '@/interfaces/exceptions';
import { createLogger } from '@/utils/logger.util';
import { config } from '@/config';

/**
 * BigQuery client optimized for AWS Lambda
 * Implements connection pooling and proper error handling
 */
export class BigQueryClient implements BigQueryClientInterface {
  private client: BigQuery | null = null;
  private readonly config: BigQueryConfig;
  private readonly logger: Logger;
  private isConnected: boolean = false;
  public static instance: BigQueryClient | null = null;

  constructor(bigqueryConfig?: BigQueryConfig, logger?: Logger) {
    this.config = bigqueryConfig || config.bigquery;
    this.logger = logger || createLogger('BigQueryClient');
  }

  /**
   * Establishes connection to BigQuery
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      this.logger.debug('BigQuery connection already exists');
      return;
    }

    try {
      const clientConfig: Record<string, unknown> = {
        projectId: this.config.projectId,
        location: this.config.location || 'US',
        maxRetries: this.config.maxRetries || 3,
        autoRetry: this.config.autoRetry !== false,
      };

      // Add authentication if provided
      if (this.config.keyFilename) {
        clientConfig.keyFilename = this.config.keyFilename;
      } else if (this.config.credentials) {
        clientConfig.credentials = this.config.credentials;
      }

      this.client = new BigQuery(clientConfig);
      
      // Test connection by listing datasets
      await this.client.getDatasets({ maxResults: 1 });
      
      this.isConnected = true;
      this.logger.info('BigQuery client connected successfully', {
        projectId: this.config.projectId,
        location: this.config.location || 'US'
      });
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'Failed to connect to BigQuery',
        { error: error as Error, projectId: this.config.projectId }
      );
      this.logger.error('Failed to connect to BigQuery:', error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Disconnects from BigQuery
   */
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        // BigQuery client doesn't have explicit disconnect method
        // Just clear the reference
        this.client = null;
        this.isConnected = false;
        this.logger.info('BigQuery client disconnected');
      }
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'Failed to disconnect from BigQuery',
        { error: error as Error }
      );
      this.logger.error('BigQuery disconnect failed', bigqueryError);
      throw bigqueryError;
    }
  }

  /**
   * Ensures BigQuery connection is established
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected || !this.client) {
      await this.connect();
    }
  }

  /**
   * Executes a SQL query
   */
  async query<T = FBOLambda.UnknownRecord>(
    sql: string, 
    options: BigQueryQueryOptions = {}
  ): Promise<T[]> {
    await this.ensureConnection();
    
    try {
      const start = Date.now();
      
      const queryOptions: Record<string, unknown> = {
        query: sql,
        location: options.location || this.config.location || 'US',
        useLegacySql: options.useLegacySql || false,
        dryRun: options.dryRun || false,
        maxResults: options.maxResults,
        startIndex: options.startIndex,
        params: options.params,
        types: options.types,
        maximumBytesBilled: options.maximumBytesBilled,
        labels: options.labels,
        jobTimeoutMs: options.jobTimeoutMs,
      };

      // Remove undefined values
      Object.keys(queryOptions).forEach(key => {
        if (queryOptions[key] === undefined) {
          delete queryOptions[key];
        }
      });

      const [rows] = await this.client!.query(queryOptions);
      const duration = Date.now() - start;

      this.logger.debug('BigQuery query executed successfully', {
        query: sql.substring(0, 100),
        rowCount: rows.length,
        duration,
        dryRun: options.dryRun || false
      });

      return rows as T[];
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery query execution failed',
        { error: error as Error, query: sql, options }
      );
      this.logger.error('Query execution failed:', error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Inserts rows into a table
   */
  async insert(
    datasetId: string,
    tableId: string,
    rows: FBOLambda.UnknownRecord[],
    options: BigQueryInsertOptions = {}
  ): Promise<void> {
    await this.ensureConnection();
    
    try {
      const dataset = this.client!.dataset(datasetId);
      const table = dataset.table(tableId);
      
      const insertOptions: Record<string, unknown> = {
        ignoreUnknownValues: options.ignoreUnknownValues || false,
        skipInvalidRows: options.skipInvalidRows || false,
        templateSuffix: options.templateSuffix,
        createInsertId: options.createInsertId !== false,
      };

      // Remove undefined values
      Object.keys(insertOptions).forEach(key => {
        if (insertOptions[key] === undefined) {
          delete insertOptions[key];
        }
      });

      await table.insert(rows, insertOptions);
      
      this.logger.info('BigQuery insert completed successfully', {
        datasetId,
        tableId,
        rowCount: rows.length
      });
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery insert operation failed',
        { error: error as Error, datasetId, tableId, rowCount: rows.length }
      );
      this.logger.error(`Data insertion failed for table ${tableId}:`, error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Creates a new table
   */
  async createTable(
    datasetId: string,
    tableId: string,
    schema: BigQueryTableSchema,
    options: { description?: string } = {}
  ): Promise<void> {
    await this.ensureConnection();
    
    try {
      const dataset = this.client!.dataset(datasetId);
      
      const tableOptions: Record<string, unknown> = {
        schema: schema.fields,
        description: options.description,
      };

      await dataset.createTable(tableId, tableOptions);
      
      this.logger.info('BigQuery table created successfully', {
        datasetId,
        tableId,
        fieldCount: schema.fields.length
      });
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery table creation failed',
        { error: error as Error, datasetId, tableId, schema }
      );
      this.logger.error(`Table creation failed for ${tableId}:`, error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Deletes a table
   */
  async deleteTable(datasetId: string, tableId: string): Promise<void> {
    await this.ensureConnection();
    
    try {
      const dataset = this.client!.dataset(datasetId);
      const table = dataset.table(tableId);
      
      await table.delete();
      
      this.logger.info('BigQuery table deleted successfully', {
        datasetId,
        tableId
      });
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery table deletion failed',
        { error: error as Error, datasetId, tableId }
      );
      this.logger.error(`Table deletion failed for ${tableId}:`, error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Checks if a table exists
   */
  async tableExists(datasetId: string, tableId: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const dataset = this.client!.dataset(datasetId);
      const table = dataset.table(tableId);
      
      const [exists] = await table.exists();
      
      this.logger.debug('BigQuery table existence check', {
        datasetId,
        tableId,
        exists
      });
      
      return exists;
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery table existence check failed',
        { error: error as Error, datasetId, tableId }
      );
      this.logger.error(`Failed to check table existence for ${tableId}:`, error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Gets table metadata
   */
  async getTableMetadata(
    datasetId: string, 
    tableId: string
  ): Promise<FBOLambda.UnknownRecord> {
    await this.ensureConnection();
    
    try {
      const dataset = this.client!.dataset(datasetId);
      const table = dataset.table(tableId);
      
      const [metadata] = await table.getMetadata();
      
      this.logger.debug('BigQuery table metadata retrieved', {
        datasetId,
        tableId,
        numRows: metadata.numRows,
        numBytes: metadata.numBytes
      });
      
      return metadata as FBOLambda.UnknownRecord;
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery table metadata retrieval failed',
        { error: error as Error, datasetId, tableId }
      );
      this.logger.error(`Failed to get table metadata for ${tableId}:`, error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Creates a new dataset
   */
  async createDataset(
    datasetId: string,
    options: { location?: string; description?: string } = {}
  ): Promise<void> {
    await this.ensureConnection();
    
    try {
      const datasetOptions: Record<string, unknown> = {
        location: options.location || this.config.location || 'US',
        description: options.description,
      };

      await this.client!.createDataset(datasetId, datasetOptions);
      
      this.logger.info('BigQuery dataset created successfully', {
        datasetId,
        location: datasetOptions.location
      });
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery dataset creation failed',
        { error: error as Error, datasetId, options }
      );
      this.logger.error(`Dataset creation failed for ${datasetId}:`, error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Deletes a dataset
   */
  async deleteDataset(
    datasetId: string,
    options: { force?: boolean } = {}
  ): Promise<void> {
    await this.ensureConnection();
    
    try {
      const dataset = this.client!.dataset(datasetId);
      
      await dataset.delete({ force: options.force || false });
      
      this.logger.info('BigQuery dataset deleted successfully', {
        datasetId,
        force: options.force || false
      });
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery dataset deletion failed',
        { error: error as Error, datasetId, options }
      );
      this.logger.error(`Dataset deletion failed for ${datasetId}:`, error as Error);
      throw bigqueryError;
    }
  }

  /**
   * Checks if a dataset exists
   */
  async datasetExists(datasetId: string): Promise<boolean> {
    await this.ensureConnection();
    
    try {
      const dataset = this.client!.dataset(datasetId);
      const [exists] = await dataset.exists();
      
      this.logger.debug('BigQuery dataset existence check', {
        datasetId,
        exists
      });
      
      return exists;
    } catch (error) {
      const bigqueryError = new BigQueryError(
        'BigQuery dataset existence check failed',
        { error: error as Error, datasetId }
      );
      this.logger.error(`Failed to check dataset existence for ${datasetId}:`, error as Error);
      throw bigqueryError;
    }
  }
}

/**
 * Creates a new BigQuery client instance
 */
export function createBigQueryClient(
  bigqueryConfig?: BigQueryConfig,
  logger?: Logger
): BigQueryClient {
  return new BigQueryClient(bigqueryConfig, logger);
}

/**
 * Gets or creates a BigQuery client singleton instance
 */
export function getBigQueryClient(): BigQueryClient {
  if (!BigQueryClient.instance) {
    BigQueryClient.instance = createBigQueryClient();
  }
  return BigQueryClient.instance;
}

export const bigqueryClient = getBigQueryClient();