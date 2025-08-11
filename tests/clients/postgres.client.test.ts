import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPostgresClient, PostgresClient } from '@/clients/postgres.client';
import { PostgresError } from '@/interfaces/exceptions';
import { Pool } from 'pg';

// Mock pg module
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    end: vi.fn(),
    query: vi.fn(),
  })),
}));

describe('PostgresClient', () => {
  let client: PostgresClient;
  let mockPool: any;
  let mockLogger: any;

  const mockConfig = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_password',
    ssl: false,
    maxConnections: 10,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  };

  beforeEach(() => {
    mockPool = {
      connect: vi.fn(),
      end: vi.fn(),
      query: vi.fn(),
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };
    (Pool as any).mockImplementation(() => mockPool);
    client = createPostgresClient(mockConfig, mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await client.connect();

      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw PostgresError on connection failure', async () => {
      const error = new Error('Connection failed');
      mockPool.connect.mockRejectedValue(error);

      await expect(client.connect()).rejects.toThrow(PostgresError);
    });

    it('should handle test connection failure during connect', async () => {
      const testError = new Error('Test query failed');
      
      // Mock pool.connect to return a client that fails on query
      const mockClient = {
        query: vi.fn().mockRejectedValueOnce(testError),
        release: vi.fn(),
      };
      
      mockPool.connect.mockResolvedValueOnce(mockClient);
      
      await expect(client.connect()).rejects.toThrow(PostgresError);
      expect(mockClient.release).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'PostgreSQL connection failed',
        expect.any(PostgresError),
        expect.objectContaining({
          host: mockConfig.host,
          database: mockConfig.database,
        })
      );
    });

    it('should handle pool already exists during connect', async () => {
      // First connection
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      await client.connect();
      mockLogger.debug.mockClear();
      
      // Second connection attempt
      await client.connect();
      
      expect(mockLogger.debug).toHaveBeenCalledWith('PostgreSQL pool already exists');
    });
  });

  describe('query', () => {
    it('should execute query successfully', async () => {
      const mockResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 };
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 }); // For SELECT 1 test
      mockPool.query.mockResolvedValue(mockResult);

      const result = await client.query('SELECT * FROM users WHERE id = $1', [1]);

      expect(result).toEqual([{ id: 1, name: 'test' }]);
      expect(mockPool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    });

    it('should throw PostgresError on query failure', async () => {
      const error = new Error('Query failed');
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 }); // For SELECT 1 test
      mockPool.query.mockRejectedValue(error);

      await expect(client.query('SELECT * FROM users', [])).rejects.toThrow(PostgresError);
    });
  });

  describe('queryOne', () => {
    it('should return single row', async () => {
      const mockResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 };
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 }); // For SELECT 1 test
      mockPool.query.mockResolvedValue(mockResult);

      const result = await client.queryOne('SELECT * FROM users WHERE id = $1', [1]);

      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should return null when no rows found', async () => {
      const mockResult = { rows: [], rowCount: 0 };
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 }); // For SELECT 1 test
      mockPool.query.mockResolvedValue(mockResult);

      const result = await client.queryOne('SELECT * FROM users WHERE id = $1', [999]);

      expect(result).toBeNull();
    });
  });

  describe('transaction', () => {
    it('should execute transaction successfully', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      const result = await client.transaction(async (txClient) => {
        await txClient.query('INSERT INTO users (name) VALUES ($1)', ['test']);
        return 'success';
      });

      expect(result).toBe('success');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('INSERT INTO users (name) VALUES ($1)', ['test']);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockImplementation((sql: string) => {
        if (sql === 'INSERT INTO users (name) VALUES ($1)') {
          throw new Error('Insert failed');
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await expect(
        client.transaction(async (txClient) => {
          await txClient.query('INSERT INTO users (name) VALUES ($1)', ['test']);
        })
      ).rejects.toThrow(PostgresError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      // First connect to initialize the pool
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      await client.connect();
      
      // Then test disconnect
      mockPool.end.mockResolvedValue(undefined);
      await client.disconnect();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle disconnect when not connected', async () => {
      await expect(client.disconnect()).resolves.not.toThrow();
    });

    it('should throw PostgresError on disconnect failure', async () => {
      // First connect to initialize the pool
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      await client.connect();
      
      // Then test disconnect failure
      const error = new Error('Disconnect failed');
      mockPool.end.mockRejectedValue(error);

      await expect(client.disconnect()).rejects.toThrow(PostgresError);
    });
  });

  describe('error handling edge cases', () => {
    it('should handle query without connection', async () => {
      const disconnectedClient = createPostgresClient(mockConfig, mockLogger);

      await expect(disconnectedClient.query('SELECT 1', [])).rejects.toThrow(PostgresError);
    });

    it('should handle queryOne without connection', async () => {
      const disconnectedClient = createPostgresClient(mockConfig, mockLogger);

      await expect(disconnectedClient.queryOne('SELECT 1', [])).rejects.toThrow(PostgresError);
    });

    it('should handle transaction without connection', async () => {
      const disconnectedClient = createPostgresClient(mockConfig, mockLogger);

      await expect(disconnectedClient.transaction(async () => {})).rejects.toThrow(PostgresError);
    });

    it('should handle connection test failure during connect', async () => {
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockRejectedValue(new Error('Connection test failed'));

      await expect(client.connect()).rejects.toThrow(PostgresError);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle connection error during connect', async () => {
      // Mock Pool constructor to throw an error
      const PoolMock = vi.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });
      
      // Replace the Pool constructor temporarily
      const originalPool = (global as any).Pool;
      (global as any).Pool = PoolMock;
      
      const newClient = createPostgresClient(mockConfig, mockLogger);
      
      await expect(newClient.connect()).rejects.toThrow(PostgresError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'PostgreSQL connection failed',
        expect.any(PostgresError),
        expect.objectContaining({
          host: mockConfig.host,
          database: mockConfig.database
        })
      );
      
      // Restore original Pool
      (global as any).Pool = originalPool;
    });

    it('should handle disconnect error', async () => {
      // Create a separate client for this test to avoid interference
      const testClient = createPostgresClient(mockConfig, mockLogger);
      
      // Mock successful connection first
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Connect the client
      await testClient.connect();
      
      // Now mock pool.end to throw an error for disconnect
      mockPool.end.mockRejectedValue(new Error('Disconnect failed'));
      
      await expect(testClient.disconnect()).rejects.toThrow(PostgresError);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'PostgreSQL disconnect failed',
        expect.any(PostgresError)
      );
    });

    it('should handle client release failure during connect', async () => {
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      mockClient.release.mockRejectedValue(new Error('Release failed'));

      // Should still succeed even if release fails
      await expect(client.connect()).resolves.not.toThrow();
    });

    it('should handle transaction rollback failure', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockImplementation((sql: string) => {
        if (sql === 'INSERT INTO users (name) VALUES ($1)') {
          throw new Error('Insert failed');
        }
        if (sql === 'ROLLBACK') {
          throw new Error('Rollback failed');
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await expect(
        client.transaction(async (txClient) => {
          await txClient.query('INSERT INTO users (name) VALUES ($1)', ['test']);
        })
      ).rejects.toThrow(PostgresError);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle rollback failure in transaction', async () => {
      const transactionError = new Error('Transaction failed');
      const rollbackError = new Error('Rollback failed');
      
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      
      // Mock BEGIN to succeed, callback to fail, and ROLLBACK to fail
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockRejectedValueOnce(rollbackError); // ROLLBACK fails
      
      const callback = vi.fn().mockRejectedValueOnce(transactionError);
      
      await expect(client.transaction(callback)).rejects.toThrow(PostgresError);
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'PostgreSQL rollback failed',
        rollbackError
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'PostgreSQL transaction failed',
        expect.any(PostgresError)
      );
    });

    it('should handle client release failure in transaction', async () => {
      const transactionError = new Error('Transaction failed');
      const releaseError = new Error('Release failed');
      
      const mockClient = {
        query: vi.fn(),
        release: vi.fn().mockRejectedValueOnce(releaseError),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      
      // Mock BEGIN to succeed, callback to fail, and ROLLBACK to succeed
      mockClient.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK
      
      const callback = vi.fn().mockRejectedValueOnce(transactionError);
      
      await expect(client.transaction(callback)).rejects.toThrow(PostgresError);
      
      // Verify transaction error is logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'PostgreSQL transaction failed',
        expect.any(PostgresError)
      );
      
      // Verify client release was attempted
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle client release failure during transaction', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      mockClient.release.mockRejectedValue(new Error('Release failed'));

      const result = await client.transaction(async (txClient) => {
        await txClient.query('INSERT INTO users (name) VALUES ($1)', ['test']);
        return 'success';
      });

      expect(result).toBe('success');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('pool configuration', () => {
    it('should create pool with correct configuration', async () => {
      const customConfig = {
        ...mockConfig,
        maxConnections: 20,
        connectionTimeoutMillis: 60000,
        idleTimeoutMillis: 60000,
      };

      const customClient = createPostgresClient(customConfig, mockLogger);
      
      // Mock the connection test
      const mockClient = { query: vi.fn(), release: vi.fn() };
      mockPool.connect.mockResolvedValue(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Connect to trigger pool creation
      await customClient.connect();

      expect(Pool).toHaveBeenCalledWith({
        host: customConfig.host,
        port: customConfig.port,
        database: customConfig.database,
        user: customConfig.user,
        password: customConfig.password,
        ssl: customConfig.ssl,
        max: customConfig.maxConnections,
        connectionTimeoutMillis: customConfig.connectionTimeoutMillis,
        idleTimeoutMillis: customConfig.idleTimeoutMillis,
      });
    });
  });

  describe('transaction client wrapper', () => {
    it('should provide transaction client with query methods', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 });

      await client.transaction(async (txClient) => {
        // Test query method
        const queryResult = await txClient.query('SELECT * FROM users', []);
        expect(queryResult).toEqual([{ id: 1 }]);

        // Test queryOne method
        const queryOneResult = await txClient.queryOne('SELECT * FROM users WHERE id = $1', [1]);
        expect(queryOneResult).toEqual({ id: 1 });
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users', []);
      expect(mockClient.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should handle queryOne returning null in transaction', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockImplementation((sql: string) => {
        if (sql.includes('SELECT')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await client.transaction(async (txClient) => {
        const result = await txClient.queryOne('SELECT * FROM users WHERE id = $1', [999]);
        expect(result).toBeNull();
      });
    });

    it('should handle nested transactions', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await client.transaction(async (txClient) => {
        // Test nested transaction - should just execute callback
        const nestedResult = await txClient.transaction(async (nestedTxClient) => {
          await nestedTxClient.query('SELECT 1');
          return 'nested';
        });
        expect(nestedResult).toBe('nested');
      });
    });

    it('should handle transaction client connect and disconnect methods', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await client.transaction(async (txClient) => {
        // These methods should be no-ops in transaction context
        await txClient.connect();
        await txClient.disconnect();
      });
    });

    it('should handle disconnect when pool is null', async () => {
      const disconnectedClient = createPostgresClient(mockConfig, mockLogger);
      
      // Should not throw when pool is null
      await expect(disconnectedClient.disconnect()).resolves.not.toThrow();
    });

    it('should handle transaction query error', async () => {
      const mockClient = {
        query: vi.fn(),
        release: vi.fn(),
      };
      const mockConnectClient = { query: vi.fn(), release: vi.fn() };
      
      // Mock for ensureConnection (connect test)
      mockPool.connect.mockResolvedValueOnce(mockConnectClient);
      mockConnectClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      // Mock for transaction
      mockPool.connect.mockResolvedValueOnce(mockClient);
      mockClient.query.mockImplementation((sql: string) => {
        if (sql === 'BEGIN') {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql === 'SELECT * FROM invalid_table') {
          throw new Error('Table does not exist');
        }
        if (sql === 'ROLLBACK') {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await expect(
        client.transaction(async (txClient) => {
          await txClient.query('SELECT * FROM invalid_table');
        })
      ).rejects.toThrow(PostgresError);
    });
  });
});