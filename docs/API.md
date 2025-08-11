# Documentación de API

## Visión General

Esta documentación describe las APIs y interfaces públicas del FBO Lambda Template. Incluye detalles sobre clientes, servicios, utilidades y tipos disponibles.

## Tabla de Contenidos

- [Clients](#clients)
  - [HTTP Client](#http-client)
  - [MongoDB Client](#mongodb-client)
  - [PostgreSQL Client](#postgresql-client)
  - [S3 Client](#s3-client)
- [Services](#services)
  - [Finance Service](#finance-service)
- [Utils](#utils)
  - [Logger](#logger)
  - [Helpers](#helpers)
- [Types](#types)
- [Interfaces](#interfaces)
- [Exceptions](#exceptions)

## Clients

### HTTP Client

Cliente HTTP robusto con soporte para reintentos, interceptores y configuración flexible.

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
}

interface HttpRequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  baseURL?: string;
  params?: Record<string, any>;
}
```

#### Constructor

```typescript
new HttpClient(config?: HttpRequestConfig)
```

**Parámetros:**
- `config` (opcional): Configuración del cliente HTTP

**Ejemplo:**
```typescript
const client = new HttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
  headers: {
    'Authorization': 'Bearer token',
    'Content-Type': 'application/json'
  }
});
```

#### Métodos

##### get<T>(url: string, config?: HttpRequestConfig): Promise<T>

Realiza una petición GET HTTP.

**Parámetros:**
- `url`: URL del endpoint
- `config` (opcional): Configuración específica para esta petición

**Retorna:** Promise con los datos de respuesta

**Ejemplo:**
```typescript
const users = await client.get<User[]>('/users');
const user = await client.get<User>('/users/123', {
  headers: { 'Accept': 'application/json' }
});
```

##### post<T>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>

Realiza una petición POST HTTP.

**Parámetros:**
- `url`: URL del endpoint
- `data` (opcional): Datos a enviar en el body
- `config` (opcional): Configuración específica para esta petición

**Retorna:** Promise con los datos de respuesta

**Ejemplo:**
```typescript
const newUser = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

##### put<T>(url: string, data?: any, config?: HttpRequestConfig): Promise<T>

Realiza una petición PUT HTTP.

**Parámetros:**
- `url`: URL del endpoint
- `data` (opcional): Datos a enviar en el body
- `config` (opcional): Configuración específica para esta petición

**Retorna:** Promise con los datos de respuesta

**Ejemplo:**
```typescript
const updatedUser = await client.put<User>('/users/123', {
  name: 'Jane Doe'
});
```

##### delete<T>(url: string, config?: HttpRequestConfig): Promise<T>

Realiza una petición DELETE HTTP.

**Parámetros:**
- `url`: URL del endpoint
- `config` (opcional): Configuración específica para esta petición

**Retorna:** Promise con los datos de respuesta

**Ejemplo:**
```typescript
await client.delete('/users/123');
```

#### Factory Functions

##### createHttpClient(config?: HttpRequestConfig): HttpClient

Crea una nueva instancia del cliente HTTP.

**Ejemplo:**
```typescript
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 10000
});
```

##### getHttpClient(): HttpClient

Retorna una instancia singleton del cliente HTTP.

**Ejemplo:**
```typescript
const client = getHttpClient();
```

### MongoDB Client

Cliente para operaciones con MongoDB.

#### Importación
```typescript
import { createMongoClient, getMongoClient } from '@/clients/mongo.client';
```

#### Interfaces

```typescript
interface MongoClientInterface {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  db(name?: string): Db;
}
```

#### Factory Functions

##### createMongoClient(uri?: string): Promise<MongoClient>

Crea y conecta un nuevo cliente MongoDB.

**Parámetros:**
- `uri` (opcional): URI de conexión a MongoDB

**Retorna:** Promise con el cliente conectado

**Ejemplo:**
```typescript
const client = await createMongoClient('mongodb://localhost:27017/myapp');
const db = client.db();
const users = await db.collection('users').find({}).toArray();
```

##### getMongoClient(): Promise<MongoClient>

Retorna una instancia singleton del cliente MongoDB.

**Ejemplo:**
```typescript
const client = await getMongoClient();
```

### PostgreSQL Client

Cliente para operaciones con PostgreSQL.

#### Importación
```typescript
import { createPostgresClient, getPostgresClient } from '@/clients/postgres.client';
```

#### Interfaces

```typescript
interface PostgresClientInterface {
  query<T>(text: string, params?: any[]): Promise<QueryResult<T>>;
  connect(): Promise<void>;
  end(): Promise<void>;
}
```

#### Factory Functions

##### createPostgresClient(config?: PoolConfig): Promise<Pool>

Crea un nuevo pool de conexiones PostgreSQL.

**Parámetros:**
- `config` (opcional): Configuración del pool

**Retorna:** Promise con el pool de conexiones

**Ejemplo:**
```typescript
const client = await createPostgresClient({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'user',
  password: 'password',
  max: 20
});

const result = await client.query('SELECT * FROM users WHERE id = $1', [123]);
```

### S3 Client

Cliente para operaciones con AWS S3.

#### Importación
```typescript
import { createS3Client, getS3Client } from '@/clients/s3.client';
```

#### Interfaces

```typescript
interface S3ClientInterface {
  uploadFile(bucket: string, key: string, body: Buffer | Uint8Array | string): Promise<void>;
  downloadFile(bucket: string, key: string): Promise<Buffer>;
  deleteFile(bucket: string, key: string): Promise<void>;
  listFiles(bucket: string, prefix?: string): Promise<S3Object[]>;
  fileExists(bucket: string, key: string): Promise<boolean>;
  getPresignedUrl(bucket: string, key: string, expiresIn?: number): Promise<string>;
}
```

#### Factory Functions

##### createS3Client(config?: S3ClientConfig): S3Client

Crea un nuevo cliente S3.

**Parámetros:**
- `config` (opcional): Configuración del cliente S3

**Retorna:** Cliente S3 configurado

**Ejemplo:**
```typescript
const s3Client = createS3Client({
  region: 'us-east-1'
});

// Upload file
await s3Client.uploadFile('my-bucket', 'path/to/file.txt', fileBuffer);

// Download file
const fileData = await s3Client.downloadFile('my-bucket', 'path/to/file.txt');

// List files
const files = await s3Client.listFiles('my-bucket', 'path/');
```

## Services

### Finance Service

Servicio para operaciones financieras y de negocio.

#### Importación
```typescript
import { FinanceService } from '@/services/finance.service';
```

#### Interfaces

```typescript
interface FinanceServiceInterface {
  getExchangeRates(): Promise<ExchangeRates>;
  convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number>;
  validateTransaction(transaction: Transaction): Promise<ValidationResult>;
  calculateFees(amount: number, feeStructure: FeeStructure): Promise<number>;
}

interface ExchangeRates {
  [currency: string]: number;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  description?: string;
  timestamp: Date;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

#### Constructor

```typescript
new FinanceService(httpClient?: HttpClient)
```

**Parámetros:**
- `httpClient` (opcional): Cliente HTTP para APIs externas

#### Métodos

##### getExchangeRates(): Promise<ExchangeRates>

Obtiene las tasas de cambio actuales.

**Retorna:** Promise con las tasas de cambio

**Ejemplo:**
```typescript
const service = new FinanceService();
const rates = await service.getExchangeRates();
console.log(rates.EUR); // 0.85
```

##### convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number>

Convierte una cantidad de una moneda a otra.

**Parámetros:**
- `amount`: Cantidad a convertir
- `fromCurrency`: Moneda origen
- `toCurrency`: Moneda destino

**Retorna:** Promise con la cantidad convertida

**Ejemplo:**
```typescript
const converted = await service.convertCurrency(100, 'USD', 'EUR');
console.log(converted); // 85.0
```

##### validateTransaction(transaction: Transaction): Promise<ValidationResult>

Valida una transacción financiera.

**Parámetros:**
- `transaction`: Transacción a validar

**Retorna:** Promise con el resultado de validación

**Ejemplo:**
```typescript
const transaction = {
  id: 'txn-123',
  amount: 100.50,
  currency: 'USD',
  type: 'credit',
  timestamp: new Date()
};

const result = await service.validateTransaction(transaction);
if (result.isValid) {
  console.log('Transaction is valid');
} else {
  console.log('Errors:', result.errors);
}
```

## Utils

### Logger

Sistema de logging estructurado.

#### Importación
```typescript
import { createLogger } from '@/utils/logger.util';
```

#### Interfaces

```typescript
interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}
```

#### Factory Function

##### createLogger(service: string): Logger

Crea un logger para un servicio específico.

**Parámetros:**
- `service`: Nombre del servicio

**Retorna:** Instancia del logger

**Ejemplo:**
```typescript
const logger = createLogger('UserService');

logger.info('User created', { userId: 123 });
logger.error('Failed to create user', { error: 'Validation failed' });
logger.debug('Processing user data', { data: userData });
```

### Helpers

Funciones auxiliares y utilidades.

#### Importación
```typescript
import { 
  retryWithBackoff, 
  validateEmail, 
  formatCurrency,
  parseDate,
  generateId
} from '@/utils/helpers';
```

#### Funciones

##### retryWithBackoff<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<T>

Ejecuta una operación con reintentos y backoff exponencial.

**Parámetros:**
- `operation`: Función a ejecutar
- `options` (opcional): Opciones de retry

**Retorna:** Promise con el resultado de la operación

**Ejemplo:**
```typescript
const result = await retryWithBackoff(
  async () => await apiCall(),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000
  }
);
```

##### validateEmail(email: string): boolean

Valida un email usando regex.

**Parámetros:**
- `email`: Email a validar

**Retorna:** true si es válido, false si no

**Ejemplo:**
```typescript
const isValid = validateEmail('user@example.com'); // true
const isInvalid = validateEmail('invalid-email'); // false
```

##### formatCurrency(amount: number, currency: string): string

Formatea una cantidad como moneda.

**Parámetros:**
- `amount`: Cantidad a formatear
- `currency`: Código de moneda

**Retorna:** String formateado

**Ejemplo:**
```typescript
const formatted = formatCurrency(1234.56, 'USD'); // "$1,234.56"
```

##### parseDate(dateString: string): Date

Parsea una fecha desde string.

**Parámetros:**
- `dateString`: String de fecha

**Retorna:** Objeto Date

**Ejemplo:**
```typescript
const date = parseDate('2023-12-25'); // Date object
```

##### generateId(): string

Genera un ID único.

**Retorna:** String con ID único

**Ejemplo:**
```typescript
const id = generateId(); // "abc123def456"
```

## Types

### Tipos Globales

```typescript
// Disponibles globalmente sin importación
declare global {
  namespace FBOLambda {
    type Environment = 'development' | 'staging' | 'production' | 'test';
    type LogLevel = 'debug' | 'info' | 'warn' | 'error';
    type Nullable<T> = T | null;
    type Optional<T> = T | undefined;
    type AsyncResult<T> = Promise<T>;
    
    type DatabaseResult<T> = {
      success: boolean;
      data?: T;
      error?: string;
      metadata?: Record<string, unknown>;
    };
    
    type ApiResponse<T> = {
      success: boolean;
      data?: T;
      message?: string;
      errors?: string[];
      timestamp: string;
    };
  }
}
```

### Tipos de Clientes

```typescript
// HTTP Client Types
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface HttpRequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  baseURL?: string;
  params?: Record<string, any>;
}

// Database Types
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

// S3 Types
interface S3Object {
  Key: string;
  Size: number;
  LastModified: Date;
  ETag: string;
}
```

## Interfaces

### Base Interfaces

```typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BaseService {
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
}

interface BaseClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}
```

## Exceptions

### Excepciones Personalizadas

#### Importación
```typescript
import { 
  ValidationError, 
  NetworkError, 
  DatabaseError, 
  BusinessLogicError 
} from '@/interfaces/exceptions';
```

#### ValidationError

```typescript
class ValidationError extends Error {
  constructor(message: string, public details: string[] = []) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

**Uso:**
```typescript
throw new ValidationError('Invalid input', ['Email is required', 'Age must be positive']);
```

#### NetworkError

```typescript
class NetworkError extends Error {
  constructor(message: string, public statusCode?: number, public url?: string) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

**Uso:**
```typescript
throw new NetworkError('Request failed', 500, 'https://api.example.com/users');
```

#### DatabaseError

```typescript
class DatabaseError extends Error {
  constructor(message: string, public operation?: string, public table?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}
```

**Uso:**
```typescript
throw new DatabaseError('Connection failed', 'SELECT', 'users');
```

#### BusinessLogicError

```typescript
class BusinessLogicError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}
```

**Uso:**
```typescript
throw new BusinessLogicError('Insufficient funds', 'INSUFFICIENT_FUNDS');
```

## Ejemplos de Uso Completos

### Ejemplo 1: Procesamiento de Transacción

```typescript
import { createHttpClient } from '@/clients/http.client';
import { createMongoClient } from '@/clients/mongo.client';
import { FinanceService } from '@/services/finance.service';
import { createLogger } from '@/utils/logger.util';
import { ValidationError } from '@/interfaces/exceptions';

async function processTransaction(transactionData: any) {
  const logger = createLogger('TransactionProcessor');
  const httpClient = createHttpClient();
  const mongoClient = await createMongoClient();
  const financeService = new FinanceService(httpClient);

  try {
    // Validar transacción
    const validation = await financeService.validateTransaction(transactionData);
    if (!validation.isValid) {
      throw new ValidationError('Invalid transaction', validation.errors);
    }

    // Convertir moneda si es necesario
    let amount = transactionData.amount;
    if (transactionData.currency !== 'USD') {
      amount = await financeService.convertCurrency(
        amount, 
        transactionData.currency, 
        'USD'
      );
    }

    // Guardar en base de datos
    const db = mongoClient.db();
    const result = await db.collection('transactions').insertOne({
      ...transactionData,
      amountUSD: amount,
      processedAt: new Date()
    });

    logger.info('Transaction processed successfully', { 
      transactionId: result.insertedId 
    });

    return { success: true, id: result.insertedId };

  } catch (error) {
    logger.error('Failed to process transaction', { error });
    throw error;
  } finally {
    await mongoClient.close();
  }
}
```

### Ejemplo 2: Upload de Archivo a S3

```typescript
import { createS3Client } from '@/clients/s3.client';
import { createLogger } from '@/utils/logger.util';
import { retryWithBackoff } from '@/utils/helpers';

async function uploadFileWithRetry(
  bucket: string, 
  key: string, 
  fileBuffer: Buffer
) {
  const logger = createLogger('FileUploader');
  const s3Client = createS3Client();

  try {
    await retryWithBackoff(
      async () => {
        await s3Client.uploadFile(bucket, key, fileBuffer);
        logger.info('File uploaded successfully', { bucket, key });
      },
      {
        maxRetries: 3,
        baseDelay: 1000
      }
    );

    // Generar URL presignada para acceso
    const presignedUrl = await s3Client.getPresignedUrl(bucket, key, 3600);
    
    return { success: true, url: presignedUrl };

  } catch (error) {
    logger.error('Failed to upload file', { bucket, key, error });
    throw error;
  }
}
```

## Versionado de API

### Versión Actual: 1.0.0

### Changelog

#### v1.0.0
- Implementación inicial de todos los clientes
- Sistema de logging estructurado
- Manejo de excepciones personalizado
- Suite completa de tests

### Compatibilidad

- **Node.js**: 18+
- **TypeScript**: 5.0+
- **AWS SDK**: v3
- **MongoDB**: 4.4+
- **PostgreSQL**: 12+

### Deprecaciones

Ninguna en la versión actual.

### Roadmap

#### v1.1.0 (Próxima)
- Circuit breaker pattern
- Métricas avanzadas
- Cache distribuido

#### v2.0.0 (Futuro)
- Breaking changes en interfaces
- Migración a nuevas versiones de dependencias
- Nuevas funcionalidades de negocio