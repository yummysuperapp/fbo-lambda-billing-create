/**
 * @fileoverview Database Mocks Configuration
 *
 * Centralized mock configuration for database clients.
 * This includes mocks for MongoDB and PostgreSQL clients.
 */

import { vi } from 'vitest';

// MongoDB Mock
export const mockMongoCollection = {
	findOne: vi.fn(),
	find: vi.fn(),
	insertOne: vi.fn(),
	insertMany: vi.fn(),
	updateOne: vi.fn(),
	updateMany: vi.fn(),
	deleteOne: vi.fn(),
	deleteMany: vi.fn(),
	countDocuments: vi.fn(),
	aggregate: vi.fn(),
	createIndex: vi.fn(),
	dropIndex: vi.fn(),
};

export const mockMongoDb = {
	collection: vi.fn(() => mockMongoCollection),
	admin: vi.fn(),
	stats: vi.fn(),
};

export const mockMongoClient = {
	connect: vi.fn(),
	close: vi.fn(),
	db: vi.fn(() => mockMongoDb),
	isConnected: vi.fn(() => true),
	topology: {
		isConnected: vi.fn(() => true),
	},
};

// PostgreSQL Mock
export const mockPgPool = {
	query: vi.fn(),
	connect: vi.fn(),
	end: vi.fn(),
	totalCount: 0,
	idleCount: 0,
	waitingCount: 0,
};

export const mockPgClient = {
	query: vi.fn(),
	connect: vi.fn(),
	end: vi.fn(),
	release: vi.fn(),
};

/**
 * Reset all database mocks to their initial state
 */
export const resetDatabaseMocks = () => {
	vi.clearAllMocks();
};

/**
 * Setup successful MongoDB response mock
 */
export const mockMongoSuccessResponse = <T>(data: T) => ({
	acknowledged: true,
	insertedId: 'mock-id',
	modifiedCount: 1,
	deletedCount: 1,
	...data,
});

/**
 * Setup MongoDB error response mock
 */
export const mockMongoErrorResponse = (message: string, code = 11000) => {
	const error = new Error(message);
	(error as any).code = code;
	(error as any).name = 'MongoError';
	return error;
};

/**
 * Setup successful PostgreSQL response mock
 */
export const mockPgSuccessResponse = <T>(rows: T[], rowCount = 1) => ({
	rows,
	rowCount,
	command: 'SELECT',
	oid: 0,
	fields: [],
});

/**
 * Setup PostgreSQL error response mock
 */
export const mockPgErrorResponse = (message: string, code = '23505') => {
	const error = new Error(message);
	(error as any).code = code;
	(error as any).name = 'PostgresError';
	return error;
};

// Export database mocks
export const databaseMocks = {
	mongodb: {
		MongoClient: vi.fn(() => mockMongoClient),
	},
	pg: {
		Pool: vi.fn(() => mockPgPool),
		Client: vi.fn(() => mockPgClient),
	},
};
