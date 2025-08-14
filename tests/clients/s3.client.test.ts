import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Client } from '@aws-sdk/client-s3';

// Use vi.hoisted to ensure proper mock setup
const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}));

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: mockSend,
  })),
  PutObjectCommand: vi.fn((input) => ({ input })),
  GetObjectCommand: vi.fn((input) => ({ input })),
  HeadObjectCommand: vi.fn((input) => ({ input })),
}));

// Mock config
vi.mock('@/config', () => ({
  config: {
    aws: {
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
    },
  },
}));

// Mock utils
vi.mock('@/utils', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  })),
}));

// Import after mocking
import { createS3Client, s3Client } from '@/clients/s3.client';

describe('S3Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createS3Client', () => {
    it('should create S3 client instance', () => {
      const client = createS3Client();
      expect(client).toBeDefined();
      expect(typeof client.uploadFile).toBe('function');
      expect(typeof client.getFile).toBe('function');
      expect(typeof client.getObjectMetadata).toBe('function');
    });

    it('should return same instance (singleton pattern)', () => {
      const client1 = createS3Client();
      const client2 = createS3Client();
      expect(client1).toBe(client2);
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const body = Buffer.from('test content');

      mockSend.mockResolvedValue({});

      await client.uploadFile(bucketName, key, body);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key,
            Body: body,
            ServerSideEncryption: 'AES256',
          },
        })
      );
    });

    it('should handle upload errors', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const body = Buffer.from('test content');
      const error = new Error('Upload failed');

      mockSend.mockRejectedValue(error);

      await expect(client.uploadFile(bucketName, key, body)).rejects.toThrow('Upload failed');
    });

    it('should upload string content', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const body = 'test string content';

      mockSend.mockResolvedValue({});

      await client.uploadFile(bucketName, key, body);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key,
            Body: body,
            ServerSideEncryption: 'AES256',
          },
        })
      );
    });
  });

  describe('getFile', () => {
    it('should download file successfully', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const testContent = 'test file content';

      // Mock ReadableStream
      const mockStream = {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(testContent) })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        }),
      };

      mockSend.mockResolvedValue({
        Body: mockStream,
      });

      const result = await client.getFile(bucketName, key);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key,
          },
        })
      );
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe(testContent);
    });

    it('should handle missing body in response', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';

      mockSend.mockResolvedValue({
        Body: null,
      });

      await expect(client.getFile(bucketName, key)).rejects.toThrow('No body in S3 response');
    });

    it('should handle download errors', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const error = new Error('Download failed');

      mockSend.mockRejectedValue(error);

      await expect(client.getFile(bucketName, key)).rejects.toThrow('Download failed');
    });
  });

  describe('getObjectMetadata', () => {
    it('should get object metadata successfully', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';

      const mockResponse = {
        ContentLength: 1024,
        LastModified: new Date('2023-01-01'),
        ETag: '"abc123"',
        ContentType: 'application/json',
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await client.getObjectMetadata(bucketName, key);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key,
          },
        })
      );
      expect(result).toEqual({
        bucket: bucketName,
        key,
        size: 1024,
        lastModified: new Date('2023-01-01'),
        etag: '"abc123"',
        contentType: 'application/json',
      });
    });

    it('should handle missing response from S3', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';

      mockSend.mockResolvedValue(null);

      await expect(client.getObjectMetadata(bucketName, key)).rejects.toThrow('No response from S3');
    });

    it('should handle metadata with default values', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';

      const mockResponse = {
        ContentLength: undefined,
        LastModified: undefined,
        ETag: undefined,
        ContentType: undefined,
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await client.getObjectMetadata(bucketName, key);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key,
          },
        })
      );
      expect(result).toEqual({
        bucket: bucketName,
        key,
        size: 0,
        lastModified: expect.any(Date),
        etag: '',
      });
    });

    it('should handle metadata errors', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const error = new Error('Metadata failed');

      mockSend.mockRejectedValue(error);

      await expect(client.getObjectMetadata(bucketName, key)).rejects.toThrow('Metadata failed');
    });
  });

  describe('stream handling edge cases', () => {
    it('should handle stream read errors', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';

      // Mock ReadableStream with read error
      const mockStream = {
        getReader: () => ({
          read: vi.fn().mockRejectedValue(new Error('Stream read error')),
          releaseLock: vi.fn(),
        }),
      };

      mockSend.mockResolvedValue({
        Body: mockStream,
      });

      await expect(client.getFile(bucketName, key)).rejects.toThrow('Stream read error');
    });

    it('should handle empty stream', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';

      // Mock ReadableStream that's immediately done
      const mockStream = {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        }),
      };

      mockSend.mockResolvedValue({
        Body: mockStream,
      });

      const result = await client.getFile(bucketName, key);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(0);
    });

    it('should handle multiple chunks in stream', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const chunk1 = 'first chunk ';
      const chunk2 = 'second chunk';

      // Mock ReadableStream with multiple chunks
      const mockStream = {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunk1) })
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode(chunk2) })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        }),
      };

      mockSend.mockResolvedValue({
        Body: mockStream,
      });

      const result = await client.getFile(bucketName, key);
      expect(result.toString()).toBe(chunk1 + chunk2);
    });
  });

  describe('upload with options', () => {
    it('should upload file with custom content type', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.json';
      const body = JSON.stringify({ test: 'data' });
      const contentType = 'application/json';

      mockSend.mockResolvedValue({});

      await client.uploadFile(bucketName, key, body, { ContentType: contentType });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key,
            Body: body,
            ServerSideEncryption: 'AES256',
            ContentType: contentType,
          },
        })
      );
    });

    it('should upload file with metadata', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const body = 'test content';
      const metadata = { 'custom-field': 'custom-value' };

      mockSend.mockResolvedValue({});

      await client.uploadFile(bucketName, key, body, { Metadata: metadata });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key,
            Body: body,
            ServerSideEncryption: 'AES256',
            Metadata: metadata,
          },
        })
      );
    });

    it('should upload file with cache control', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const body = 'test content';
      const cacheControl = 'max-age=3600';

      mockSend.mockResolvedValue({});

      await client.uploadFile(bucketName, key, body, { CacheControl: cacheControl });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            Bucket: bucketName,
            Key: key,
            Body: body,
            ServerSideEncryption: 'AES256',
            CacheControl: cacheControl,
          },
        })
      );
    });
  });

  describe('error handling', () => {
    it('should handle AWS SDK errors with proper error wrapping', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';
      const body = 'test content';

      const awsError = new Error('AWS SDK Error');
      awsError.name = 'NoSuchBucket';
      mockSend.mockRejectedValue(awsError);

      await expect(client.uploadFile(bucketName, key, body)).rejects.toThrow('AWS SDK Error');
    });

    it('should handle network timeout errors', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';

      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockSend.mockRejectedValue(timeoutError);

      await expect(client.getFile(bucketName, key)).rejects.toThrow('Network timeout');
    });

    it('should handle access denied errors', async () => {
      const client = createS3Client();
      const bucketName = 'test-bucket';
      const key = 'test-file.txt';

      const accessError = new Error('Access denied');
      accessError.name = 'AccessDenied';
      mockSend.mockRejectedValue(accessError);

      await expect(client.getObjectMetadata(bucketName, key)).rejects.toThrow('Access denied');
    });
  });

  describe('default export', () => {
    it('should export default s3Client instance', () => {
      expect(s3Client).toBeDefined();
      expect(typeof s3Client.uploadFile).toBe('function');
      expect(typeof s3Client.getFile).toBe('function');
      expect(typeof s3Client.getObjectMetadata).toBe('function');
    });
  });
});
