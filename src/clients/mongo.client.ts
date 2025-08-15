import {
	MongoClient,
	Db,
	Collection,
	InsertOneResult,
	InsertManyResult,
	UpdateResult,
	DeleteResult,
	MongoClientOptions,
} from 'mongodb';
import type { MongoClientInterface, MongoConfig, Logger, MongoFindOptions } from '@/types';
import { MongoError } from '@/interfaces/exceptions';

/**
 * MongoDB client optimized for AWS Lambda
 * Implements connection pooling and proper error handling
 */
export class MongoDbClient implements MongoClientInterface {
	private client: MongoClient | null = null;
	private db: Db | null = null;
	private readonly config: MongoConfig;
	private readonly logger: Logger;

	constructor(config: MongoConfig, logger: Logger) {
		this.config = config;
		this.logger = logger;
	}

	/**
	 * Establishes connection to MongoDB
	 */
	async connect(): Promise<void> {
		try {
			if (this.client && this.db) {
				this.logger.debug('MongoDB connection already exists');
				return;
			}

			const options: MongoClientOptions = {
				maxPoolSize: this.config.maxPoolSize ?? 10,
				minPoolSize: this.config.minPoolSize ?? 1,
				maxIdleTimeMS: this.config.maxIdleTimeMS ?? 30000,
				serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS ?? 30000,
			} as MongoClientOptions;

			this.client = new MongoClient(this.config.uri, options);

			await this.client.connect();
			this.db = this.client.db('');

			// Test connection
			await this.db.admin().ping();

			this.logger.info('MongoDB connection established', {
				hasUri: !!this.config.uri,
				maxPoolSize: this.config.maxPoolSize ?? 10,
			});
		} catch (error) {
			const mongoError = new MongoError('Failed to connect to MongoDB', { error });
			this.logger.error('MongoDB connection failed', mongoError, {
				hasUri: !!this.config.uri,
			});
			throw mongoError;
		}
	}

	/**
	 * Closes the MongoDB connection
	 */
	async disconnect(): Promise<void> {
		try {
			if (this.client) {
				await this.client.close();
				this.client = null;
				this.db = null;
				this.logger.info('MongoDB connection closed');
			}
		} catch (error) {
			const mongoError = new MongoError('Failed to close MongoDB connection', { error });
			this.logger.error('MongoDB disconnect failed', mongoError);
			throw mongoError;
		}
	}

	/**
	 * Finds a single document
	 */
	async findOne<T = unknown>(collection: string, filter: Record<string, unknown>): Promise<T | null> {
		await this.ensureConnection();

		try {
			const start = Date.now();
			const coll = this.getCollection(collection);
			const result = (await coll.findOne(filter)) as T | null;
			const duration = Date.now() - start;

			this.logger.debug('MongoDB findOne executed', {
				collection,
				filter: JSON.stringify(filter).substring(0, 100),
				found: result !== null,
				duration,
			});

			return result;
		} catch (error) {
			const mongoError = new MongoError('DeleteOne operation failed', { error, collection, filter });
			this.logger.error('MongoDB findOne failed', mongoError, { collection });
			throw mongoError;
		}
	}

	/**
	 * Finds multiple documents
	 */
	async findMany<T = unknown>(
		collection: string,
		filter: Record<string, unknown>,
		options?: MongoFindOptions
	): Promise<T[]> {
		await this.ensureConnection();

		try {
			const start = Date.now();
			const coll = this.getCollection(collection);

			let cursor = coll.find(filter);

			if (options?.limit) cursor = cursor.limit(options.limit);
			if (options?.skip) cursor = cursor.skip(options.skip);
			if (options?.sort) cursor = cursor.sort(options.sort);
			if (options?.projection) cursor = cursor.project(options.projection);

			const results = (await cursor.toArray()) as T[];
			const duration = Date.now() - start;

			this.logger.debug('MongoDB findMany executed', {
				collection,
				filter: JSON.stringify(filter).substring(0, 100),
				count: results.length,
				options,
				duration,
			});

			return results;
		} catch (error) {
			const mongoError = new MongoError('FindMany operation failed', { error, collection, filter, options });
			this.logger.error('MongoDB findMany failed', mongoError, { collection });
			throw mongoError;
		}
	}

	/**
	 * Inserts a single document
	 */
	async insertOne<T = unknown>(collection: string, document: Record<string, unknown>): Promise<T> {
		await this.ensureConnection();

		try {
			const start = Date.now();
			const coll = this.getCollection(collection);
			const result: InsertOneResult = await coll.insertOne(document);
			const duration = Date.now() - start;

			if (!result.acknowledged) {
				throw new MongoError('Insert operation was not acknowledged by the server');
			}

			this.logger.debug('MongoDB insertOne executed', {
				collection,
				insertedId: result.insertedId.toString(),
				duration,
			});

			return { ...document, _id: result.insertedId } as T;
		} catch (error) {
			const mongoError = new MongoError('InsertOne operation failed', { error, collection, document });
			this.logger.error('MongoDB insertOne failed', mongoError, { collection });
			throw mongoError;
		}
	}

