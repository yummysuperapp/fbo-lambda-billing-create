import { describe, it, expect } from 'vitest';
import {
  S3EventRecordSchema,
  S3EventSchema,
  APIGatewayEventSchema,
  CustomEventSchema,
  FinanceConfigSchema,
  PostgresConfigSchema,
  MongoConfigSchema,
  type S3EventRecordType,
  type S3EventType,
  type APIGatewayEventType,
  type CustomEventType,
  type FinanceConfigType,
  type PostgresConfigType,
  type MongoConfigType,
} from '@/interfaces/validation';

describe('Validation Schemas', () => {
  describe('S3EventRecordSchema', () => {
    it('should validate valid S3 event record', () => {
      const validRecord = {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        awsRegion: 'us-east-1',
        eventTime: '2023-01-01T00:00:00.000Z',
        eventName: 's3:ObjectCreated:Put',
        s3: {
          bucket: {
            name: 'test-bucket',
          },
          object: {
            key: 'test-file.txt',
            size: 1024,
          },
        },
      };

      const result = S3EventRecordSchema.safeParse(validRecord);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.eventVersion).toBe('2.1');
        expect(result.data.s3.bucket.name).toBe('test-bucket');
      }
    });

    it('should reject invalid S3 event record', () => {
      const invalidRecord = {
        eventVersion: '2.1',
        // Missing required fields
      };

      const result = S3EventRecordSchema.safeParse(invalidRecord);
      expect(result.success).toBe(false);
    });
  });

  describe('S3EventSchema', () => {
    it('should validate valid S3 event', () => {
      const validEvent = {
        Records: [
          {
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            awsRegion: 'us-east-1',
            eventTime: '2023-01-01T00:00:00.000Z',
            eventName: 's3:ObjectCreated:Put',
            s3: {
              bucket: {
                name: 'test-bucket',
              },
              object: {
                key: 'test-file.txt',
                size: 1024,
              },
            },
          },
        ],
      };

      const result = S3EventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.Records).toHaveLength(1);
      }
    });
  });

  describe('APIGatewayEventSchema', () => {
    it('should validate valid API Gateway event', () => {
      const validEvent = {
        httpMethod: 'POST',
        path: '/api/test',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        },
        queryStringParameters: {
          param1: 'value1',
        },
        body: '{"test": "data"}',
        isBase64Encoded: false,
      };

      const result = APIGatewayEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.httpMethod).toBe('POST');
        expect(result.data.path).toBe('/api/test');
      }
    });

    it('should validate API Gateway event with null values', () => {
      const validEvent = {
        httpMethod: 'GET',
        path: '/api/test',
        headers: {},
        queryStringParameters: null,
        body: null,
        isBase64Encoded: false,
      };

      const result = APIGatewayEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('CustomEventSchema', () => {
    it('should validate valid custom event', () => {
      const validEvent = {
        action: 'process-file',
        data: {
          fileId: 'file-123',
          userId: 'user-456',
        },
        metadata: {
          timestamp: '2023-01-01T00:00:00.000Z',
          source: 'api',
        },
      };

      const result = CustomEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.action).toBe('process-file');
      }
    });

    it('should validate custom event with minimal data', () => {
      const validEvent = {
        action: 'simple-action',
      };

      const result = CustomEventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('FinanceConfigSchema', () => {
    it('should validate valid finance config', () => {
      const validConfig = {
        baseUrl: 'https://api.finance.com',
        apiKey: 'secret-key-123',
        dispersionEndpoint: '/api/v1/dispersion',
        timeout: 30000,
      };

      const result = FinanceConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.baseUrl).toBe('https://api.finance.com');
        expect(result.data.timeout).toBe(30000);
      }
    });

    it('should reject invalid finance config', () => {
      const invalidConfig = {
        baseUrl: 'not-a-url',
        apiKey: '',
        dispersionEndpoint: '/api/v1/dispersion',
        timeout: -1,
      };

      const result = FinanceConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('PostgresConfigSchema', () => {
    it('should validate valid postgres config', () => {
      const validConfig = {
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'testuser',
        user: 'testuser',
        password: 'testpass',
        ssl: true,
        maxConnections: 10,
        connectionTimeout: 5000,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
      };

      const result = PostgresConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.host).toBe('localhost');
        expect(result.data.port).toBe(5432);
      }
    });

    it('should reject invalid postgres config', () => {
      const invalidConfig = {
        host: '',
        port: -1,
        database: '',
        username: '',
        user: '',
        password: '',
        ssl: true,
        maxConnections: 0,
        connectionTimeout: -1,
        connectionTimeoutMillis: -1,
        idleTimeoutMillis: -1,
      };

      const result = PostgresConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('MongoConfigSchema', () => {
    it('should validate valid mongo config', () => {
      const validConfig = {
        uri: 'mongodb://localhost:27017',
        database: 'testdb',
        maxPoolSize: 10,
        minPoolSize: 0,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        options: {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 30000,
        },
      };

      const result = MongoConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.uri).toBe('mongodb://localhost:27017');
        expect(result.data.database).toBe('testdb');
      }
    });

    it('should reject invalid mongo config', () => {
      const invalidConfig = {
        uri: '',
        database: '',
        maxPoolSize: 0,
        minPoolSize: -1,
        maxIdleTimeMS: -1,
        serverSelectionTimeoutMS: -1,
        options: {
          maxPoolSize: 0,
          serverSelectionTimeoutMS: -1,
          socketTimeoutMS: -1,
        },
      };

      const result = MongoConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('Type Inference', () => {
    it('should infer correct types from schemas', () => {
      // Test type inference by creating typed variables
      const s3Record: S3EventRecordType = {
        eventVersion: '2.1',
        eventSource: 'aws:s3',
        awsRegion: 'us-east-1',
        eventTime: '2023-01-01T00:00:00.000Z',
        eventName: 's3:ObjectCreated:Put',
        s3: {
          bucket: { name: 'test-bucket' },
          object: { key: 'test-file.txt', size: 1024 },
        },
      };

      const s3Event: S3EventType = {
        Records: [s3Record],
      };

      const apiEvent: APIGatewayEventType = {
        httpMethod: 'GET',
        path: '/test',
        headers: {},
        queryStringParameters: null,
        body: null,
        isBase64Encoded: false,
      };

      const customEvent: CustomEventType = {
        action: 'test-action',
      };

      const financeConfig: FinanceConfigType = {
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key',
        dispersionEndpoint: '/dispersion',
        timeout: 5000,
      };

      const postgresConfig: PostgresConfigType = {
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        user: 'user',
        password: 'pass',
        ssl: false,
        maxConnections: 5,
        connectionTimeout: 1000,
        connectionTimeoutMillis: 1000,
        idleTimeoutMillis: 2000,
      };

      const mongoConfig: MongoConfigType = {
        uri: 'mongodb://localhost:27017',
        database: 'test',
        maxPoolSize: 5,
        minPoolSize: 1,
        maxIdleTimeMS: 1000,
        serverSelectionTimeoutMS: 1000,
        options: {
          maxPoolSize: 5,
          serverSelectionTimeoutMS: 1000,
          socketTimeoutMS: 1000,
        },
      };

      // If these compile without errors, type inference is working
      expect(s3Record.eventVersion).toBe('2.1');
      expect(s3Event.Records).toHaveLength(1);
      expect(apiEvent.httpMethod).toBe('GET');
      expect(customEvent.action).toBe('test-action');
      expect(financeConfig.baseUrl).toBe('https://api.test.com');
      expect(postgresConfig.host).toBe('localhost');
      expect(mongoConfig.uri).toBe('mongodb://localhost:27017');
    });
  });
});
