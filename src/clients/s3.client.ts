import {
  S3Client as AwsS3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import type { S3ClientInterface, Logger, FileMetadata } from '@/types';
import { config } from '@/config';
import { createLogger } from '@/utils';

/**
 * Converts a ReadableStream to Buffer
 */
async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}

/**
 * Singleton S3 Client with optimized configuration for AWS Lambda
 */
class S3ClientSingleton implements S3ClientInterface {
  private static instance: S3ClientSingleton;
  private readonly client: AwsS3Client;
  private readonly logger: Logger;

  private constructor() {
    this.logger = createLogger('S3Client');

    const s3Config: S3ClientConfig = {
      region: config.aws.region,
      maxAttempts: 3,
      retryMode: 'adaptive',
    };

    // Only add credentials if they are provided (for local development)
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      s3Config.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }

    this.client = new AwsS3Client(s3Config);
    this.logger.info('S3 Client initialized', { region: config.aws.region });
  }

  public static getInstance(): S3ClientSingleton {
    if (!S3ClientSingleton.instance) {
      S3ClientSingleton.instance = new S3ClientSingleton();
    }
    return S3ClientSingleton.instance;
  }

  /**
   * Uploads a file to S3
   */
  async uploadFile(
    bucketName: string,
    key: string,
    body: Buffer | Uint8Array | string,
    options?: {
      ContentType?: string;
      Metadata?: Record<string, string>;
      CacheControl?: string;
      [key: string]: unknown;
    }
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ServerSideEncryption: 'AES256',
        ...options,
      });

      this.logger.info('Uploading file to S3', {
        bucket: bucketName,
        key,
        size: body.length,
      });

      await this.client.send(command);

      this.logger.info('File uploaded successfully', {
        bucket: bucketName,
        key,
      });
    } catch (error) {
      this.logger.error('Failed to upload file to S3', error as Error, {
        bucket: bucketName,
        key,
      });
      throw error;
    }
  }

  /**
   * Downloads a file from S3
   */
  async getFile(bucketName: string, key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      this.logger.info('Downloading file from S3', {
        bucket: bucketName,
        key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error('No body in S3 response');
      }

      const buffer = await streamToBuffer(response.Body as ReadableStream);

      this.logger.info('File downloaded successfully', {
        bucket: bucketName,
        key,
        size: buffer.length,
      });

      return buffer;
    } catch (error) {
      this.logger.error('Failed to download file from S3', error as Error, {
        bucket: bucketName,
        key,
      });
      throw error;
    }
  }

  /**
   * Gets metadata for an S3 object
   */
  async getObjectMetadata(bucketName: string, key: string): Promise<FileMetadata> {
    try {
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      this.logger.info('Fetching metadata for S3 object', {
        bucket: bucketName,
        key,
      });

      const response = await this.client.send(command);

      if (!response) {
        throw new Error('No response from S3');
      }

      const metadata: FileMetadata = {
        bucket: bucketName,
        key,
        size: response.ContentLength ?? 0,
        lastModified: response.LastModified ?? new Date(),
        etag: response.ETag ?? '',
        ...(response.ContentType && { contentType: response.ContentType }),
      };

      this.logger.info('Metadata retrieved successfully', {
        bucket: bucketName,
        key,
        size: metadata.size,
      });

      return metadata;
    } catch (error) {
      this.logger.error('Failed to get object metadata', error as Error, {
        bucket: bucketName,
        key,
      });
      throw error;
    }
  }
}

/**
 * Factory function to get S3 client instance
 */
export function createS3Client(): S3ClientInterface {
  return S3ClientSingleton.getInstance();
}

/**
 * Default S3 client instance
 */
export const s3Client = createS3Client();