	/**
	 * Inserts multiple documents
	 */
	async insertMany<T = unknown>(collection: string, documents: Record<string, unknown>[]): Promise<T[]> {
		await this.ensureConnection();

		try {
			const start = Date.now();
			const coll = this.getCollection(collection);
			const result: InsertManyResult = await coll.insertMany(documents);
			const duration = Date.now() - start;

			if (!result.acknowledged) {
				throw new MongoError('Insert many operation was not acknowledged by the server');
			}

			this.logger.debug('MongoDB insertMany executed', {
				collection,
				insertedCount: result.insertedCount,
				duration,
			});

			return documents.map((doc, index) => ({
				...doc,
				_id: Object.values(result.insertedIds)[index],
			})) as T[];
		} catch (error) {
			const mongoError = new MongoError('InsertMany operation failed', {
				error,
				collection,
				documentCount: documents.length,
			});
			this.logger.error('MongoDB insertMany failed', mongoError, { collection });
			throw mongoError;
		}
	}

	/**
	 * Updates a single document
	 */
	async updateOne(
		collection: string,
		filter: Record<string, unknown>,
		update: Record<string, unknown>
	): Promise<boolean> {
		await this.ensureConnection();

		try {
			const start = Date.now();
			const coll = this.getCollection(collection);
			const result: UpdateResult = await coll.updateOne(filter, { $set: update });
			const duration = Date.now() - start;

			if (!result.acknowledged) {
				throw new MongoError('Update operation was not acknowledged by the server');
			}

			this.logger.debug('MongoDB updateOne executed', {
				collection,
				filter: JSON.stringify(filter).substring(0, 100),
				matchedCount: result.matchedCount,
				modifiedCount: result.modifiedCount,
				duration,
			});

			return result.modifiedCount > 0;
		} catch (error) {
			const mongoError = new MongoError('UpdateOne operation failed', { error, collection, filter, update });
			this.logger.error('MongoDB updateOne failed', mongoError, { collection });
			throw mongoError;
		}
	}

	/**
	 * Updates multiple documents
	 */
	async updateMany(
		collection: string,
		filter: Record<string, unknown>,
		update: Record<string, unknown>
	): Promise<number> {
		await this.ensureConnection();

		try {
			const start = Date.now();
			const coll = this.getCollection(collection);
			const result: UpdateResult = await coll.updateMany(filter, { $set: update });
			const duration = Date.now() - start;

			if (!result.acknowledged) {
				throw new MongoError('Update many operation was not acknowledged by the server');
			}

			this.logger.debug('MongoDB updateMany executed', {
				collection,
				filter: JSON.stringify(filter).substring(0, 100),
				matchedCount: result.matchedCount,
				modifiedCount: result.modifiedCount,
				duration,
			});

			return result.modifiedCount;
		} catch (error) {
			const mongoError = new MongoError('UpdateMany operation failed', { error, collection, filter, update });
			this.logger.error('MongoDB updateMany failed', mongoError, { collection });
			throw mongoError;
		}
	}

	/**
	 * Deletes a single document
	 */
	async deleteOne(collection: string, filter: Record<string, unknown>): Promise<boolean> {
		await this.ensureConnection();

		try {
			const start = Date.now();
			const coll = this.getCollection(collection);
			const result: DeleteResult = await coll.deleteOne(filter);
			const duration = Date.now() - start;

			if (!result.acknowledged) {
				throw new MongoError('Delete operation was not acknowledged by the server');
			}

			this.logger.debug('MongoDB deleteOne executed', {
				collection,
				filter: JSON.stringify(filter).substring(0, 100),
				deletedCount: result.deletedCount,
				duration,
			});

			return result.deletedCount > 0;
		} catch (error) {
			const mongoError = new MongoError('FindOne operation failed', { error, collection, filter });
			this.logger.error('MongoDB deleteOne failed', mongoError, { collection });
			throw mongoError;
		}
	}

	/**
	 * Deletes multiple documents
	 */
	async deleteMany(collection: string, filter: Record<string, unknown>): Promise<number> {
		await this.ensureConnection();

		try {
			const start = Date.now();
			const coll = this.getCollection(collection);
			const result: DeleteResult = await coll.deleteMany(filter);
			const duration = Date.now() - start;

			if (!result.acknowledged) {
				throw new MongoError('Delete many operation was not acknowledged by the server');
			}

			this.logger.debug('MongoDB deleteMany executed', {
				collection,
				filter: JSON.stringify(filter).substring(0, 100),
				deletedCount: result.deletedCount,
				duration,
			});

			return result.deletedCount;
		} catch (error) {
			const mongoError = new MongoError('DeleteMany operation failed', { error, collection, filter });
			this.logger.error('MongoDB deleteMany failed', mongoError, { collection });
			throw mongoError;
		}
	}

	/**
	 * Ensures connection is established
	 */
	private async ensureConnection(): Promise<void> {
		if (!this.client || !this.db) {
			throw new MongoError('Database connection not established. Call connect() first.');
		}
	}

	/**
	 * Gets a collection instance
	 */
	private getCollection(name: string): Collection {
		if (!this.db) {
			throw new Error('Database connection not established');
		}
		return this.db.collection(name);
	}
}

/**
 * Factory function to create MongoDB client
 */
export function createMongoClient(config: MongoConfig, logger: Logger): MongoClientInterface {
	return new MongoDbClient(config, logger);
}
