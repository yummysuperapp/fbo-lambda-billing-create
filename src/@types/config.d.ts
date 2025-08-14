/**
 * Configuration Types
 */

// Finance Service Configuration
export interface FinanceConfig {
	baseUrl: string;
	apiKey: string;
	dispersionEndpoint: string;
}

// AWS Configuration
export interface AwsConfig {
	region: string;
	accessKeyId?: string;
	secretAccessKey?: string;
	s3BucketName: string;
}

// PostgreSQL Configuration
export interface PostgresConfig {
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
	ssl: boolean;
	maxConnections: number;
	connectionTimeoutMillis: number;
	idleTimeoutMillis: number;
}

// MongoDB Configuration
export interface MongoConfig {
	uri: string;
	database: string;
	maxPoolSize: number;
	minPoolSize: number;
	maxIdleTimeMS: number;
	serverSelectionTimeoutMS: number;
}

// N8N Configuration
export interface N8nConfig {
	host: string;
	apiKey: string;
}

// BigQuery Configuration
export interface BigQueryConfig {
	projectId: string;
	datasetId: string;
	location?: string;
	keyFilename?: string;
	credentials?: {
		client_email: string;
		private_key: string;
		project_id: string;
	};
	maxRetries?: number;
	autoRetry?: boolean;
}

// Application Configuration
export interface AppConfig {
	appName: string;
	vertical: string;
	expirationHours: number;
	finance: FinanceConfig;
	aws: AwsConfig;
	postgres: PostgresConfig;
	mongo: MongoConfig;
	n8n: N8nConfig;
	bigquery: BigQueryConfig;
}
