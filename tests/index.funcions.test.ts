import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../src/index.funcions';
import type { S3Event, CustomEvent } from '../src/@types';
import type { Context } from 'aws-lambda';

// Mock the config module
vi.mock('../src/config', () => ({
  config: {
    aws: {
      s3BucketName: 'test-bucket',
      fileRequestPrefix: 'requests',
      fileResponsePrefix: 'responses',
    },
    sftp: {
      host: 'test-sftp.example.com',
      port: 22,
      username: 'test-user',
      password: 'test-password',
      uploadPath: '/upload',
      downloadPath: '/download',
    },
    finance: {
      baseUrl: 'https://test-finance-api.example.com',
      apiKey: 'test-api-key',
      dispersionEndpoint: '/api/v1/dispersion',
    },
  },
  isDevelopment: false,
  NODE_ENV: 'test',
  ALLOWED_S3_BUCKETS: ['test-bucket'],
}));

describe('Lambda Handler', () => {
  let mockContext: Context;

  beforeEach(() => {
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '512',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2024/01/01/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: vi.fn(),
      fail: vi.fn(),
      succeed: vi.fn(),
    };
  });

  describe('S3 Event Processing', () => {
    it('should process S3 event successfully', async () => {
      const s3Event: S3Event = {
        Records: [
          {
            eventVersion: '2.1',
            eventSource: 'aws:s3',
            awsRegion: 'us-east-1',
            eventTime: '2024-01-01T12:00:00.000Z',
            eventName: 's3:ObjectCreated:Put',
            userIdentity: {
              principalId: 'test-principal',
            },
            requestParameters: {
              sourceIPAddress: '127.0.0.1',
            },
            responseElements: {
              'x-amz-request-id': 'test-request-id',
              'x-amz-id-2': 'test-id-2',
            },
            s3: {
              s3SchemaVersion: '1.0',
              configurationId: 'test-config',
              bucket: {
                name: 'test-bucket',
                ownerIdentity: {
                  principalId: 'test-owner',
                },
                arn: 'arn:aws:s3:::test-bucket',
              },
              object: {
                key: 'requests/test-file.csv',
                size: 1024,
                eTag: 'test-etag',
                sequencer: 'test-sequencer',
              },
            },
          },
        ],
      };

      const result = await handler(s3Event, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toContain('S3 event processed successfully');
    });
  });

  describe('Custom Event Processing', () => {
    it('should process download_bank_files action successfully', async () => {
      const customEvent: CustomEvent = {
        action: 'download_bank_files',
        payload: {},
      };

      const result = await handler(customEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toContain('download_bank_files');
    });

    it('should process process_specific_file action successfully', async () => {
      const customEvent: CustomEvent = {
        action: 'process_specific_file',
        payload: {
          fileName: 'test-file.csv',
        },
      };

      const result = await handler(customEvent, mockContext);

      expect(result.statusCode).toBe(200);
      expect(result.body).toContain('process_specific_file');
    });

    it('should handle unknown action with error', async () => {
      const customEvent: CustomEvent = {
        action: 'unknown_action' as any,
        payload: {},
      };

      const result = await handler(customEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('Unsupported custom action');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown event type', async () => {
      const unknownEvent = {
        unknownField: 'unknown',
      } as any;

      const result = await handler(unknownEvent, mockContext);

      expect(result.statusCode).toBe(500);
      expect(result.body).toContain('Unsupported event type');
    });
  });
});