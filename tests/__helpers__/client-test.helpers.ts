import { vi, type MockedFunction } from 'vitest';
import type { Logger } from '@/types';

/**
 * Common test helper utilities for client testing
 */

/**
 * Creates a mock logger instance with all required methods
 */
export function createMockLogger(): Logger {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  };
}

/**
 * Creates standardized mock configurations for different clients
 */
export const mockConfigs = {
  bigquery: {
    projectId: 'test-project',
    datasetId: 'test-dataset',
    location: 'US',
    keyFilename: '/path/to/key.json',
    maxRetries: 3,
    autoRetry: true,
  },
  
  postgres: {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    user: 'test_user',
    password: 'test_password',
    ssl: false,
    maxConnections: 10,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  },
  
  mongo: {
    uri: 'mongodb://localhost:27017/test',
    database: 'test_db',
    minPoolSize: 5,
    maxPoolSize: 10,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
  },
  
  s3: {
    region: 'us-east-1',
    bucketName: 'test-bucket',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    maxRetries: 3,
  },
  
  http: {
    baseURL: 'https://api.example.com',
    timeout: 5000,
    retries: 3,
    retryDelay: 1000,
  },
};

/**
 * Creates common mock responses for different operations
 */
export const mockResponses = {
  success: {
    bigquery: {
      rows: [{ id: 1, name: 'test' }],
      jobComplete: true,
    },
    postgres: {
      rows: [{ id: 1, name: 'test' }],
      rowCount: 1,
    },
    mongo: {
      ops: [{ _id: 'test-id', name: 'test' }],
      insertedCount: 1,
      modifiedCount: 1,
      deletedCount: 1,
    },
    s3: {
      ETag: 'test-etag',
      VersionId: 'test-version',
      Body: Buffer.from('test content'),
      ContentLength: 12,
      ContentType: 'text/plain',
    },
    http: {
      status: 200,
      data: { success: true, data: [] },
      headers: { 'content-type': 'application/json' },
    },
  },
  
  error: {
    connection: new Error('Connection failed'),
    timeout: new Error('Request timeout'),
    notFound: new Error('Resource not found'),
    unauthorized: new Error('Unauthorized access'),
    generic: new Error('Generic error'),
  },
};

/**
 * Test data fixtures for consistent testing
 */
export const testFixtures = {
  user: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
  },
  
  sql: {
    select: 'SELECT * FROM users WHERE id = $1',
    insert: 'INSERT INTO users (name, email) VALUES ($1, $2)',
    update: 'UPDATE users SET name = $1 WHERE id = $2',
    delete: 'DELETE FROM users WHERE id = $1',
  },
  
  bigquery: {
    dataset: 'test_dataset',
    table: 'test_table',
    schema: {
      fields: [
        { name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
        { name: 'name', type: 'STRING', mode: 'NULLABLE' },
      ],
    },
  },
  
  mongo: {
    collection: 'test_collection',
    document: { _id: 'test-id', name: 'test', value: 123 },
    filter: { name: 'test' },
    update: { $set: { value: 456 } },
  },
  
  s3: {
    key: 'test/file.txt',
    content: 'test content',
    contentType: 'text/plain',
    metadata: { version: '1.0', author: 'test' },
  },
};

/**
 * Helper functions for test setup and teardown
 */
export class TestSetupHelper {
  /**
   * Sets up common mocks for all client tests
   */
  static setupCommonMocks() {
    // Common environment variables
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'debug';
  }

  /**
   * Cleans up after tests
   */
  static cleanup() {
    vi.clearAllMocks();
    vi.resetAllMocks();
  }

  /**
   * Creates a mock timer for testing async operations
   */
  static mockTimer() {
    vi.useFakeTimers();
    return {
      advance: (ms: number) => vi.advanceTimersByTime(ms),
      restore: () => vi.useRealTimers(),
    };
  }

  /**
   * Creates mock for performance timing
   */
  static mockPerformance() {
    const mockNow = vi.fn();
    let time = 0;
    
    mockNow.mockImplementation(() => {
      time += 100; // Add 100ms for each call
      return time;
    });
    
    global.Date.now = mockNow;
    
    return {
      reset: () => {
        time = 0;
        mockNow.mockClear();
      },
      setDuration: (duration: number) => {
        time += duration;
      },
    };
  }
}

/**
 * Common assertion helpers
 */
export class AssertionHelper {
  /**
   * Asserts that a logger was called with expected message and level
   */
  static assertLoggerCalled(
    logger: Logger,
    level: keyof Logger,
    expectedMessage: string
  ) {
    expect(logger[level]).toHaveBeenCalledWith(
      expect.stringContaining(expectedMessage),
      expect.any(Object)
    );
  }

  /**
   * Asserts error structure for client errors
   */
  static assertClientError(
    error: any,
    expectedMessage: string,
    expectedContext?: Record<string, unknown>
  ) {
    expect(error).toBeDefined();
    expect(error.message).toBe(expectedMessage);
    if (expectedContext) {
      expect(error.context).toMatchObject(expectedContext);
    }
  }

  /**
   * Asserts that mock was called with specific parameters
   */
  static assertMockCalledWith(
    mockFn: MockedFunction<any>,
    expectedParams: unknown[]
  ) {
    expect(mockFn).toHaveBeenCalledWith(...expectedParams);
  }
}

/**
 * Performance test utilities
 */
export class PerformanceHelper {
  /**
   * Measures execution time of a function
   */
  static async measureExecution<T>(fn: () => Promise<T>): Promise<{
    result: T;
    duration: number;
  }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    
    return { result, duration };
  }

  /**
   * Creates load test for client operations
   */
  static async loadTest<T>(
    operation: () => Promise<T>,
    concurrent: number = 10,
    iterations: number = 100
  ): Promise<{
    totalTime: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
    errors: number;
  }> {
    const results: number[] = [];
    let errors = 0;
    
    const startTime = Date.now();
    
    const promises = Array.from({ length: concurrent }, async () => {
      for (let i = 0; i < iterations; i++) {
        const opStart = Date.now();
        try {
          await operation();
          results.push(Date.now() - opStart);
        } catch {
          errors++;
        }
      }
    });
    
    await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    
    return {
      totalTime,
      avgTime: results.reduce((a, b) => a + b, 0) / results.length,
      maxTime: Math.max(...results),
      minTime: Math.min(...results),
      errors,
    };
  }
}