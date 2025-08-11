import { describe, it, expect, vi } from 'vitest';
import {
  createResponse,
  createSuccessResponse,
  createErrorResponse,
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
  generateId
} from '@/utils';

describe('Helpers', () => {
  describe('createResponse', () => {
    it('should create a response with default headers', () => {
      const response = createResponse(200, { success: true, data: 'test' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('{"success":true,"data":"test"}');
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Powered-By': 'Yummy-FBO-Lambda'
      });
    });

    it('should create a response with custom headers', () => {
      const customHeaders = { 'Custom-Header': 'value' };
      const response = createResponse(201, { success: true }, customHeaders);
      
      expect(response.headers).toEqual({
        'Content-Type': 'application/json',
        'X-Powered-By': 'Yummy-FBO-Lambda',
        'Custom-Header': 'value'
      });
    });
  });

  describe('createSuccessResponse', () => {
    it('should create a success response with default status code', () => {
      const response = createSuccessResponse('test data');
      
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBe('test data');
    });

    it('should create a success response with custom status code and message', () => {
      const response = createSuccessResponse('test data', 'Custom message', 201);
      
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBe('test data');
      expect(body.message).toBe('Custom message');
    });
  });

  describe('createErrorResponse', () => {
    it('should create an error response with default status code', () => {
      const response = createErrorResponse('Test error');
      
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Test error');
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should create an error response with code and details', () => {
      const response = createErrorResponse('Test error', 400, 'VALIDATION_ERROR', { field: 'email' });
      
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Test error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toEqual({ field: 'email' });
    });

    it('should create an error response without details when details is undefined', () => {
      const response = createErrorResponse('Test error', 400, 'VALIDATION_ERROR', undefined);
      
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Test error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toBeUndefined();
    });

    it('should create an error response with null details', () => {
      const response = createErrorResponse('Test error', 400, 'VALIDATION_ERROR', null);
      
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Test error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toEqual(null);
    });

    it('should create an error response with empty object details', () => {
      const response = createErrorResponse('Test error', 400, 'VALIDATION_ERROR', {});
      
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe('Test error');
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details).toEqual({});
    });
  });

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
});