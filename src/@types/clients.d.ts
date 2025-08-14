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
      [key: string]: unknown;
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

// BigQuery Client Types
export interface BigQueryJobOptions {
  dryRun?: boolean;
  useLegacySql?: boolean;
  maximumBytesBilled?: string;
  labels?: Record<string, string>;
  jobTimeoutMs?: number;
  location?: string;
}

export interface BigQueryQueryOptions extends BigQueryJobOptions {
  params?: unknown[];
  types?: string[];
  maxResults?: number;
  startIndex?: string;
}

export interface BigQueryInsertOptions {
  ignoreUnknownValues?: boolean;
  skipInvalidRows?: boolean;
  templateSuffix?: string;
  createInsertId?: boolean;
}

export interface BigQueryTableSchema {
  fields: Array<{
    name: string;
    type: string;
    mode?: 'NULLABLE' | 'REQUIRED' | 'REPEATED';
    description?: string;
    fields?: BigQueryTableSchema['fields'];
  }>;
}

export interface BigQueryClientInterface {
  query<T = FBOLambda.UnknownRecord>(sql: string, options?: BigQueryQueryOptions): Promise<T[]>;
  insert(
    datasetId: string,
    tableId: string,
    rows: FBOLambda.UnknownRecord[],
    options?: BigQueryInsertOptions
  ): Promise<void>;
  createTable(
    datasetId: string,
    tableId: string,
    schema: BigQueryTableSchema,
    options?: { description?: string }
  ): Promise<void>;
  deleteTable(datasetId: string, tableId: string): Promise<void>;
  tableExists(datasetId: string, tableId: string): Promise<boolean>;
  getTableMetadata(datasetId: string, tableId: string): Promise<FBOLambda.UnknownRecord>;
  createDataset(datasetId: string, options?: { location?: string; description?: string }): Promise<void>;
  deleteDataset(datasetId: string, options?: { force?: boolean }): Promise<void>;
  datasetExists(datasetId: string): Promise<boolean>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
