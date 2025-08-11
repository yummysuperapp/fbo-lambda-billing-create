/**
 * Context and Logger Types
 */

// Logger Interface
export interface Logger {
  info(message: string, meta?: FBOLambda.UnknownRecord): void;
  error(message: string, error?: Error, meta?: FBOLambda.UnknownRecord): void;
  warn(message: string, meta?: FBOLambda.UnknownRecord): void;
  debug(message: string, meta?: FBOLambda.UnknownRecord): void;
}

// Handler Context Interface
export interface HandlerContext {
  requestId: string;
  functionName: string;
  environment: FBOLambda.Environment;
  startTime: number;
  logger: Logger;
  clients: {
    http: import('./clients').HttpClientInterface;
    s3: import('./clients').S3ClientInterface;
    postgres?: import('./clients').PostgresClientInterface;
    mongo?: import('./clients').MongoClientInterface;
  };
}