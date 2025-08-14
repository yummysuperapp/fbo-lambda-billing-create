import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMongoClient, MongoClient } from '@/clients/mongo.client';
import { MongoError } from '@/interfaces/exceptions';
import { MongoClient as MongoDBClient } from 'mongodb';

// Mock mongodb module
vi.mock('mongodb', () => ({
	MongoClient: vi.fn(),
}));

describe('MongoClient', () => {
	let client: MongoClient;
	let mockMongoClient: any;
	let mockDb: any;
	let mockCollection: any;
	let mockLogger: any;

	const mockConfig = {
		uri: 'mongodb://localhost:27017',
		database: 'test_db',
		maxPoolSize: 10,
		minPoolSize: 1,
		maxIdleTimeMS: 30000,
		serverSelectionTimeoutMS: 30000,
	};

	beforeEach(() => {
		mockLogger = {
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn(),
		};
		mockCollection = {
			findOne: vi.fn(),
			find: vi.fn().mockReturnValue({
				toArray: vi.fn(),
				limit: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				project: vi.fn().mockReturnThis(),
			}),
			insertOne: vi.fn(),
			insertMany: vi.fn(),
			updateOne: vi.fn(),
			updateMany: vi.fn(),
			deleteOne: vi.fn(),
			deleteMany: vi.fn(),
		};

		mockDb = {
			collection: vi.fn().mockReturnValue(mockCollection),
			admin: vi.fn().mockReturnValue({
				ping: vi.fn().mockResolvedValue({}),
			}),
		};

		mockMongoClient = {
			connect: vi.fn().mockResolvedValue(undefined),
			db: vi.fn().mockReturnValue(mockDb),
			close: vi.fn().mockResolvedValue(undefined),
		};

		// Mock the MongoClient constructor
		(MongoDBClient as any).mockImplementation(() => mockMongoClient);

		client = createMongoClient(mockConfig, mockLogger);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('connect', () => {
		it('should connect successfully', async () => {
			await client.connect();

			expect(MongoDBClient).toHaveBeenCalledWith(mockConfig.uri, {
				maxPoolSize: mockConfig.maxPoolSize,
				minPoolSize: mockConfig.minPoolSize,
				maxIdleTimeMS: mockConfig.maxIdleTimeMS,
				serverSelectionTimeoutMS: mockConfig.serverSelectionTimeoutMS,
			});
			expect(mockMongoClient.connect).toHaveBeenCalled();
			expect(mockMongoClient.db).toHaveBeenCalledWith(mockConfig.database);
		});

		it('should throw MongoError on connection failure', async () => {
			const error = new Error('Connection failed');
			mockMongoClient.connect.mockRejectedValue(error);

			await expect(client.connect()).rejects.toThrow(MongoError);
		});
	});

	describe('findOne', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should find one document successfully', async () => {
			const mockDocument = { _id: '1', name: 'test' };
			mockCollection.findOne.mockResolvedValue(mockDocument);

			const result = await client.findOne('users', { name: 'test' });

			expect(result).toEqual(mockDocument);
			expect(mockCollection.findOne).toHaveBeenCalledWith({ name: 'test' });
		});

		it('should return null when document not found', async () => {
			mockCollection.findOne.mockResolvedValue(null);

			const result = await client.findOne('users', { name: 'nonexistent' });

			expect(result).toBeNull();
		});

		it('should throw MongoError on failure', async () => {
			const error = new Error('Find failed');
			mockCollection.findOne.mockRejectedValue(error);

			await expect(client.findOne('users', { name: 'test' })).rejects.toThrow(MongoError);
		});
	});

	describe('findMany', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should find multiple documents successfully', async () => {
			const mockDocuments = [
				{ _id: '1', name: 'test1' },
				{ _id: '2', name: 'test2' },
			];
			mockCollection.find().toArray.mockResolvedValue(mockDocuments);

			const result = await client.findMany('users', { active: true });

			expect(result).toEqual(mockDocuments);
			expect(mockCollection.find).toHaveBeenCalledWith({ active: true });
		});

		it('should apply options correctly', async () => {
			const mockDocuments = [{ _id: '1', name: 'test1' }];
			mockCollection.find().toArray.mockResolvedValue(mockDocuments);

			await client.findMany('users', {}, { limit: 10, skip: 5 });

			expect(mockCollection.find).toHaveBeenCalledWith({});
			expect(mockCollection.find().limit).toHaveBeenCalledWith(10);
			expect(mockCollection.find().skip).toHaveBeenCalledWith(5);
		});
	});

	describe('insertOne', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should insert document successfully', async () => {
			const mockResult = { insertedId: 'new-id', acknowledged: true };
			const document = { name: 'new user' };
			mockCollection.insertOne.mockResolvedValue(mockResult);

			const result = await client.insertOne('users', document);

			expect(result).toEqual({ ...document, _id: 'new-id' });
			expect(mockCollection.insertOne).toHaveBeenCalledWith(document);
		});

		it('should throw MongoError on failure', async () => {
			const error = new Error('Insert failed');
			mockCollection.insertOne.mockRejectedValue(error);

			await expect(client.insertOne('users', { name: 'test' })).rejects.toThrow(MongoError);
		});
	});

	describe('insertMany', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should insert multiple documents successfully', async () => {
			const mockResult = {
				insertedCount: 2,
				insertedIds: { 0: 'id1', 1: 'id2' },
				acknowledged: true,
			};
			const documents = [
				{ name: 'User 1', email: 'user1@example.com' },
				{ name: 'User 2', email: 'user2@example.com' },
			];
			mockCollection.insertMany.mockResolvedValue(mockResult);

			const result = await client.insertMany('users', documents);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({ ...documents[0], _id: 'id1' });
			expect(result[1]).toEqual({ ...documents[1], _id: 'id2' });
			expect(mockCollection.insertMany).toHaveBeenCalledWith(documents);
		});

		it('should throw MongoError on failure', async () => {
			const error = new Error('Insert many failed');
			mockCollection.insertMany.mockRejectedValue(error);

			await expect(client.insertMany('users', [{ name: 'test' }])).rejects.toThrow(MongoError);
		});
	});

	describe('updateOne', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should update document successfully', async () => {
			const mockResult = { matchedCount: 1, modifiedCount: 1, acknowledged: true };
			mockCollection.updateOne.mockResolvedValue(mockResult);

			const result = await client.updateOne('users', { _id: '1' }, { name: 'updated' });

			expect(result).toBe(true);
			expect(mockCollection.updateOne).toHaveBeenCalledWith({ _id: '1' }, { $set: { name: 'updated' } });
		});

		it('should return false when no document is modified', async () => {
			const mockResult = { matchedCount: 1, modifiedCount: 0, acknowledged: true };
			mockCollection.updateOne.mockResolvedValue(mockResult);

			const result = await client.updateOne('users', { _id: '1' }, { name: 'updated' });

			expect(result).toBe(false);
		});

		it('should throw MongoError on failure', async () => {
			const error = new Error('Update failed');
			mockCollection.updateOne.mockRejectedValue(error);

			await expect(client.updateOne('users', { _id: '1' }, { name: 'test' })).rejects.toThrow(MongoError);
		});
	});

	describe('updateMany', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should update multiple documents successfully', async () => {
			const mockResult = { matchedCount: 3, modifiedCount: 3, acknowledged: true };
			mockCollection.updateMany.mockResolvedValue(mockResult);

			const result = await client.updateMany('users', { active: false }, { active: true });

			expect(result).toBe(3);
			expect(mockCollection.updateMany).toHaveBeenCalledWith({ active: false }, { $set: { active: true } });
		});

		it('should return 0 when no documents are modified', async () => {
			const mockResult = { matchedCount: 0, modifiedCount: 0, acknowledged: true };
			mockCollection.updateMany.mockResolvedValue(mockResult);

			const result = await client.updateMany('users', { nonexistent: true }, { name: 'updated' });

			expect(result).toBe(0);
		});

		it('should throw MongoError on failure', async () => {
			const error = new Error('Update many failed');
			mockCollection.updateMany.mockRejectedValue(error);

			await expect(client.updateMany('users', {}, { name: 'test' })).rejects.toThrow(MongoError);
		});
	});

	describe('deleteOne', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should delete document successfully', async () => {
			const mockResult = { deletedCount: 1, acknowledged: true };
			mockCollection.deleteOne.mockResolvedValue(mockResult);

			const result = await client.deleteOne('users', { _id: '1' });

			expect(result).toBe(true);
			expect(mockCollection.deleteOne).toHaveBeenCalledWith({ _id: '1' });
		});

		it('should return false when no document is deleted', async () => {
			const mockResult = { deletedCount: 0, acknowledged: true };
			mockCollection.deleteOne.mockResolvedValue(mockResult);

			const result = await client.deleteOne('users', { _id: '1' });

			expect(result).toBe(false);
		});

		it('should throw MongoError on failure', async () => {
			const error = new Error('Delete failed');
			mockCollection.deleteOne.mockRejectedValue(error);

			await expect(client.deleteOne('users', { _id: '1' })).rejects.toThrow(MongoError);
		});
	});

	describe('deleteMany', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should delete multiple documents successfully', async () => {
			const mockResult = { deletedCount: 3, acknowledged: true };
			mockCollection.deleteMany.mockResolvedValue(mockResult);

			const result = await client.deleteMany('users', { active: false });

			expect(result).toBe(3);
			expect(mockCollection.deleteMany).toHaveBeenCalledWith({ active: false });
		});

		it('should return 0 when no documents are deleted', async () => {
			const mockResult = { deletedCount: 0, acknowledged: true };
			mockCollection.deleteMany.mockResolvedValue(mockResult);

			const result = await client.deleteMany('users', { nonexistent: true });

			expect(result).toBe(0);
		});

		it('should throw MongoError on failure', async () => {
			const error = new Error('Delete many failed');
			mockCollection.deleteMany.mockRejectedValue(error);

			await expect(client.deleteMany('users', {})).rejects.toThrow(MongoError);
		});
	});

	describe('disconnect', () => {
		it('should disconnect successfully', async () => {
			await client.connect();
			mockMongoClient.close.mockResolvedValue(undefined);

			await client.disconnect();

			expect(mockMongoClient.close).toHaveBeenCalled();
		});

		it('should handle disconnect when client is null', async () => {
			const disconnectedClient = createMongoClient(mockConfig, mockLogger);

			// Should not throw when client is null
			await expect(disconnectedClient.disconnect()).resolves.not.toThrow();
		});

		it('should handle ensureConnection when not connected', async () => {
			const disconnectedClient = createMongoClient(mockConfig);
			// Don't call connect() to simulate disconnected state

			await expect(disconnectedClient.findOne('users', { id: 1 })).rejects.toThrow(MongoError);
			// Note: The error is thrown directly from ensureConnection, not logged in findOne
		});

		it('should handle getCollection when db is null', () => {
			const client = createMongoClient(mockConfig, mockLogger);

			expect(() => (client as any).getCollection('test')).toThrow('Database connection not established');
		});

		it('should handle findMany with all options', async () => {
			await client.connect(); // Ensure connection first

			const mockCursor = {
				limit: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				project: vi.fn().mockReturnThis(),
				toArray: vi.fn().mockResolvedValue([{ id: 1, name: 'test' }]),
			};

			mockCollection.find.mockReturnValue(mockCursor);

			const options = {
				limit: 10,
				skip: 5,
				sort: { name: 1 },
				projection: { name: 1 },
			};

			const result = await client.findMany('users', { active: true }, options);

			expect(result).toEqual([{ id: 1, name: 'test' }]);
			expect(mockCursor.limit).toHaveBeenCalledWith(10);
			expect(mockCursor.skip).toHaveBeenCalledWith(5);
			expect(mockCursor.sort).toHaveBeenCalledWith({ name: 1 });
			expect(mockCursor.project).toHaveBeenCalledWith({ name: 1 });
		});

		it('should handle findMany with partial options', async () => {
			await client.connect(); // Ensure connection first

			const mockCursor = {
				limit: vi.fn().mockReturnThis(),
				skip: vi.fn().mockReturnThis(),
				sort: vi.fn().mockReturnThis(),
				project: vi.fn().mockReturnThis(),
				toArray: vi.fn().mockResolvedValue([{ id: 1, name: 'test' }]),
			};

			mockCollection.find.mockReturnValue(mockCursor);

			const options = {
				limit: 10,
				// Only limit, no skip, sort, or projection
			};

			const result = await client.findMany('users', { active: true }, options);

			expect(result).toEqual([{ id: 1, name: 'test' }]);
			expect(mockCursor.limit).toHaveBeenCalledWith(10);
			expect(mockCursor.skip).not.toHaveBeenCalled();
			expect(mockCursor.sort).not.toHaveBeenCalled();
			expect(mockCursor.project).not.toHaveBeenCalled();
		});

		it('should handle insertMany with correct id mapping', async () => {
			await client.connect(); // Ensure connection first

			const documents = [{ name: 'user1' }, { name: 'user2' }];

			const insertResult = {
				acknowledged: true,
				insertedCount: 2,
				insertedIds: {
					0: 'id1',
					1: 'id2',
				},
			};

			mockCollection.insertMany.mockResolvedValue(insertResult);

			const result = await client.insertMany('users', documents);

			expect(result).toEqual([
				{ name: 'user1', _id: 'id1' },
				{ name: 'user2', _id: 'id2' },
			]);
		});

		it('should handle connection already exists', async () => {
			// First connect
			await client.connect();

			// Second connect should not create new connection
			await client.connect();

			expect(mockLogger.debug).toHaveBeenCalledWith('MongoDB connection already exists');
		});

		it('should handle ping failure during connect', async () => {
			// Create a new client for this test
			const testClient = createMongoClient(mockConfig, mockLogger);

			// Mock the ping to fail
			mockDb.admin().ping.mockRejectedValue(new Error('Ping failed'));

			await expect(testClient.connect()).rejects.toThrow(MongoError);
			expect(mockLogger.error).toHaveBeenCalledWith(
				'MongoDB connection failed',
				expect.any(MongoError),
				expect.objectContaining({
					database: mockConfig.database,
				})
			);
		});

		it('should handle disconnect error', async () => {
			await client.connect();

			// Mock the client's close method to throw an error
			const mockClose = vi.fn().mockRejectedValue(new Error('Close failed'));
			(client as any).client = { close: mockClose };

			await expect(client.disconnect()).rejects.toThrow(MongoError);
			expect(mockLogger.error).toHaveBeenCalledWith('MongoDB disconnect failed', expect.any(MongoError));
		});
	});

	describe('health check', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should perform health check successfully', async () => {
			const healthCheck = (client as any).healthCheck;
			if (healthCheck) {
				await expect(healthCheck()).resolves.not.toThrow();
				expect(mockDb.admin().ping).toHaveBeenCalled();
			}
		});

		it('should handle health check failure', async () => {
			const healthCheck = (client as any).healthCheck;
			if (healthCheck) {
				const error = new Error('Health check failed');
				mockDb.admin().ping.mockRejectedValue(error);

				await expect(healthCheck()).rejects.toThrow();
			}
		});
	});

	describe('findMany with advanced options', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should apply sort option correctly', async () => {
			const mockDocuments = [{ _id: '1', name: 'test1' }];
			mockCollection.find().toArray.mockResolvedValue(mockDocuments);

			await client.findMany('users', {}, { sort: { name: 1 } });

			expect(mockCollection.find().sort).toHaveBeenCalledWith({ name: 1 });
		});

		it('should apply projection option correctly', async () => {
			const mockDocuments = [{ _id: '1', name: 'test1' }];
			mockCollection.find().toArray.mockResolvedValue(mockDocuments);

			await client.findMany('users', {}, { projection: { name: 1 } });

			expect(mockCollection.find().project).toHaveBeenCalledWith({ name: 1 });
		});

		it('should apply all options together', async () => {
			const mockDocuments = [{ _id: '1', name: 'test1' }];
			mockCollection.find().toArray.mockResolvedValue(mockDocuments);

			await client.findMany(
				'users',
				{},
				{
					limit: 10,
					skip: 5,
					sort: { name: 1 },
					projection: { name: 1, email: 1 },
				}
			);

			expect(mockCollection.find().limit).toHaveBeenCalledWith(10);
			expect(mockCollection.find().skip).toHaveBeenCalledWith(5);
			expect(mockCollection.find().sort).toHaveBeenCalledWith({ name: 1 });
			expect(mockCollection.find().project).toHaveBeenCalledWith({ name: 1, email: 1 });
		});

		it('should throw MongoError on findMany failure', async () => {
			const error = new Error('Find many failed');
			mockCollection.find().toArray.mockRejectedValue(error);

			await expect(client.findMany('users', {})).rejects.toThrow(MongoError);
		});
	});

	describe('error handling edge cases', () => {
		beforeEach(async () => {
			await client.connect();
		});

		it('should handle insertOne with unacknowledged result', async () => {
			const mockResult = { insertedId: null, acknowledged: false };
			mockCollection.insertOne.mockResolvedValue(mockResult);

			await expect(client.insertOne('users', { name: 'test' })).rejects.toThrow(MongoError);
		});

		it('should handle insertMany with unacknowledged result', async () => {
			const mockResult = { insertedCount: 0, insertedIds: {}, acknowledged: false };
			mockCollection.insertMany.mockResolvedValue(mockResult);

			await expect(client.insertMany('users', [{ name: 'test' }])).rejects.toThrow(MongoError);
		});

		it('should handle updateOne with unacknowledged result', async () => {
			const mockResult = { matchedCount: 0, modifiedCount: 0, acknowledged: false };
			mockCollection.updateOne.mockResolvedValue(mockResult);

			await expect(client.updateOne('users', { _id: '1' }, { name: 'test' })).rejects.toThrow(MongoError);
		});

		it('should handle updateMany with unacknowledged result', async () => {
			const mockResult = { matchedCount: 0, modifiedCount: 0, acknowledged: false };
			mockCollection.updateMany.mockResolvedValue(mockResult);

			await expect(client.updateMany('users', {}, { name: 'test' })).rejects.toThrow(MongoError);
		});

		it('should handle deleteOne with unacknowledged result', async () => {
			const mockResult = { deletedCount: 0, acknowledged: false };
			mockCollection.deleteOne.mockResolvedValue(mockResult);

			await expect(client.deleteOne('users', { _id: '1' })).rejects.toThrow(MongoError);
		});

		it('should handle deleteMany with unacknowledged result', async () => {
			const mockResult = { deletedCount: 0, acknowledged: false };
			mockCollection.deleteMany.mockResolvedValue(mockResult);

			await expect(client.deleteMany('users', {})).rejects.toThrow(MongoError);
		});
	});

	describe('connection state management', () => {
		it('should throw error when performing operations without connection', async () => {
			const disconnectedClient = createMongoClient(mockConfig, mockLogger);

			await expect(disconnectedClient.findOne('users', {})).rejects.toThrow(MongoError);
			await expect(disconnectedClient.findMany('users', {})).rejects.toThrow(MongoError);
			await expect(disconnectedClient.insertOne('users', {})).rejects.toThrow(MongoError);
			await expect(disconnectedClient.insertMany('users', [{}])).rejects.toThrow(MongoError);
			await expect(disconnectedClient.updateOne('users', {}, {})).rejects.toThrow(MongoError);
			await expect(disconnectedClient.updateMany('users', {}, {})).rejects.toThrow(MongoError);
			await expect(disconnectedClient.deleteOne('users', {})).rejects.toThrow(MongoError);
			await expect(disconnectedClient.deleteMany('users', {})).rejects.toThrow(MongoError);
		});
	});

	describe('configuration defaults', () => {
		it('should use default values when config properties are undefined', async () => {
			const configWithUndefinedValues = {
				uri: 'mongodb://localhost:27017',
				database: 'test_db',
				maxPoolSize: undefined,
				minPoolSize: undefined,
				maxIdleTimeMS: undefined,
				serverSelectionTimeoutMS: undefined,
			};

			const clientWithDefaults = createMongoClient(configWithUndefinedValues, mockLogger);
			await clientWithDefaults.connect();

			expect(MongoDBClient).toHaveBeenCalledWith(configWithUndefinedValues.uri, {
				maxPoolSize: 10, // default value
				minPoolSize: 1, // default value
				maxIdleTimeMS: 30000, // default value
				serverSelectionTimeoutMS: 30000, // default value
			});
		});

		it('should handle disconnect when client is null', async () => {
			const disconnectedClient = createMongoClient(mockConfig, mockLogger);

			// Call disconnect without connecting first (client should be null)
			await expect(disconnectedClient.disconnect()).resolves.not.toThrow();

			// Verify that no close method was called since client is null
			expect(mockMongoClient.close).not.toHaveBeenCalled();
		});
	});
});
