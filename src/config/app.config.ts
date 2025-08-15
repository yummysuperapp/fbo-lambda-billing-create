/**
 * @fileoverview Application Configuration Factory
 *
 * This module creates the application configuration from validated
 * environment variables and provides convenient configuration objects
 * for all services and components.
 *
 * Features:
 * - Type-safe configuration creation from environment variables
 * - Structured configuration objects for each service
 * - Environment-specific configuration flags
 * - S3 bucket allowlist parsing and validation
 * - Configuration logging for debugging and monitoring
 *
 * The configuration is created from validated environment variables
 * and provides a clean interface for accessing service configurations.
 *
 * @author José Carrillo <jose.carrillo@yummysuperapp.com>
 * @since 1.0.0
 */

import type { AppConfig } from '@/types';
import { env, type EnvVars } from './environment.config';
import { createLogger } from '@/utils';

/**
 * Creates the application configuration from validated environment variables
 *
 * @param {EnvVars} envVars - Validated environment variables
 * @returns {AppConfig} Complete application configuration
 */
function createConfig(envVars: EnvVars): AppConfig {
	return {
		finance: {
			baseUrl: envVars.FINANCE_BASE_URL || 'https://api.finance.yummysuperapp.com',
			apiKey: envVars.FINANCE_API_KEY || '123456',
			dispersionEndpoint: envVars.FINANCE_DISPERSION_ENDPOINT || '/',
		},
		aws: {
			region: 'us-east-2',
			s3BucketName: envVars.S3_BUCKET_NAME || '',
		},
		postgres: {
			uri: envVars.PG_URI,
			maxConnections: envVars.PG_MAX_CONNECTIONS,
			connectionTimeoutMillis: envVars.PG_CONNECTION_TIMEOUT,
			idleTimeoutMillis: envVars.PG_IDLE_TIMEOUT,
		},
		mongo: {
			uri: envVars.MONGO_URI,
			maxPoolSize: envVars.MONGO_MAX_POOL_SIZE,
			minPoolSize: envVars.MONGO_MIN_POOL_SIZE,
			maxIdleTimeMS: envVars.MONGO_MAX_IDLE_TIME,
			serverSelectionTimeoutMS: envVars.MONGO_SERVER_SELECTION_TIMEOUT,
		},
		appName: envVars.LAMBDA_FUNCTION_NAME,
		expirationHours: envVars.EXPIRATION_HOURS,
		bigquery: {
			projectId: envVars.BIGQUERY_PROJECT_ID,
			datasetId: envVars.BIGQUERY_DATASET_ID,
			location: envVars.BIGQUERY_LOCATION,
			...(envVars.BIGQUERY_KEY_FILENAME && { keyFilename: envVars.BIGQUERY_KEY_FILENAME }),
			...(envVars.BIGQUERY_CLIENT_EMAIL &&
				envVars.BIGQUERY_PRIVATE_KEY && {
					credentials: {
						client_email: envVars.BIGQUERY_CLIENT_EMAIL,
						private_key: envVars.BIGQUERY_PRIVATE_KEY.replace(/\\n/g, '\n'),
						project_id: envVars.BIGQUERY_PROJECT_ID,
					},
				}),
			maxRetries: envVars.BIGQUERY_MAX_RETRIES,
			autoRetry: envVars.BIGQUERY_AUTO_RETRY,
		},
	};
}

// Logger for configuration
const logger = createLogger('Config');

// Create application configuration
export const config = createConfig(env);

// Environment flags for convenience
export const NODE_ENV = env.NODE_ENV;
export const IS_LOCAL = NODE_ENV === 'local';
export const IS_DEVELOPMENT = NODE_ENV === 'development' || NODE_ENV === 'dev';
export const IS_PRODUCTION = NODE_ENV === 'production' || NODE_ENV === 'prod';

// Log configuration status
logger.info('Environment validation successful');
logger.info(`Running in ${NODE_ENV} mode`);
logger.info(`App: ${config.appName}`);
logger.info(`AWS Region: ${config.aws.region}`);
