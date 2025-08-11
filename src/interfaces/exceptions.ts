/**
 * Custom Exception Classes
 */

export class LambdaError extends Error {
  public readonly errorCode: string;
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    errorCode: string = 'LAMBDA_ERROR',
    statusCode: number = 500,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends LambdaError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class ConfigurationError extends LambdaError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
  }
}

export class ExternalServiceError extends LambdaError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'EXTERNAL_SERVICE_ERROR', 502, details);
  }
}

export class DatabaseError extends LambdaError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

export class PostgresError extends DatabaseError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, { ...details });
    // Override the errorCode after calling super
    Object.defineProperty(this, 'errorCode', {
      value: 'POSTGRES_ERROR',
      writable: false,
      enumerable: true,
      configurable: false
    });
  }
}

export class MongoError extends DatabaseError {
  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message, { ...details });
    // Override the errorCode after calling super
    Object.defineProperty(this, 'errorCode', {
      value: 'MONGO_ERROR',
      writable: false,
      enumerable: true,
      configurable: false
    });
  }
}