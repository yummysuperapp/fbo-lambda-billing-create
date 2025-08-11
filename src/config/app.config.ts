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

/**
 * Creates the application configuration from validated environment variables
 * 
 * @param {EnvVars} envVars - Validated environment variables
 * @returns {AppConfig} Complete application configuration
 */
function createConfig(envVars: EnvVars): AppConfig {
  return {
    finance: {
      baseUrl: envVars.FINANCE_BASE_URL,
      apiKey: envVars.FINANCE_API_KEY,
      dispersionEndpoint: envVars.FINANCE_DISPERSION_ENDPOINT,
    },
    aws: {
      ...(envVars.AWS_ACCESS_KEY_ID && { accessKeyId: envVars.AWS_ACCESS_KEY_ID }),
      ...(envVars.AWS_SECRET_ACCESS_KEY && { secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY }),
      region: envVars.AWS_REGION,
      s3BucketName: envVars.S3_BUCKET_NAME,
    },
    postgres: {
      host: envVars.PG_HOST,
      port: envVars.PG_PORT,
      database: envVars.PG_DATABASE,
      user: envVars.PG_USER,
      password: envVars.PG_PASSWORD,
      ssl: envVars.PG_SSL,
      maxConnections: envVars.PG_MAX_CONNECTIONS,
      connectionTimeoutMillis: envVars.PG_CONNECTION_TIMEOUT,
      idleTimeoutMillis: envVars.PG_IDLE_TIMEOUT,
    },
    mongo: {
      uri: envVars.MONGO_URI,
      database: envVars.MONGO_DATABASE,
      maxPoolSize: envVars.MONGO_MAX_POOL_SIZE,
      minPoolSize: envVars.MONGO_MIN_POOL_SIZE,
      maxIdleTimeMS: envVars.MONGO_MAX_IDLE_TIME,
      serverSelectionTimeoutMS: envVars.MONGO_SERVER_SELECTION_TIMEOUT,
    },
    appName: envVars.AWS_APP_NAME,
    vertical: envVars.VERTICAL,
    expirationHours: envVars.EXPIRATION_HOURS,
    n8n: {
      host: envVars.N8N_HOST,
      apiKey: envVars.N8N_API_KEY,
    },
  };
}

// Create application configuration
export const config = createConfig(env);

// Environment flags for convenience
export const NODE_ENV = env.NODE_ENV;
export const IS_LOCAL = NODE_ENV === 'local';
export const IS_DEVELOPMENT = NODE_ENV === 'development' || NODE_ENV === 'dev';
export const IS_PRODUCTION = NODE_ENV === 'production' || NODE_ENV === 'prod';

// Parse allowed S3 buckets from environment variable
export const ALLOWED_S3_BUCKETS = env.ALLOWED_S3_BUCKETS.split(',').map(bucket => bucket.trim());

// Log configuration status on module load
console.log('✅ [Config] Environment validation successful');
console.log(`🚀 [Config] Running in ${NODE_ENV} mode`);
console.log(`📦 [Config] App: ${config.appName} (${config.vertical})`);
console.log(`🌍 [Config] AWS Region: ${config.aws.region}`);