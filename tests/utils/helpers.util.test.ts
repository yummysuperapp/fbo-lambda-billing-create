import { describe, it, expect, vi } from 'vitest';
import {
  createResponse,
  safeJsonParse,
  delay,
  retryWithBackoff,
  assertExists,
  isError,
  getErrorMessage,
  sanitizeFileName,
  formatBytes,
  isValidUrl,
  truncateString,
  generateId,
  isHttpEvent,
  getHttpEventMethod
} from '@/utils';

describe('Helpers', () => {
  describe('createResponse', () => {
    it('should create a response with default headers and message only', () => {
      const response = createResponse(200, 'OK');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('{"message":"OK"}');
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Powered-By': 'Yummy-FBO-Lambda'
      });
    });

    it('should create a response with message and merged body fields', () => {
      const body = { success: true, data: 'test' } as const;
      const response = createResponse(201, 'Created', body);
      
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({ message: 'Created', ...body });
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Powered-By': 'Yummy-FBO-Lambda'
      });
    });

    it('should create a response with custom headers and base64 flag', () => {
      const customHeaders = { 'Custom-Header': 'value' } as const;
      const response = createResponse(202, 'Accepted', { queued: true }, customHeaders, true);
      
      expect(response.isBase64Encoded).toBe(true);
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Powered-By': 'Yummy-FBO-Lambda',
        'Custom-Header': 'value'
      });
      expect(JSON.parse(response.body)).toEqual({ message: 'Accepted', queued: true });
    });
  });

  // Removed tests for createSuccessResponse and createErrorResponse as those helpers no longer exist in the implementation

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      const result = safeJsonParse('{"test": "value"}');
      expect(result).toEqual({ test: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const result = safeJsonParse('invalid json');
      expect(result).toBeNull();
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(operation, 3, 10);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('persistent error'));
      
      await expect(retryWithBackoff(operation, 2, 10)).rejects.toThrow('persistent error');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should handle non-Error rejections', async () => {
      const operation = vi.fn().mockRejectedValue('string error');
      
      await expect(retryWithBackoff(operation, 1, 10)).rejects.toThrow('string error');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should respect maxDelay parameter', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('fail'));
      const start = Date.now();
      
      await expect(retryWithBackoff(operation, 1, 1000, 50)).rejects.toThrow('fail');
      const elapsed = Date.now() - start;
      
      // Should be limited by maxDelay (50ms) rather than baseDelay * 2^attempt (1000ms)
      expect(elapsed).toBeLessThan(200);
    });

    it('should handle zero retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('immediate fail'));
      
      await expect(retryWithBackoff(operation, 0, 10)).rejects.toThrow('immediate fail');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should handle edge case with undefined lastError', async () => {
      // This test covers the theoretical case where the loop exits without setting lastError
      // This is mainly for TypeScript flow analysis coverage
      const operation = vi.fn();
      
      // Mock a scenario where operation throws on first call but somehow the loop exits
      operation.mockImplementationOnce(() => {
        throw new Error('test error');
      });
      
      await expect(retryWithBackoff(operation, 0, 10)).rejects.toThrow('test error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should cover the fallback error throw with zero retries and no error', async () => {
      // This test attempts to cover the edge case where maxRetries is 0
      // and the operation succeeds on first try, but we force an error scenario
      const mockOperation = vi.fn().mockImplementation(() => {
        // Simulate a scenario where the operation doesn't throw but also doesn't return
        throw undefined; // This will be caught and converted to an error
      });
      
      await expect(retryWithBackoff(mockOperation, 0, 100)).rejects.toThrow();
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should throw fallback error when lastError is undefined', async () => {
      // We need to manipulate the function to bypass the normal flow
      // and reach the fallback error line. This requires mocking the internal state.
      //const originalRetryWithBackoff = (await import('../../src/utils/helpers.util')).retryWithBackoff;
      
      // Create a spy that will force the fallback condition
      const mockOperation = vi.fn().mockRejectedValue(undefined);
      
      // Test with negative maxRetries to potentially skip the loop
      await expect(retryWithBackoff(mockOperation, -1, 100)).rejects.toThrow('Unexpected error in retryWithBackoff');
    });
  });

  describe('assertExists', () => {
    it('should not throw for valid values', () => {
      expect(() => assertExists('value', 'error')).not.toThrow();
      expect(() => assertExists(0, 'error')).not.toThrow();
      expect(() => assertExists(false, 'error')).not.toThrow();
    });

    it('should throw for null or undefined', () => {
      expect(() => assertExists(null, 'Value is null')).toThrow('Value is null');
      expect(() => assertExists(undefined, 'Value is undefined')).toThrow('Value is undefined');
    });
  });

  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isError('string')).toBe(false);
      expect(isError(123)).toBe(false);
      expect(isError({})).toBe(false);
      expect(isError(null)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error instances', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error');
    });

    it('should return string errors as-is', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    it('should return default message for unknown errors', () => {
      expect(getErrorMessage(123)).toBe('Unknown error occurred');
      expect(getErrorMessage({})).toBe('Unknown error occurred');
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace invalid characters with underscores', () => {
      expect(sanitizeFileName('file name.txt')).toBe('file_name.txt');
      expect(sanitizeFileName('file@#$%name.txt')).toBe('file_name.txt');
    });

    it('should remove leading and trailing underscores', () => {
      expect(sanitizeFileName('_filename_')).toBe('filename');
    });

    it('should collapse multiple underscores', () => {
      expect(sanitizeFileName('file___name')).toBe('file_name');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 1)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });

    it('should handle negative decimal places', () => {
      expect(formatBytes(1536, -1)).toBe('2 KB');
      expect(formatBytes(1536, -5)).toBe('2 KB');
    });

    it('should handle very large numbers', () => {
      expect(formatBytes(1099511627776)).toBe('1 TB');
      expect(formatBytes(1125899906842624)).toBe('1 PB');
    });

    it('should handle fractional bytes', () => {
      expect(formatBytes(512)).toBe('512 Bytes');
      expect(formatBytes(1.5)).toBe('1.5 Bytes');
    });

    it('should handle edge case with exactly 1 byte', () => {
      expect(formatBytes(1)).toBe('1 Bytes');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('invalid://url with spaces')).toBe(false);
      expect(isValidUrl('just-text')).toBe(false);
      expect(isValidUrl('://missing-protocol')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
    });
  });

  describe('truncateString', () => {
    it('should not truncate short strings', () => {
      expect(truncateString('short', 10)).toBe('short');
    });

    it('should truncate long strings', () => {
      expect(truncateString('this is a very long string', 10)).toBe('this is...');
    });

    it('should handle exact length', () => {
      expect(truncateString('exactly10c', 10)).toBe('exactly10c');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should generate IDs with expected format', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('isHttpEvent', () => {
    it('should return true for APIGatewayProxyEvent-like objects', () => {
      const eventLike = {
        requestContext: {},
        httpMethod: 'GET',
        path: '/test'
      } as unknown as any;

      expect(isHttpEvent(eventLike as unknown as any)).toBe(true);
    });

    it('should return false for non-HTTP events', () => {
      const nonHttpEvent = { foo: 'bar' } as unknown as any;
      expect(isHttpEvent(nonHttpEvent as unknown as any)).toBe(false);
    });
  });

  describe('getHttpEventMethod', () => {
    it('should return the HTTP method for HTTP events', () => {
      const getEvent = {
        requestContext: {},
        httpMethod: 'POST',
        path: '/resource'
      } as unknown as any;

      expect(getHttpEventMethod(getEvent as unknown as any)).toBe('POST');
    });

    it('should return null for non-HTTP events', () => {
      const nonHttpEvent = { foo: 'bar' } as unknown as any;
      expect(getHttpEventMethod(nonHttpEvent as unknown as any)).toBeNull();
    });
  });
});