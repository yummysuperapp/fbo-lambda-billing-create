import { vi } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock AWS SDK
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(() => ({
    send: vi.fn(),
  })),
  GetObjectCommand: vi.fn(),
  PutObjectCommand: vi.fn(),
  HeadObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: vi.fn(() => ({
    send: vi.fn(),
  })),
  SendMessageCommand: vi.fn(),
  ReceiveMessageCommand: vi.fn(),
  DeleteMessageCommand: vi.fn(),
  PurgeQueueCommand: vi.fn(),
}));

// Mock Axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock Logger
vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.FINANCE_API_BASE_URL = 'https://test-finance-api.example.com';
process.env.FINANCE_API_KEY = 'test-api-key';