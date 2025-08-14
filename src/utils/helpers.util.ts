import { APIGatewayProxyResult, APIGatewayProxyEvent, APIGatewayEvent } from 'aws-lambda';
import { HttpStatusType, HttpMethodType, HttpStatusMessageType } from '@/types';

type LambdaHttpEvent = APIGatewayProxyEvent | APIGatewayEvent | Record<string, unknown>;

/**
 * Creates a standardized Lambda response
 */
export const createResponse = (
  statusCode: HttpStatusType,
  httpStatusMessage?: HttpStatusMessageType,
  body?: FBOLambda.UnknownRecord,
  headers?: Record<string, string>,
  isBase64Encoded = false,
): APIGatewayProxyResult => ({
    statusCode,
    isBase64Encoded,
    headers: {
      'Content-Type': 'application/json',
      'X-Powered-By': 'Yummy-FBO-Lambda',
      ...(headers || {}),
    },
    body: JSON.stringify({
      message: httpStatusMessage,
      ...(body || {})
    }),
});

/**
 * Safely parses JSON with error handling
 */
export function safeJsonParse<T = unknown>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Delays execution for the specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }

      const delayMs = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await delay(delayMs);
    }
  }

  // This should never be reached, but TypeScript requires it for exhaustiveness
  throw lastError || new Error('Unexpected error in retryWithBackoff');
}

/**
 * Validates that a value is not null or undefined
 */
export function assertExists<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Type guard to check if an error is an instance of Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}

/**
 * Sanitizes file names for safe usage
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Formats bytes to human readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))  } ${  sizes[i]}`;
}

/**
 * Checks if a string is a valid URL
 */
export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncates a string to a maximum length
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)  }...`;
}

/**
 * Generates a unique identifier
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Type guard to check if event is APIGatewayProxyEvent
 */
export const isHttpEvent = (event: LambdaHttpEvent): boolean => {
  // Check for APIGatewayProxyEvent structure
  if ('requestContext' in event && 'headers' in event && 'rawQueryString' in event) {
    return true;
  }
  // Check for APIGatewayEvent structure
  if ('httpMethod' in event && 'path' in event && 'requestContext' in event) {
    return true;
  }
  return false;
};

/**
 * Check if event is HTTP event and get HTTP method
 */
export const getHttpEventMethod = (event: LambdaHttpEvent): HttpMethodType | null => {
  if (!isHttpEvent(event)) {
    return null;
  }
  
  // Try APIGatewayProxyEvent structure first
  if ('requestContext' in event && typeof event.requestContext === 'object' && event.requestContext !== null && 'httpMethod' in event.requestContext) {
    return (event.requestContext as { httpMethod: string }).httpMethod as HttpMethodType;
  }
  
  // Try APIGatewayEvent structure
  if ('httpMethod' in event && typeof event.httpMethod === 'string') {
    return event.httpMethod as HttpMethodType;
  }
  
  return null;
};
