import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BigQuery } from '@google-cloud/bigquery';
import { BigQueryClient, createBigQueryClient, getBigQueryClient } from '@/clients';
import { BigQueryError } from '@/interfaces/exceptions';
import { config } from '@/config';
import { logger, createLogger } from '@/utils';

// Mock dependencies
vi.mock('@google-cloud/bigquery');
vi.mock('@/config', () => ({
	config: {
		appName: 'test-app',
		aws: { region: 'us-east-1' },
	},
}));
vi.mock('@/utils', () => ({
	logger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
	createLogger: vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	})),
}));

const mockBigQuery = vi.mocked(BigQuery);
const mockConfig = vi.mocked(config);
const mockLogger = vi.mocked(logger);
const mockCreateLogger = vi.mocked(createLogger);

describe('BigQueryClient', () => {
	let bigQueryClient: BigQueryClient;
	let mockBigQueryInstance: any;
	let mockDataset: any;
	let mockTable: any;
	let mockJob: any;

	beforeEach(() => {
		vi.clearAllMocks();

		// Reset singleton instance
		(BigQueryClient as any).instance = null;

		// Mock BigQuery instance
		mockBigQueryInstance = {
			dataset: vi.fn(),
			query: vi.fn(),
			createQueryJob: vi.fn(),
			getJobs: vi.fn(),
			getDatasets: vi.fn(),
			createDataset: vi.fn(),
		};

		// Mock Dataset
		mockDataset = {
			exists: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			createTable: vi.fn(),
			table: vi.fn(),
			getTables: vi.fn(),
		};

		// Mock Table
		mockTable = {
			exists: vi.fn(),
			create: vi.fn(),
			delete: vi.fn(),
			insert: vi.fn(),
			getMetadata: vi.fn(),
		};

		// Mock Job
		mockJob = {
			getQueryResults: vi.fn(),
			getMetadata: vi.fn(),
		};

		mockBigQueryInstance.dataset.mockReturnValue(mockDataset);
		mockDataset.table.mockReturnValue(mockTable);
		mockBigQuery.mockImplementation(() => mockBigQueryInstance);

		// Mock config
		mockConfig.bigquery = {
			projectId: 'test-project',
			datasetId: 'test-dataset',
			location: 'US',
			keyFilename: '/path/to/key.json',
			maxRetries: 3,
			autoRetry: true,
		};

		// Mock logger
		mockLogger.info = vi.fn();
		mockLogger.error = vi.fn();
		mockLogger.warn = vi.fn();
		mockLogger.debug = vi.fn();

		// Mock createLogger to return the mocked logger
		vi.mocked(createLogger).mockReturnValue(mockLogger);

		bigQueryClient = new BigQueryClient();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe('constructor', () => {
		it('should create BigQueryClient instance without connecting', () => {
			const client = new BigQueryClient();
			expect(client).toBeInstanceOf(BigQueryClient);
			// BigQuery instance is not created until connect() is called
			expect(mockBigQuery).not.toHaveBeenCalled();
		});

		it('should create BigQueryClient instance with custom config', () => {
			const customConfig = {
				projectId: 'custom-project',
				location: 'EU',
				keyFilename: '/custom/path.json',
			};

			const client = new BigQueryClient(customConfig);
			expect(client).toBeInstanceOf(BigQueryClient);
			// BigQuery instance is not created until connect() is called
			expect(mockBigQuery).not.toHaveBeenCalled();
		});

		it('should create BigQueryClient instance with credentials config', () => {
			const customConfig = {
				projectId: 'custom-project',
				location: 'EU',
				credentials: { client_email: 'test@test.com', private_key: 'key' },
			};

			const client = new BigQueryClient(customConfig);
			expect(client).toBeInstanceOf(BigQueryClient);
			expect(mockBigQuery).not.toHaveBeenCalled();
		});
	});

	describe('connect', () => {
		it('should connect successfully', async () => {
			mockDataset.exists.mockResolvedValue([true]);

			await bigQueryClient.connect();

			expect(mockBigQueryInstance.getDatasets).toHaveBeenCalledWith({ maxResults: 1 });
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery client connected successfully', {
				projectId: 'test-project',
				location: 'US',
			});
		});

		it('should throw BigQueryError when connection fails', async () => {
			const error = new Error('Connection failed');
			mockBigQueryInstance.getDatasets.mockRejectedValue(error);

			await expect(bigQueryClient.connect()).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to connect to BigQuery:', error);
		});

		it('should return early if already connected', async () => {
			// First connection
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);
			await bigQueryClient.connect();

			// Clear mock calls
			vi.clearAllMocks();

			// Second connection should return early
			await bigQueryClient.connect();

			expect(mockLogger.debug).toHaveBeenCalledWith('BigQuery connection already exists');
			expect(mockBigQueryInstance.getDatasets).not.toHaveBeenCalled();
		});

		it('should connect with keyFilename authentication', async () => {
			const customConfig = {
				projectId: 'test-project',
				keyFilename: '/path/to/key.json',
			};
			const client = new BigQueryClient(customConfig);
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);

			await client.connect();

			expect(mockBigQuery).toHaveBeenCalledWith({
				projectId: 'test-project',
				location: 'US',
				maxRetries: 3,
				autoRetry: true,
				keyFilename: '/path/to/key.json',
			});
		});

		it('should connect with credentials authentication', async () => {
			const customConfig = {
				projectId: 'test-project',
				credentials: { client_email: 'test@test.com', private_key: 'key' },
			};
			const client = new BigQueryClient(customConfig);
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);

			await client.connect();

			expect(mockBigQuery).toHaveBeenCalledWith({
				projectId: 'test-project',
				location: 'US',
				maxRetries: 3,
				autoRetry: true,
				credentials: { client_email: 'test@test.com', private_key: 'key' },
			});
		});

		it('should fallback to US location on connect when config.location is undefined', async () => {
			// Arrange a client without location in config
			const customConfig = {
				projectId: 'test-project',
				// no location
			} as any;
			const client = new BigQueryClient(customConfig);
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);

			// Act
			await client.connect();

			// Assert: logger should reflect 'US' and BigQuery instantiated with US
			expect(mockBigQuery).toHaveBeenCalledWith({
				projectId: 'test-project',
				location: 'US',
				maxRetries: 3,
				autoRetry: true,
			});
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery client connected successfully', {
				projectId: 'test-project',
				location: 'US',
			});
		});
	});

	describe('disconnect', () => {
		it('should disconnect successfully when no client exists', async () => {
			await bigQueryClient.disconnect();

			// El método disconnect no registra mensaje cuando no hay conexión activa
		});

		it('should disconnect successfully when client exists', async () => {
			// First connect to have an active client
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);
			await bigQueryClient.connect();

			// Now disconnect
			await bigQueryClient.disconnect();

			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery client disconnected');
		});

		it('should throw BigQueryError when disconnect fails', async () => {
			// First connect to have an active client
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);
			await bigQueryClient.connect();

			// Mock an error during disconnect by making the client property access throw
			const error = new Error('Disconnect failed');

			// We need to simulate an error in the disconnect process
			// Let's override the client property to throw when accessed
			Object.defineProperty(bigQueryClient, 'client', {
				get: () => {
					throw error;
				},
				configurable: true,
			});

			await expect(bigQueryClient.disconnect()).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('BigQuery disconnect failed', expect.any(BigQueryError));
		});

		it('should handle error in disconnect catch block with client clearing', async () => {
			// First connect to have an active client
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);
			await bigQueryClient.connect();

			// Mock an error by making the null assignment throw
			const originalClient = bigQueryClient['client'];
			const error = new Error('Client clearing failed');

			// Mock the setter to throw an error
			Object.defineProperty(bigQueryClient, 'client', {
				set: () => {
					throw error;
				},
				get: () => originalClient,
				configurable: true,
			});

			await expect(bigQueryClient.disconnect()).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('BigQuery disconnect failed', expect.any(BigQueryError));
		});

		it('should log an error and throw when disconnect fails', async () => {
			// Arrange: Connect to create a client instance
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);
			await bigQueryClient.connect();

			// Arrange: Mock logger.info to throw an error to simulate failure
			const failureError = new Error('Simulated disconnect failure');
			vi.spyOn(mockLogger, 'info').mockImplementation(() => {
				throw failureError;
			});

			// Act & Assert: Expect disconnect to throw a BigQueryError
			await expect(bigQueryClient.disconnect()).rejects.toThrow(BigQueryError);

			// Assert: Verify that the error was logged
			expect(mockLogger.error).toHaveBeenCalledWith(
				'BigQuery disconnect failed',
				expect.objectContaining({
					name: 'BigQueryError',
					message: 'Failed to disconnect from BigQuery',
					details: expect.objectContaining({ error: failureError }),
				})
			);
		});
	});

	describe('query', () => {
		it('should execute query successfully', async () => {
			const mockResults = [{ id: 1, name: 'test' }];
			mockBigQueryInstance.query.mockResolvedValue([mockResults]);

			const result = await bigQueryClient.query('SELECT * FROM table');

			expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
				query: 'SELECT * FROM table',
				location: 'US',
				dryRun: false,
				useLegacySql: false,
			});
			expect(result).toEqual(mockResults);
			// El método query no registra mensaje de éxito, solo se conecta
		});

		it('should execute query with custom options', async () => {
			const mockResults = [{ id: 1, name: 'test' }];
			mockBigQueryInstance.query.mockResolvedValue([mockResults]);

			const options = {
				dryRun: true,
				useLegacySql: false,
				maximumBytesBilled: '1000000',
			};

			const result = await bigQueryClient.query('SELECT * FROM table', options);

			expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
				query: 'SELECT * FROM table',
				location: 'US',
				...options,
			});
			expect(result).toEqual(mockResults);
		});

		it('should use custom location from options in query', async () => {
			const mockResults = [{ id: 1, name: 'test' }];
			mockBigQueryInstance.query.mockResolvedValue([mockResults]);

			const options = {
				location: 'EU',
				dryRun: false,
			};

			const result = await bigQueryClient.query('SELECT * FROM table', options);

			expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
				query: 'SELECT * FROM table',
				location: 'EU',
				dryRun: false,
				useLegacySql: false,
			});
			expect(result).toEqual(mockResults);
		});

		it('should use config location when no location in options', async () => {
			// Mock config to have a specific location
			const mockBigQueryConfig = {
				projectId: 'test-project',
				location: 'ASIA',
			};

			const clientWithConfig = new BigQueryClient(mockBigQueryConfig);

			const mockResults = [{ id: 1, name: 'test' }];
			mockBigQueryInstance.query.mockResolvedValue([mockResults]);

			const result = await clientWithConfig.query('SELECT * FROM table');

			expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
				query: 'SELECT * FROM table',
				location: 'ASIA',
				dryRun: false,
				useLegacySql: false,
			});
			expect(result).toEqual(mockResults);
		});

		it('should use fallback US location when config location is undefined in query', async () => {
			// Mock config without location (undefined/null)
			const mockBigQueryConfig = {
				projectId: 'test-project',
				// location is undefined
			};

			const clientWithoutLocation = new BigQueryClient(mockBigQueryConfig);

			const mockResults = [{ id: 1, name: 'test' }];
			mockBigQueryInstance.query.mockResolvedValue([mockResults]);

			const result = await clientWithoutLocation.query('SELECT * FROM table');

			expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
				query: 'SELECT * FROM table',
				location: 'US', // Should fallback to US
				dryRun: false,
				useLegacySql: false,
			});
			expect(result).toEqual(mockResults);
		});

		it('should use fallback US location when both options.location and config.location are undefined in query', async () => {
			// Mock config without location
			const mockBigQueryConfig = {
				projectId: 'test-project',
				// location is undefined
			};

			const clientWithoutLocation = new BigQueryClient(mockBigQueryConfig);

			const mockResults = [{ id: 1, name: 'test' }];
			mockBigQueryInstance.query.mockResolvedValue([mockResults]);

			const options = {
				dryRun: true,
				// location is undefined in options too
			};

			const result = await clientWithoutLocation.query('SELECT * FROM table', options);

			expect(mockBigQueryInstance.query).toHaveBeenCalledWith({
				query: 'SELECT * FROM table',
				location: 'US', // Should fallback to US
				dryRun: true,
				useLegacySql: false,
			});
			expect(result).toEqual(mockResults);
		});

		it('should call ensureConnection when client is not connected', async () => {
			// Create a new client that is not connected
			const newClient = new BigQueryClient();

			const mockResults = [{ id: 1, name: 'test' }];
			mockBigQueryInstance.query.mockResolvedValue([mockResults]);
			mockBigQueryInstance.getDatasets.mockResolvedValue([[]]);

			const result = await newClient.query('SELECT * FROM table');

			// Should have called connect (which calls getDatasets)
			expect(mockBigQueryInstance.getDatasets).toHaveBeenCalled();
			expect(result).toEqual(mockResults);
		});

		it('should throw BigQueryError when query fails', async () => {
			const error = new Error('Query failed');
			mockBigQueryInstance.query.mockRejectedValue(error);

			await expect(bigQueryClient.query('SELECT * FROM table')).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Query execution failed:', error);
		});
	});

	describe('insert', () => {
		it('should insert data successfully', async () => {
			const data = [{ id: 1, name: 'test' }];
			mockTable.insert.mockResolvedValue([]);

			await bigQueryClient.insert('test-dataset', 'test-table', data);

			expect(mockDataset.table).toHaveBeenCalledWith('test-table');
			expect(mockTable.insert).toHaveBeenCalledWith(data, {
				createInsertId: true,
				ignoreUnknownValues: false,
				skipInvalidRows: false,
			});
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery insert completed successfully', {
				datasetId: 'test-dataset',
				tableId: 'test-table',
				rowCount: 1,
			});
		});

		it('should insert data with custom options', async () => {
			const data = [{ id: 1, name: 'test' }];
			const options = { ignoreUnknownValues: true, skipInvalidRows: true };
			mockTable.insert.mockResolvedValue([]);

			await bigQueryClient.insert('test-dataset', 'test-table', data, options);

			expect(mockTable.insert).toHaveBeenCalledWith(data, { ...options, createInsertId: true });
		});

		it('should throw BigQueryError when insert fails', async () => {
			const data = [{ id: 1, name: 'test' }];
			const error = new Error('Insert failed');
			mockTable.insert.mockRejectedValue(error);

			await expect(bigQueryClient.insert('test-dataset', 'test-table', data)).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Data insertion failed for table test-table:', error);
		});
	});

	describe('createTable', () => {
		it('should create table successfully', async () => {
			const schema = {
				fields: [
					{ name: 'id', type: 'INTEGER', mode: 'REQUIRED' },
					{ name: 'name', type: 'STRING', mode: 'NULLABLE' },
				],
			};
			mockDataset.createTable.mockResolvedValue(undefined);

			await bigQueryClient.createTable('test-dataset', 'test-table', schema);

			expect(mockDataset.createTable).toHaveBeenCalledWith('test-table', {
				schema: schema.fields,
				description: undefined,
			});
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery table created successfully', {
				datasetId: 'test-dataset',
				tableId: 'test-table',
				fieldCount: 2,
			});
		});

		it('should throw BigQueryError when table creation fails', async () => {
			const schema = { fields: [] };
			const error = new Error('Table creation failed');
			mockDataset.createTable.mockRejectedValue(error);

			await expect(bigQueryClient.createTable('test-dataset', 'test-table', schema)).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Table creation failed for test-table:', error);
		});
	});

	describe('deleteTable', () => {
		it('should delete table successfully', async () => {
			mockTable.delete.mockResolvedValue([]);

			await bigQueryClient.deleteTable('test-dataset', 'test-table');

			expect(mockDataset.table).toHaveBeenCalledWith('test-table');
			expect(mockTable.delete).toHaveBeenCalled();
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery table deleted successfully', {
				datasetId: 'test-dataset',
				tableId: 'test-table',
			});
		});

		it('should throw BigQueryError when table deletion fails', async () => {
			const error = new Error('Table deletion failed');
			mockTable.delete.mockRejectedValue(error);

			await expect(bigQueryClient.deleteTable('test-dataset', 'test-table')).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Table deletion failed for test-table:', error);
		});
	});

	describe('tableExists', () => {
		it('should return true when table exists', async () => {
			mockTable.exists.mockResolvedValue([true]);

			const result = await bigQueryClient.tableExists('test-dataset', 'test-table');

			expect(mockDataset.table).toHaveBeenCalledWith('test-table');
			expect(mockTable.exists).toHaveBeenCalled();
			expect(result).toBe(true);
		});

		it('should return false when table does not exist', async () => {
			mockTable.exists.mockResolvedValue([false]);

			const result = await bigQueryClient.tableExists('test-table');

			expect(result).toBe(false);
		});

		it('should throw BigQueryError when check fails', async () => {
			const error = new Error('Check failed');
			mockTable.exists.mockRejectedValue(error);

			await expect(bigQueryClient.tableExists('test-dataset', 'test-table')).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to check table existence for test-table:', error);
		});
	});

	describe('getTableMetadata', () => {
		it('should get table metadata successfully', async () => {
			const metadata = { id: 'test-table', schema: { fields: [] } };
			mockTable.getMetadata.mockResolvedValue([metadata]);

			const result = await bigQueryClient.getTableMetadata('test-dataset', 'test-table');

			expect(mockDataset.table).toHaveBeenCalledWith('test-table');
			expect(mockTable.getMetadata).toHaveBeenCalled();
			expect(result).toBe(metadata);
		});

		it('should throw BigQueryError when getting metadata fails', async () => {
			const error = new Error('Metadata retrieval failed');
			mockTable.getMetadata.mockRejectedValue(error);

			await expect(bigQueryClient.getTableMetadata('test-dataset', 'test-table')).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to get table metadata for test-table:', error);
		});
	});

	describe('createDataset', () => {
		it('should create dataset successfully', async () => {
			mockBigQueryInstance.createDataset.mockResolvedValue([mockDataset]);

			await bigQueryClient.createDataset('new-dataset');

			expect(mockBigQueryInstance.createDataset).toHaveBeenCalledWith('new-dataset', {
				location: 'US',
				description: undefined,
			});
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery dataset created successfully', {
				datasetId: 'new-dataset',
				location: 'US',
			});
		});

		it('should create dataset with custom options', async () => {
			const options = { description: 'Test dataset' };
			mockBigQueryInstance.createDataset.mockResolvedValue([mockDataset]);

			await bigQueryClient.createDataset('new-dataset', options);

			expect(mockBigQueryInstance.createDataset).toHaveBeenCalledWith('new-dataset', {
				location: 'US',
				description: 'Test dataset',
			});
		});

		it('should use custom location from options in createDataset', async () => {
			const options = { location: 'EU', description: 'Test dataset' };
			mockBigQueryInstance.createDataset.mockResolvedValue([mockDataset]);

			await bigQueryClient.createDataset('new-dataset', options);

			expect(mockBigQueryInstance.createDataset).toHaveBeenCalledWith('new-dataset', {
				location: 'EU',
				description: 'Test dataset',
			});
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery dataset created successfully', {
				datasetId: 'new-dataset',
				location: 'EU',
			});
		});

		it('should use config location when no location in options for createDataset', async () => {
			// Mock config to have a specific location
			const mockBigQueryConfig = {
				projectId: 'test-project',
				location: 'ASIA',
			};

			const clientWithConfig = new BigQueryClient(mockBigQueryConfig);
			mockBigQueryInstance.createDataset.mockResolvedValue([mockDataset]);

			await clientWithConfig.createDataset('new-dataset');

			expect(mockBigQueryInstance.createDataset).toHaveBeenCalledWith('new-dataset', {
				location: 'ASIA',
				description: undefined,
			});
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery dataset created successfully', {
				datasetId: 'new-dataset',
				location: 'ASIA',
			});
		});

		it('should use fallback US location when config location is undefined in createDataset', async () => {
			// Mock config without location
			const mockBigQueryConfig = {
				projectId: 'test-project',
				// location is undefined
			};

			const clientWithoutLocation = new BigQueryClient(mockBigQueryConfig);
			mockBigQueryInstance.createDataset.mockResolvedValue([mockDataset]);

			await clientWithoutLocation.createDataset('new-dataset');

			expect(mockBigQueryInstance.createDataset).toHaveBeenCalledWith('new-dataset', {
				location: 'US',
				description: undefined,
			});
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery dataset created successfully', {
				datasetId: 'new-dataset',
				location: 'US',
			});
		});

		it('should use fallback US location when both options.location and config.location are undefined in createDataset', async () => {
			// Mock config without location
			const mockBigQueryConfig = {
				projectId: 'test-project',
				// location is undefined
			};

			const clientWithoutLocation = new BigQueryClient(mockBigQueryConfig);
			mockBigQueryInstance.createDataset.mockResolvedValue([mockDataset]);

			const options = {
				description: 'Test dataset',
				// location is undefined in options too
			};

			await clientWithoutLocation.createDataset('new-dataset', options);

			expect(mockBigQueryInstance.createDataset).toHaveBeenCalledWith('new-dataset', {
				location: 'US',
				description: 'Test dataset',
			});
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery dataset created successfully', {
				datasetId: 'new-dataset',
				location: 'US',
			});
		});

		it('should throw BigQueryError when dataset creation fails', async () => {
			const error = new Error('Dataset creation failed');
			mockBigQueryInstance.createDataset.mockRejectedValue(error);

			await expect(bigQueryClient.createDataset('new-dataset')).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Dataset creation failed for new-dataset:', error);
		});
	});

	describe('deleteDataset', () => {
		it('should delete dataset successfully', async () => {
			mockDataset.delete.mockResolvedValue([]);

			await bigQueryClient.deleteDataset('test-dataset');

			expect(mockBigQueryInstance.dataset).toHaveBeenCalledWith('test-dataset');
			expect(mockDataset.delete).toHaveBeenCalledWith({ force: false });
			expect(mockLogger.info).toHaveBeenCalledWith('BigQuery dataset deleted successfully', {
				datasetId: 'test-dataset',
				force: false,
			});
		});

		it('should delete dataset with force option', async () => {
			mockDataset.delete.mockResolvedValue([]);

			await bigQueryClient.deleteDataset('test-dataset', { force: true });

			expect(mockDataset.delete).toHaveBeenCalledWith({ force: true });
		});

		it('should throw BigQueryError when dataset deletion fails', async () => {
			const error = new Error('Dataset deletion failed');
			mockDataset.delete.mockRejectedValue(error);

			await expect(bigQueryClient.deleteDataset('test-dataset')).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Dataset deletion failed for test-dataset:', error);
		});
	});

	describe('datasetExists', () => {
		it('should return true when dataset exists', async () => {
			mockDataset.exists.mockResolvedValue([true]);

			const result = await bigQueryClient.datasetExists('test-dataset');

			expect(mockBigQueryInstance.dataset).toHaveBeenCalledWith('test-dataset');
			expect(mockDataset.exists).toHaveBeenCalled();
			expect(result).toBe(true);
		});

		it('should return false when dataset does not exist', async () => {
			mockDataset.exists.mockResolvedValue([false]);

			const result = await bigQueryClient.datasetExists('test-dataset');

			expect(result).toBe(false);
		});

		it('should throw BigQueryError when check fails', async () => {
			const error = new Error('Check failed');
			mockDataset.exists.mockRejectedValue(error);

			await expect(bigQueryClient.datasetExists('test-dataset')).rejects.toThrow(BigQueryError);
			expect(mockLogger.error).toHaveBeenCalledWith('Failed to check dataset existence for test-dataset:', error);
		});
	});

	describe('Singleton pattern', () => {
		it('should create a new instance with createBigQueryClient', () => {
			const client = createBigQueryClient();
			expect(client).toBeInstanceOf(BigQueryClient);
		});

		it('should return the same instance with getBigQueryClient', () => {
			const client1 = getBigQueryClient();
			const client2 = getBigQueryClient();
			expect(client1).toBe(client2);
		});

		it('should create new instance if none exists with getBigQueryClient', () => {
			// Reset singleton
			(BigQueryClient as any).instance = null;

			const client = getBigQueryClient();
			expect(client).toBeInstanceOf(BigQueryClient);
		});
	});
});
