/**
 * Response and API Types
 */

// Lambda Response Types
export interface LambdaResponse {
  statusCode: number;
  headers?: FBOLambda.StringRecord;
  body: string;
  isBase64Encoded?: boolean;
}

// API Response Types
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: FBOLambda.UnknownRecord;
  };
  timestamp: string;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// File Operation Types
export interface FileMetadata {
  bucket: string;
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
}

export interface UploadResult {
  success: boolean;
  fileKey: string;
  bucket: string;
  size: number;
  uploadTime: string;
  metadata?: FileMetadata;
}

export interface DownloadResult {
  success: boolean;
  data: Buffer;
  metadata: FileMetadata;
  downloadTime: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database?: 'connected' | 'disconnected' | 'error';
    external_apis?: 'available' | 'unavailable' | 'error';
  };
}