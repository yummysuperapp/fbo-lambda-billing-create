/**
 * @fileoverview Environment Variables Schema and Validation
 *
 * This module handles the validation and parsing of environment variables
 * using Zod schemas to ensure type safety and proper configuration.
 *
 * Features:
 * - Comprehensive environment variable validation with detailed error messages
 * - Type-safe environment variable parsing with automatic type conversion
 * - Support for multiple environments (development, production, local)
 * - Default values for optional configuration parameters
 * - Structured error reporting for missing or invalid variables
 *
 * The environment validation is performed on module load and throws
 * descriptive errors if required environment variables are missing or invalid.
 *
 * @author José Carrillo <jose.carrillo@yummysuperapp.com>
 * @since 1.0.0
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import { ConfigurationError } from '@/interfaces/exceptions';

// Load environment variables from .env file
dotenv.config();

// Environment Variables Schema
const EnvSchema = z.object({
	// Application Environment
	NODE_ENV: z.enum(['development', 'production', 'local', 'dev', 'prod', 'test']).default('development'),
	VERTICAL: z.string().min(1, 'VERTICAL is required'),

	// Finance API Configuration
	FINANCE_BASE_URL: z.string().url('FINANCE_BASE_URL must be a valid URL'),
	FINANCE_API_KEY: z.string().min(1, 'FINANCE_API_KEY is required'),
	FINANCE_DISPERSION_ENDPOINT: z.string().default('/api/v1/dispersion/receive'),

	// AWS Configuration
	AWS_ACCESS_KEY_ID: z.string().optional(),
	AWS_SECRET_ACCESS_KEY: z.string().optional(),
	AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
	S3_BUCKET_NAME: z.string().min(1, 'S3_BUCKET_NAME is required'),
	ALLOWED_S3_BUCKETS: z.string().min(1, 'ALLOWED_S3_BUCKETS is required'),

	// Application Configuration
	AWS_APP_NAME: z.string().min(1, 'AWS_APP_NAME is required'),
	EXPIRATION_HOURS: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1))
		.default('12'),

	// PostgreSQL Configuration
	PG_HOST: z.string().min(1, 'PG_HOST is required'),
	PG_PORT: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1).max(65535))
		.default('5432'),
	PG_DATABASE: z.string().min(1, 'PG_DATABASE is required'),
	PG_USER: z.string().min(1, 'PG_USER is required'),
	PG_PASSWORD: z.string().min(1, 'PG_PASSWORD is required'),
	PG_SSL: z
		.string()
		.transform((val) => val === 'true')
		.pipe(z.boolean())
		.default('false'),
	PG_MAX_CONNECTIONS: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1))
		.default('10'),
	PG_CONNECTION_TIMEOUT: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1000))
		.default('30000'),
	PG_IDLE_TIMEOUT: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1000))
		.default('30000'),

	// MongoDB Configuration
	MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
	MONGO_DATABASE: z.string().min(1, 'MONGO_DATABASE is required'),
	MONGO_MAX_POOL_SIZE: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1))
		.default('10'),
	MONGO_MIN_POOL_SIZE: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(0))
		.default('1'),
	MONGO_MAX_IDLE_TIME: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1000))
		.default('30000'),
	MONGO_SERVER_SELECTION_TIMEOUT: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1000))
		.default('30000'),

	// N8N Configuration
	N8N_HOST: z.string().url('N8N_HOST must be a valid URL'),
	N8N_API_KEY: z.string().min(1, 'N8N_API_KEY is required'),

	// BigQuery Configuration
	BIGQUERY_PROJECT_ID: z.string().min(1, 'BIGQUERY_PROJECT_ID is required'),
	BIGQUERY_DATASET_ID: z.string().min(1, 'BIGQUERY_DATASET_ID is required'),
	BIGQUERY_LOCATION: z.string().default('US'),
	BIGQUERY_KEY_FILENAME: z.string().optional(),
	BIGQUERY_CLIENT_EMAIL: z.string().optional(),
	BIGQUERY_PRIVATE_KEY: z.string().optional(),
	BIGQUERY_MAX_RETRIES: z
		.string()
		.transform((val) => parseInt(val, 10))
		.pipe(z.number().min(1))
		.default('3'),
	BIGQUERY_AUTO_RETRY: z
		.string()
		.transform((val) => val !== 'false')
		.pipe(z.boolean())
		.default('true'),
});

export type EnvVars = z.infer<typeof EnvSchema>;

/**
 * Validates and parses environment variables using Zod schema
 *
 * @returns {EnvVars} Validated and parsed environment variables
 * @throws {ConfigurationError} When environment validation fails
 */
export function validateEnvironment(): EnvVars {
	try {
		return EnvSchema.parse(process.env);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const missingVars = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('\n');
			throw new ConfigurationError(`Environment validation failed:\n${missingVars}`, { errors: error.errors });
		}
		throw error;
	}
}

// Validate environment variables on module load
export const env = validateEnvironment();
