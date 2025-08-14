/**
 * @fileoverview AWS SDK Mock Configuration
 *
 * Centralized mock configuration for AWS SDK services.
 * This mock provides consistent behavior across all tests
 * that use AWS services like S3, DynamoDB, etc.
 */

import { vi } from 'vitest';

// Mock S3 Client
export const mockS3Instance = {
	send: vi.fn(),
	config: {
		region: 'us-east-1',
	},
};

// Mock S3 Commands
export const mockS3Commands = {
	GetObjectCommand: vi.fn(),
	PutObjectCommand: vi.fn(),
	DeleteObjectCommand: vi.fn(),
	ListObjectsV2Command: vi.fn(),
	HeadObjectCommand: vi.fn(),
};

// Mock S3 Client constructor
export const mockS3Client = vi.fn(() => mockS3Instance);

/**
 * Reset all AWS mocks to their initial state
 */
export const resetAWSMocks = () => {
	vi.clearAllMocks();
	mockS3Client.mockReturnValue(mockS3Instance);
};

/**
 * Setup successful S3 response mock
 */
export const mockS3SuccessResponse = <T>(data: T) => ({
	$metadata: {
		httpStatusCode: 200,
		requestId: 'mock-request-id',
	},
	...data,
});

/**
 * Setup S3 error response mock
 */
export const mockS3ErrorResponse = (code: string, message: string) => {
	const error = new Error(message);
	(error as any).name = code;
	(error as any).$metadata = {
		httpStatusCode: 404,
		requestId: 'mock-request-id',
	};
	return error;
};

// Export AWS SDK mocks
export const awsMocks = {
	'@aws-sdk/client-s3': {
		S3Client: mockS3Client,
		...mockS3Commands,
	},
};
