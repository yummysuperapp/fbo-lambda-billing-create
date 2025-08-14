/**
 * @fileoverview Test Fixtures
 *
 * Centralized test data fixtures used across multiple test files.
 * This ensures consistency and reduces duplication in test data.
 */

// User fixtures
export const userFixtures = {
	validUser: {
		id: 'user-123',
		email: 'test@example.com',
		name: 'Test User',
		createdAt: new Date('2023-01-01T00:00:00.000Z'),
		updatedAt: new Date('2023-01-01T00:00:00.000Z'),
	},
	invalidUser: {
		id: '',
		email: 'invalid-email',
		name: '',
	},
};

// Finance fixtures
export const financeFixtures = {
	validTransaction: {
		id: 'txn-123',
		amount: 100.5,
		currency: 'USD',
		type: 'credit',
		description: 'Test transaction',
		timestamp: new Date('2023-01-01T00:00:00.000Z'),
	},
	invalidTransaction: {
		id: '',
		amount: -1,
		currency: 'INVALID',
		type: 'unknown',
	},
	exchangeRates: {
		USD: 1.0,
		EUR: 0.85,
		GBP: 0.73,
		JPY: 110.0,
	},
};

// HTTP fixtures
export const httpFixtures = {
	successResponse: {
		data: { message: 'Success' },
		status: 200,
		statusText: 'OK',
		headers: { 'content-type': 'application/json' },
	},
	errorResponse: {
		data: { error: 'Not Found' },
		status: 404,
		statusText: 'Not Found',
		headers: { 'content-type': 'application/json' },
	},
	requestConfig: {
		timeout: 5000,
		headers: { Authorization: 'Bearer token' },
		retries: 3,
	},
};

// S3 fixtures
export const s3Fixtures = {
	bucketName: 'test-bucket',
	validKey: 'test-file.txt',
	validContent: 'Test file content',
	validMetadata: {
		'Content-Type': 'text/plain',
		'Cache-Control': 'max-age=3600',
	},
	listObjectsResponse: {
		Contents: [
			{
				Key: 'file1.txt',
				Size: 1024,
				LastModified: new Date('2023-01-01T00:00:00.000Z'),
			},
			{
				Key: 'file2.txt',
				Size: 2048,
				LastModified: new Date('2023-01-02T00:00:00.000Z'),
			},
		],
		IsTruncated: false,
	},
};

// Database fixtures
export const databaseFixtures = {
	mongodb: {
		validDocument: {
			_id: '507f1f77bcf86cd799439011',
			name: 'Test Document',
			value: 42,
			createdAt: new Date('2023-01-01T00:00:00.000Z'),
		},
		insertResult: {
			acknowledged: true,
			insertedId: '507f1f77bcf86cd799439011',
		},
		updateResult: {
			acknowledged: true,
			modifiedCount: 1,
			matchedCount: 1,
		},
	},
	postgresql: {
		validRow: {
			id: 1,
			name: 'Test Row',
			value: 42,
			created_at: new Date('2023-01-01T00:00:00.000Z'),
		},
		queryResult: {
			rows: [
				{ id: 1, name: 'Row 1', value: 10 },
				{ id: 2, name: 'Row 2', value: 20 },
			],
			rowCount: 2,
			command: 'SELECT',
		},
	},
};

// Error fixtures
export const errorFixtures = {
	validationError: {
		name: 'ValidationError',
		message: 'Validation failed',
		details: ['Field is required', 'Invalid format'],
	},
	networkError: {
		name: 'NetworkError',
		message: 'Network request failed',
		code: 'ECONNREFUSED',
	},
	authenticationError: {
		name: 'AuthenticationError',
		message: 'Invalid credentials',
		statusCode: 401,
	},
};

// Environment fixtures
export const environmentFixtures = {
	test: {
		NODE_ENV: 'test',
		LOG_LEVEL: 'error',
		DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
		MONGODB_URI: 'mongodb://localhost:27017/test',
		AWS_REGION: 'us-east-1',
		S3_BUCKET: 'test-bucket',
	},
	development: {
		NODE_ENV: 'development',
		LOG_LEVEL: 'debug',
		DATABASE_URL: 'postgresql://dev:dev@localhost:5432/dev',
		MONGODB_URI: 'mongodb://localhost:27017/dev',
		AWS_REGION: 'us-west-2',
		S3_BUCKET: 'dev-bucket',
	},
};
