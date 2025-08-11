import { describe, it, expect } from 'vitest';
import {
  LambdaError,
  ValidationError,
  ConfigurationError,
  ExternalServiceError,
  DatabaseError,
  PostgresError,
  MongoError,
} from '@/interfaces/exceptions';

describe('Exception Types', () => {
  describe('LambdaError', () => {
    it('should create LambdaError with default values', () => {
      const error = new LambdaError('Test error');

      expect(error.name).toBe('LambdaError');
      expect(error.message).toBe('Test error');
      expect(error.errorCode).toBe('LAMBDA_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.details).toEqual({});
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create LambdaError with custom values', () => {
      const details = { userId: '123', action: 'upload' };
      const error = new LambdaError('Custom error', 'CUSTOM_CODE', 400, details);

      expect(error.message).toBe('Custom error');
      expect(error.errorCode).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual(details);
    });

    it('should have proper error stack', () => {
      const error = new LambdaError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('LambdaError');
    });
  });

  describe('ValidationError', () => {
    it('should create ValidationError with default values', () => {
      const error = new ValidationError('Validation failed');

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error).toBeInstanceOf(LambdaError);
    });

    it('should create ValidationError with custom details', () => {
      const details = { field: 'email', value: 'invalid-email' };
      const error = new ValidationError('Invalid email format', details);

      expect(error.details).toEqual(details);
      expect(error.statusCode).toBe(400);
    });
  });

  describe('ConfigurationError', () => {
    it('should create ConfigurationError with default values', () => {
      const error = new ConfigurationError('Config missing');

      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toBe('Config missing');
      expect(error.errorCode).toBe('CONFIGURATION_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(LambdaError);
    });

    it('should create ConfigurationError with custom details', () => {
      const details = { configKey: 'DATABASE_URL', environment: 'production' };
      const error = new ConfigurationError('Missing database configuration', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create ExternalServiceError with default values', () => {
      const error = new ExternalServiceError('Service unavailable');

      expect(error.name).toBe('ExternalServiceError');
      expect(error.message).toBe('Service unavailable');
      expect(error.errorCode).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.statusCode).toBe(502);
      expect(error).toBeInstanceOf(LambdaError);
    });

    it('should create ExternalServiceError with custom details', () => {
      const details = { service: 'finance-api', endpoint: '/dispersion', responseCode: 503 };
      const error = new ExternalServiceError('Finance API unavailable', details);

      expect(error.details).toEqual(details);
      expect(error.statusCode).toBe(502);
    });
  });

  describe('DatabaseError', () => {
    it('should create DatabaseError with default values', () => {
      const error = new DatabaseError('Connection failed');

      expect(error.name).toBe('DatabaseError');
      expect(error.message).toBe('Connection failed');
      expect(error.errorCode).toBe('DATABASE_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(LambdaError);
    });

    it('should create DatabaseError with custom details', () => {
      const details = { operation: 'SELECT', table: 'users', query: 'SELECT * FROM users' };
      const error = new DatabaseError('Query execution failed', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('PostgresError', () => {
    it('should create PostgresError with default values', () => {
      const error = new PostgresError('Postgres connection failed');

      expect(error.name).toBe('PostgresError');
      expect(error.message).toBe('Postgres connection failed');
      expect(error.errorCode).toBe('POSTGRES_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(DatabaseError);
    });

    it('should create PostgresError with custom details', () => {
      const details = { 
        host: 'localhost', 
        port: 5432, 
        database: 'testdb',
        sqlState: '08006'
      };
      const error = new PostgresError('Connection timeout', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('MongoError', () => {
    it('should create MongoError with default values', () => {
      const error = new MongoError('MongoDB connection failed');

      expect(error.name).toBe('MongoError');
      expect(error.message).toBe('MongoDB connection failed');
      expect(error.errorCode).toBe('MONGO_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(DatabaseError);
    });

    it('should create MongoError with custom details', () => {
      const details = { 
        collection: 'users', 
        operation: 'insertOne',
        mongoErrorCode: 11000
      };
      const error = new MongoError('Duplicate key error', details);

      expect(error.details).toEqual(details);
    });
  });

  describe('Error inheritance chain', () => {
    it('should maintain proper inheritance for ValidationError', () => {
      const error = new ValidationError('Test');
      
      expect(error instanceof ValidationError).toBe(true);
      expect(error instanceof LambdaError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should maintain proper inheritance for PostgresError', () => {
      const error = new PostgresError('Test');
      
      expect(error instanceof PostgresError).toBe(true);
      expect(error instanceof DatabaseError).toBe(true);
      expect(error instanceof LambdaError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    it('should maintain proper inheritance for MongoError', () => {
      const error = new MongoError('Test');
      
      expect(error instanceof MongoError).toBe(true);
      expect(error instanceof DatabaseError).toBe(true);
      expect(error instanceof LambdaError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});