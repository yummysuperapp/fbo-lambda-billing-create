# Documentación de API

## Visión General

Esta documentación describe las APIs y interfaces públicas del FBO Lambda Template. Incluye detalles sobre clientes, servicios, utilidades y tipos disponibles para el desarrollo de funciones Lambda en el ecosistema financiero de Yummy Inc.

## Tabla de Contenidos

- [Clients](#clients)
  - [HTTP Client](#http-client)
  - [MongoDB Client](#mongodb-client)
  - [PostgreSQL Client](#postgresql-client)
  - [S3 Client](#s3-client)
  - [BigQuery Client](#bigquery-client)
- [Services](#services)
  - [Finance Service](#finance-service)
- [Utils](#utils)
  - [Logger](#logger)
  - [Helpers](#helpers)
- [Types](#types)
- [Interfaces](#interfaces)
- [Configuration](#configuration)
- [Handlers](#handlers)

## Clients

### HTTP Client

Cliente HTTP robusto con soporte para reintentos, interceptores y configuración flexible para comunicación con APIs externas.

#### Importación

```typescript
import { HttpClient, createHttpClient, getHttpClient } from '@/clients/http.client';
```

#### Interfaces

```typescript
interface HttpClientInterface {
	get<T>(url: string, config?: HttpRequestConfig): Promise<T>;
	post<T>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>;
	put<T>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>;
	delete<T>(url: string, config?: HttpRequestConfig): Promise<T>;
	patch<T>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>;
}

interface HttpRequestConfig {
	timeout?: number;
	headers?: Record<string, string>;
	retries?: number;
	retryDelay?: number;
	baseURL?: string;
	params?: Record<string, any>;
	validateStatus?: (status: number) => boolean;
}
```

#### Constructor

```typescript
new HttpClient(config?: HttpClientConfig)
```

**Parámetros:**

- `config` (opcional): Configuración del cliente HTTP
  - `baseURL`: URL base para todas las requests
  - `timeout`: Timeout en milisegundos (default: 30000)
  - `retries`: Número de reintentos (default: 3)
  - `retryDelay`: Delay entre reintentos en ms (default: 1000)
  - `headers`: Headers por defecto

#### Métodos

##### `get<T>(url: string, config?: HttpRequestConfig): Promise<T>`

Realiza una petición GET HTTP.

##### `post<T>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>`

Realiza una petición POST HTTP.

##### `put<T>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>`

Realiza una petición PUT HTTP.

##### `delete<T>(url: string, config?: HttpRequestConfig): Promise<T>`

Realiza una petición DELETE HTTP.

##### `patch<T>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>`

Realiza una petición PATCH HTTP.

#### Ejemplo de Uso

```typescript
import { createHttpClient } from '@/clients';

const httpClient = createHttpClient({
	baseURL: 'https://api.example.com',
	timeout: 5000,
	retries: 2,
});

// GET request
const users = await httpClient.get<User[]>('/users');

// POST request
const newUser = await httpClient.post<User>('/users', {
	name: 'John Doe',
	email: 'john@example.com',
});
```

### MongoDB Client

Cliente MongoDB optimizado con pool de conexiones y operaciones CRUD completas.

#### Importación

```typescript
import { MongoClient, createMongoClient } from '@/clients/mongo.client';
```

#### Interfaces

```typescript
interface MongoClientInterface {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	findOne<T>(collection: string, filter: object): Promise<T | null>;
	findMany<T>(collection: string, filter: object): Promise<T[]>;
	insertOne<T>(collection: string, document: T): Promise<InsertResult>;
	insertMany<T>(collection: string, documents: T[]): Promise<InsertManyResult>;
	updateOne(collection: string, filter: object, update: object): Promise<UpdateResult>;
	updateMany(collection: string, filter: object, update: object): Promise<UpdateResult>;
	deleteOne(collection: string, filter: object): Promise<DeleteResult>;
	deleteMany(collection: string, filter: object): Promise<DeleteResult>;
}
```

#### Ejemplo de Uso

```typescript
import { createMongoClient } from '@/clients';

const mongoClient = await createMongoClient();

// Insertar documento
const result = await mongoClient.insertOne('users', {
	name: 'John Doe',
	email: 'john@example.com',
	createdAt: new Date(),
});

// Buscar documentos
const users = await mongoClient.findMany('users', {
	active: true,
});

// Actualizar documento
const updateResult = await mongoClient.updateOne(
	'users',
	{ email: 'john@example.com' },
	{ $set: { lastLogin: new Date() } }
);
```

### PostgreSQL Client

Cliente PostgreSQL con pool de conexiones, transacciones y queries tipadas.

#### Importación

```typescript
import { PostgresClient, createPostgresClient } from '@/clients/postgres.client';
```

#### Interfaces

```typescript
interface PostgresClientInterface {
	connect(): Promise<void>;
	disconnect(): Promise<void>;
	query<T>(text: string, params?: any[]): Promise<QueryResult<T>>;
	transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
}

interface QueryResult<T> {
	rows: T[];
	rowCount: number;
	command: string;
}
```

#### Ejemplo de Uso

```typescript
import { createPostgresClient } from '@/clients';

const pgClient = await createPostgresClient();

// Query simple
const result = await pgClient.query<User>('SELECT * FROM users WHERE active = $1', [true]);

// Transacción
const transferResult = await pgClient.transaction(async (client) => {
	await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [100, fromAccountId]);
	await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [100, toAccountId]);
	return { success: true };
});
```

### S3 Client

Cliente AWS S3 con SDK v3 para operaciones de almacenamiento de archivos.

#### Importación

```typescript
import { S3Client, createS3Client } from '@/clients/s3.client';
```

#### Interfaces

```typescript
interface S3ClientInterface {
	uploadFile(bucket: string, key: string, body: Buffer | Uint8Array | string): Promise<UploadResult>;
	downloadFile(bucket: string, key: string): Promise<Buffer>;
	deleteFile(bucket: string, key: string): Promise<void>;
	listObjects(bucket: string, prefix?: string): Promise<S3Object[]>;
	getPresignedUrl(bucket: string, key: string, expiresIn?: number): Promise<string>;
}

interface UploadResult {
	ETag: string;
	Location: string;
	Key: string;
	Bucket: string;
}

interface S3Object {
	Key: string;
	LastModified: Date;
	Size: number;
	ETag: string;
}
```

#### Ejemplo de Uso

```typescript
import { createS3Client } from '@/clients';

const s3Client = createS3Client();

// Subir archivo
const uploadResult = await s3Client.uploadFile('my-bucket', 'documents/report.pdf', fileBuffer);

// Generar URL presignada
const presignedUrl = await s3Client.getPresignedUrl(
	'my-bucket',
	'documents/report.pdf',
	3600 // 1 hora
);

// Listar objetos
const objects = await s3Client.listObjects('my-bucket', 'documents/');
```

### BigQuery Client

Cliente Google Cloud BigQuery para analytics y consultas de datos masivos.

#### Importación

```typescript
import { BigQueryClient, createBigQueryClient } from '@/clients/bigquery.client';
```

#### Interfaces

```typescript
interface BigQueryClientInterface {
	query<T>(sql: string, params?: any[]): Promise<T[]>;
	insertRows(datasetId: string, tableId: string, rows: any[]): Promise<void>;
	createTable(datasetId: string, tableId: string, schema: TableSchema): Promise<void>;
	getTableMetadata(datasetId: string, tableId: string): Promise<TableMetadata>;
}
```

#### Ejemplo de Uso

```typescript
import { createBigQueryClient } from '@/clients';

const bqClient = createBigQueryClient();

// Ejecutar consulta
const results = await bqClient.query<FinancialReport>(
	`
  SELECT 
    date,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count
  FROM \`project.dataset.transactions\`
  WHERE date >= @start_date
  GROUP BY date
  ORDER BY date
`,
	{
		start_date: '2024-01-01',
	}
);

// Insertar datos
const rows = [
	{ id: 1, name: 'Transaction 1', amount: 100.5 },
	{ id: 2, name: 'Transaction 2', amount: 250.75 },
];

await bqClient.insertRows('financial_data', 'transactions', rows);
```

## Services

### Finance Service

Servicio especializado para operaciones financieras y de negocio del backoffice.

#### Importación

```typescript
import { FinanceService, createFinanceService } from '@/services/finance.service';
```

#### Interfaces

```typescript
interface FinanceServiceInterface {
	processTransaction(transaction: Transaction): Promise<TransactionResult>;
	calculateExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate>;
	validatePayment(payment: Payment): Promise<ValidationResult>;
	generateFinancialReport(params: ReportParams): Promise<FinancialReport>;
}

interface Transaction {
	id: string;
	amount: number;
	currency: string;
	fromAccount: string;
	toAccount: string;
	type: 'transfer' | 'payment' | 'refund';
	metadata?: Record<string, any>;
}

interface TransactionResult {
	success: boolean;
	transactionId: string;
	status: 'pending' | 'completed' | 'failed';
	fees?: number;
	exchangeRate?: number;
}
```

#### Ejemplo de Uso

```typescript
import { createFinanceService } from '@/services';

const financeService = createFinanceService();

// Procesar transacción
const result = await financeService.processTransaction({
	id: 'txn_123',
	amount: 1000.0,
	currency: 'USD',
	fromAccount: 'acc_sender',
	toAccount: 'acc_receiver',
	type: 'transfer',
});

// Calcular tasa de cambio
const exchangeRate = await financeService.calculateExchangeRate('USD', 'COP');

// Generar reporte financiero
const report = await financeService.generateFinancialReport({
	startDate: '2024-01-01',
	endDate: '2024-01-31',
	currency: 'USD',
	includeDetails: true,
});
```

## Utils

### Logger

Sistema de logging estructurado con niveles configurables y formato JSON.

#### Importación

```typescript
import { createLogger, Logger } from '@/utils/logger.util';
```

#### Interfaces

```typescript
interface Logger {
	debug(message: string, meta?: object): void;
	info(message: string, meta?: object): void;
	warn(message: string, meta?: object): void;
	error(message: string, error?: Error, meta?: object): void;
	setContext(context: LogContext): void;
}

interface LogContext {
	requestId?: string;
	userId?: string;
	operation?: string;
	[key: string]: any;
}
```

#### Ejemplo de Uso

```typescript
import { createLogger } from '@/utils';

const logger = createLogger();

// Logging básico
logger.info('Processing transaction', { transactionId: 'txn_123' });
logger.error('Transaction failed', error, { transactionId: 'txn_123' });

// Con contexto
logger.setContext({ requestId: 'req_456', userId: 'user_789' });
logger.info('User action completed');
```

### Helpers

Funciones auxiliares reutilizables para operaciones comunes.

#### Importación

```typescript
import {
	retryWithBackoff,
	validateEmail,
	formatCurrency,
	generateId,
	parseDate,
	sanitizeInput,
} from '@/utils/helpers.util';
```

#### Funciones Disponibles

##### `retryWithBackoff<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>`

Ejecuta una operación con reintentos y backoff exponencial.

##### `validateEmail(email: string): boolean`

Valida formato de email.

##### `formatCurrency(amount: number, currency: string): string`

Formatea cantidad monetaria según la moneda.

##### `generateId(prefix?: string): string`

Genera ID único con prefijo opcional.

##### `parseDate(dateString: string): Date | null`

Parsea string de fecha de forma segura.

##### `sanitizeInput(input: string): string`

Sanitiza input del usuario.

#### Ejemplo de Uso

```typescript
import { retryWithBackoff, formatCurrency, generateId } from '@/utils';

// Retry con backoff
const result = await retryWithBackoff(() => httpClient.get('/api/data'), { maxRetries: 3, baseDelay: 1000 });

// Formatear moneda
const formatted = formatCurrency(1234.56, 'USD'); // "$1,234.56"

// Generar ID
const transactionId = generateId('txn'); // "txn_abc123def456"
```

## Types

### Core Types

```typescript
// Lambda Event Types
interface LambdaEvent {
	httpMethod?: string;
	path?: string;
	headers?: Record<string, string>;
	body?: string;
	queryStringParameters?: Record<string, string>;
}

interface LambdaResponse {
	statusCode: number;
	headers?: Record<string, string>;
	body: string;
}

// S3 Event Types
interface S3Event {
	Records: S3Record[];
}

interface S3Record {
	s3: {
		bucket: { name: string };
		object: { key: string; size: number };
	};
}

// Custom Event Types
interface CustomEvent {
	type: string;
	data: Record<string, any>;
	timestamp: string;
	source: string;
}

// Handler Context
interface HandlerContext {
	requestId: string;
	functionName: string;
	functionVersion: string;
	memoryLimitInMB: string;
	remainingTimeInMillis: number;
}
```

### Financial Types

```typescript
interface Transaction {
	id: string;
	amount: number;
	currency: string;
	fromAccount: string;
	toAccount: string;
	type: TransactionType;
	status: TransactionStatus;
	createdAt: Date;
	updatedAt: Date;
	metadata?: Record<string, any>;
}

type TransactionType = 'transfer' | 'payment' | 'refund' | 'fee';
type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

interface ExchangeRate {
	fromCurrency: string;
	toCurrency: string;
	rate: number;
	timestamp: Date;
	provider: string;
}

interface FinancialReport {
	period: {
		start: Date;
		end: Date;
	};
	summary: {
		totalTransactions: number;
		totalAmount: number;
		currency: string;
	};
	breakdown: ReportBreakdown[];
}
```

## Configuration

### Environment Configuration

```typescript
interface EnvironmentConfig {
	NODE_ENV: 'development' | 'staging' | 'production' | 'test';
	LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';

	// Database Configuration
	MONGODB_URI: string;
	MONGODB_DATABASE: string;
	POSTGRES_HOST: string;
	POSTGRES_PORT: number;
	POSTGRES_DATABASE: string;
	POSTGRES_USER: string;
	POSTGRES_PASSWORD: string;

	// AWS Configuration
	AWS_REGION: string;
	AWS_ACCESS_KEY_ID?: string;
	AWS_SECRET_ACCESS_KEY?: string;
	S3_BUCKET_NAME: string;

	// External APIs
	FINANCE_API_URL: string;
	FINANCE_API_KEY: string;

	// BigQuery
	GOOGLE_CLOUD_PROJECT_ID: string;
	GOOGLE_CLOUD_KEY_FILE?: string;
}
```

### App Configuration

```typescript
interface AppConfig {
	server: {
		port: number;
		timeout: number;
	};
	database: {
		mongodb: MongoConfig;
		postgres: PostgresConfig;
	};
	aws: {
		region: string;
		s3: S3Config;
	};
	logging: {
		level: string;
		format: 'json' | 'text';
	};
}
```

## Handlers

### Main Handler

Handler principal para eventos Lambda con routing automático.

#### Importación

```typescript
import { handler } from '@/handlers';
```

#### Signature

```typescript
export const handler = async (
	event: LambdaEvent | S3Event | CustomEvent,
	context: Context
): Promise<LambdaResponse> => {
	// Implementation
};
```

#### Ejemplo de Uso

```typescript
// En serverless.yml o SAM template
functions:
  processTransaction:
    handler: dist/index.handler
    events:
      - http:
          path: /transactions
          method: post
      - s3:
          bucket: financial-documents
          event: s3:ObjectCreated:*
```

## Error Handling

### Custom Exceptions

```typescript
class ValidationError extends Error {
	constructor(
		message: string,
		public field?: string
	) {
		super(message);
		this.name = 'ValidationError';
	}
}

class NetworkError extends Error {
	constructor(
		message: string,
		public statusCode?: number
	) {
		super(message);
		this.name = 'NetworkError';
	}
}

class DatabaseError extends Error {
	constructor(
		message: string,
		public operation?: string
	) {
		super(message);
		this.name = 'DatabaseError';
	}
}

class BusinessLogicError extends Error {
	constructor(
		message: string,
		public code?: string
	) {
		super(message);
		this.name = 'BusinessLogicError';
	}
}
```

### Error Response Helpers

```typescript
import { createErrorResponse, createSuccessResponse } from '@/utils';

// Error response
const errorResponse = createErrorResponse(400, 'Validation failed', {
	field: 'email',
	message: 'Invalid email format',
});

// Success response
const successResponse = createSuccessResponse({ transactionId: 'txn_123', status: 'completed' }, 201);
```

## Mejores Prácticas

### 1. Manejo de Errores

- Siempre usar try-catch en operaciones asíncronas
- Loggear errores con contexto suficiente
- Retornar respuestas de error consistentes

### 2. Logging

- Usar logging estructurado con metadatos
- Incluir requestId para correlación
- No loggear información sensible

### 3. Validación

- Validar todos los inputs usando Zod schemas
- Sanitizar datos de entrada
- Validar permisos y autorización

### 4. Performance

- Reutilizar conexiones de base de datos
- Implementar caching cuando sea apropiado
- Usar connection pooling

### 5. Seguridad

- No exponer información sensible en logs
- Usar variables de entorno para secretos
- Validar y sanitizar todos los inputs

## Versionado

Este template sigue [Semantic Versioning](https://semver.org/):

- **MAJOR**: Cambios incompatibles en la API
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correcciones de bugs compatibles

**Versión actual**: 1.0.0

## Soporte

Para soporte técnico o preguntas sobre la API:

- **Tech Lead**: José Carrillo <jose.carrillo@yummysuperapp.com>
- **Equipo**: Financial Backoffice Team
- **Documentación**: [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/yummysuperapp/fbo-lambda-template/issues)
