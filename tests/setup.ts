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
process.env.VERTICAL = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.ALLOWED_S3_BUCKETS = 'test-bucket';
process.env.AWS_APP_NAME = 'test-app';
process.env.FINANCE_BASE_URL = 'https://test-finance-api.example.com';
process.env.FINANCE_API_KEY = 'test-api-key';
process.env.PG_HOST = 'localhost';
process.env.PG_DATABASE = 'test_db';
process.env.PG_USER = 'test_user';
process.env.PG_PASSWORD = 'test_password';
process.env.MONGO_URI = 'mongodb://localhost:27017';
process.env.MONGO_DATABASE = 'test_db';
process.env.N8N_HOST = 'https://test-n8n.example.com';
process.env.N8N_API_KEY = 'test-n8n-key';
process.env.BIGQUERY_PROJECT_ID = 'test-project';
process.env.BIGQUERY_DATASET_ID = 'test-dataset';
process.env.BIGQUERY_LOCATION = 'US';
process.env.BIGQUERY_MAX_RETRIES = '3';
process.env.BIGQUERY_AUTO_RETRY = 'true';