/**
 * Client Interface Types
 */

// HTTP Client Types
export interface HttpRequestConfig {
  headers?: FBOLambda.StringRecord;
  timeout?: number;
  params?: FBOLambda.UnknownRecord;
  retries?: number;
  retryDelay?: number;
  metadata?: FBOLambda.UnknownRecord;
}

export interface HttpClientInterface {
  get<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: HttpRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: HttpRequestConfig): Promise<T>;
}

// MongoDB Client Types
export interface MongoFindOptions {
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 0 | 1>;
}

export interface MongoClientInterface {
  findOne<T = unknown>(collection: string, filter: FBOLambda.UnknownRecord): Promise<T | null>;
  findMany<T = unknown>(collection: string, filter: FBOLambda.UnknownRecord, options?: MongoFindOptions): Promise<T[]>;
  insertOne<T = unknown>(collection: string, document: FBOLambda.UnknownRecord): Promise<T>;
  updateOne(collection: string, filter: FBOLambda.UnknownRecord, update: FBOLambda.UnknownRecord): Promise<boolean>;
  deleteOne(collection: string, filter: FBOLambda.UnknownRecord): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

// S3 Client Types
export interface S3ClientInterface {
  uploadFile(
    bucketName: string, 
    key: string, 
    body: Buffer | Uint8Array | string,
    options?: {
      ContentType?: string;
      Metadata?: Record<string, string>;
      CacheControl?: string;
      [key: string]: any;
    }
  ): Promise<void>;
  getFile(bucketName: string, key: string): Promise<Buffer>;
  getObjectMetadata(bucketName: string, key: string): Promise<import('./responses').FileMetadata>;
}

// PostgreSQL Client Types
export interface PostgresClientInterface {
  query<T = FBOLambda.UnknownRecord>(text: string, params?: unknown[]): Promise<T[]>;
  queryOne<T = FBOLambda.UnknownRecord>(text: string, params?: unknown[]): Promise<T | null>;
  transaction<T>(callback: (client: PostgresClientInterface) => Promise<T>): Promise<T>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}