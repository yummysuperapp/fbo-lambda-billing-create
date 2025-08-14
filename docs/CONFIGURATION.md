# Configuración del Sistema

## Visión General

Este documento describe todas las configuraciones necesarias para el FBO Lambda Template, incluyendo variables de entorno, configuraciones de desarrollo, testing, despliegue y mejores prácticas para la gestión de configuraciones.

## Tabla de Contenidos

- [Variables de Entorno](#variables-de-entorno)
- [Configuración de TypeScript](#configuración-de-typescript)
- [Configuración de Testing](#configuración-de-testing)
- [Configuración de AWS](#configuración-de-aws)
- [Configuración de Bases de Datos](#configuración-de-bases-de-datos)
- [Configuración de Logging](#configuración-de-logging)
- [Configuración por Ambiente](#configuración-por-ambiente)
- [Secrets Management](#secrets-management)
- [Validación de Configuración](#validación-de-configuración)
- [Mejores Prácticas](#mejores-prácticas)

## Variables de Entorno

### Variables Requeridas

```bash
# === CONFIGURACIÓN BÁSICA ===
NODE_ENV=development|staging|production|test
AWS_REGION=us-east-1
LOG_LEVEL=debug|info|warn|error
APP_VERSION=1.0.0

# === BASES DE DATOS ===
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DATABASE=fbo_lambda_db
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_TIMEOUT_MS=5000

# PostgreSQL RDS
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=fbo_lambda
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_MAX_CONNECTIONS=20
POSTGRES_IDLE_TIMEOUT_MS=30000
POSTGRES_CONNECTION_TIMEOUT_MS=2000

# === SERVICIOS AWS ===
# Credenciales AWS (usar IAM roles en producción)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=... # Solo para roles temporales

# S3 Configuration
S3_BUCKET_NAME=fbo-lambda-bucket
S3_REGION=us-east-1
S3_PRESIGNED_URL_EXPIRES=3600

# CloudWatch
CLOUDWATCH_LOG_GROUP=/aws/lambda/fbo-lambda-template
CLOUDWATCH_LOG_RETENTION_DAYS=14

# === APIS EXTERNAS ===
# Finance API
FINANCE_API_URL=https://api.finance.example.com
FINANCE_API_KEY=...
FINANCE_API_TIMEOUT=10000
FINANCE_API_RETRIES=3

# Google BigQuery
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEYFILE_PATH=/path/to/service-account.json
BIGQUERY_DATASET=finance_data
BIGQUERY_LOCATION=US

# === SEGURIDAD ===
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
JWT_ISSUER=fbo-lambda-template

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
ENCRYPTION_ALGORITHM=aes-256-gcm

# === PERFORMANCE ===
# HTTP Client
HTTP_TIMEOUT=30000
HTTP_RETRIES=3
HTTP_RETRY_DELAY=1000

# Cache Configuration
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# === MONITORING ===
# X-Ray Tracing
AWS_XRAY_TRACING_NAME=fbo-lambda-template
AWS_XRAY_CONTEXT_MISSING=LOG_ERROR

# Custom Metrics
METRICS_NAMESPACE=FBO/Lambda
METRICS_ENABLED=true
```

### Variables Opcionales

```bash
# === DESARROLLO ===
DEBUG=true
VERBOSE_LOGGING=false
MOCK_EXTERNAL_APIS=false

# === TESTING ===
TEST_DATABASE_URL=mongodb://localhost:27017/test
TEST_POSTGRES_URL=postgresql://localhost:5432/test
TEST_TIMEOUT=30000

# === REDIS (Opcional para cache distribuido) ===
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=...
REDIS_DB=0
REDIS_MAX_RETRIES=3

# === RATE LIMITING ===
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# === FEATURE FLAGS ===
FEATURE_BIGQUERY_ENABLED=true
FEATURE_ADVANCED_LOGGING=false
FEATURE_CIRCUIT_BREAKER=true
```

## Configuración de TypeScript

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "allowUnusedLabels": false,
    "allowUnreachableCode": false,
    "paths": {
      "@/*": ["./src/*"],
      "@/clients/*": ["./src/clients/*"],
      "@/services/*": ["./src/services/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"],
      "@/interfaces/*": ["./src/interfaces/*"]
    }
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist", "coverage", "**/*.test.ts", "**/*.spec.ts"]
}
```

### Configuración de ESLint

```json
{
  "extends": ["@typescript-eslint/recommended", "@typescript-eslint/recommended-requiring-type-checking", "prettier"],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "import"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/no-misused-promises": "error",
    "import/order": [
      "error",
      {
        "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }
    ]
  },
  "ignorePatterns": ["dist/", "node_modules/", "coverage/"]
}
```

### Configuración de Prettier

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "quoteProps": "as-needed",
  "jsxSingleQuote": true,
  "bracketSameLine": false
}
```

## Configuración de Testing

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'coverage'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.ts',
        'src/types/**',
        'src/interfaces/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/clients': path.resolve(__dirname, './src/clients'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/interfaces': path.resolve(__dirname, './src/interfaces'),
    },
  },
});
```

### Setup de Testing

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';

// Cargar variables de entorno para testing
config({ path: '.env.test' });

// Mock de AWS SDK
beforeAll(() => {
  process.env.AWS_REGION = 'us-east-1';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

// Limpiar mocks después de cada test
afterEach(() => {
  vi.clearAllMocks();
});

// Configuración global de timeouts
beforeAll(() => {
  vi.setConfig({ testTimeout: 30000 });
});
```

## Configuración de AWS

### Configuración de Lambda

```yaml
# serverless.yml
service: fbo-lambda-template

provider:
  name: aws
  runtime: nodejs18.x
  region: ${env:AWS_REGION, 'us-east-1'}
  stage: ${env:STAGE, 'dev'}
  memorySize: 1024
  timeout: 30
  environment:
    NODE_ENV: ${self:provider.stage}
    LOG_LEVEL: ${env:LOG_LEVEL, 'info'}
    MONGODB_URI: ${env:MONGODB_URI}
    POSTGRES_HOST: ${env:POSTGRES_HOST}
    S3_BUCKET_NAME: ${env:S3_BUCKET_NAME}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - s3:GetObject
        - s3:PutObject
        - s3:DeleteObject
      Resource: 'arn:aws:s3:::${env:S3_BUCKET_NAME}/*'
    - Effect: Allow
      Action:
        - logs:CreateLogGroup
        - logs:CreateLogStream
        - logs:PutLogEvents
      Resource: 'arn:aws:logs:*:*:*'
    - Effect: Allow
      Action:
        - xray:PutTraceSegments
        - xray:PutTelemetryRecords
      Resource: '*'
    - Effect: Allow
      Action:
        - secretsmanager:GetSecretValue
      Resource: 'arn:aws:secretsmanager:*:*:secret:fbo-lambda/*'

functions:
  main:
    handler: dist/index.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - s3:
          bucket: ${env:S3_BUCKET_NAME}
          event: s3:ObjectCreated:*
          rules:
            - prefix: uploads/
            - suffix: .json

plugins:
  - serverless-plugin-typescript
  - serverless-offline
  - serverless-plugin-tracing

custom:
  serverless-offline:
    httpPort: 3000
    lambdaPort: 3002
```

### Configuración de CloudWatch

```typescript
// src/config/cloudwatch.config.ts
export const cloudWatchConfig = {
  logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/aws/lambda/fbo-lambda-template',
  logStreamName: () => {
    const date = new Date().toISOString().split('T')[0];
    const randomId = Math.random().toString(36).substring(7);
    return `${date}-${randomId}`;
  },
  retentionInDays: parseInt(process.env.CLOUDWATCH_LOG_RETENTION_DAYS || '14'),
  region: process.env.AWS_REGION || 'us-east-1',
};
```

### Configuración de X-Ray

```typescript
// src/config/xray.config.ts
import AWSXRay from 'aws-xray-sdk-core';

export const xrayConfig = {
  contextMissingStrategy: process.env.AWS_XRAY_CONTEXT_MISSING || 'LOG_ERROR',
  plugins: ['EC2Plugin', 'ECSPlugin'],
  captureAWS: true,
  captureHTTPs: true,
  capturePromises: true,
  logger: {
    debug: (message: string, meta?: any) => console.debug(message, meta),
    info: (message: string, meta?: any) => console.info(message, meta),
    warn: (message: string, meta?: any) => console.warn(message, meta),
    error: (message: string, meta?: any) => console.error(message, meta),
  },
};

// Configurar X-Ray
if (process.env.NODE_ENV !== 'test') {
  AWSXRay.config([AWSXRay.plugins.EC2Plugin, AWSXRay.plugins.ECSPlugin]);

  AWSXRay.middleware.setSamplingRules({
    version: 2,
    default: {
      fixed_target: 1,
      rate: 0.1,
    },
    rules: [
      {
        description: 'High priority operations',
        service_name: 'fbo-lambda-template',
        http_method: 'POST',
        url_path: '/transactions/*',
        fixed_target: 2,
        rate: 0.5,
      },
    ],
  });
}
```

## Configuración de Bases de Datos

### MongoDB Configuration

```typescript
// src/config/mongodb.config.ts
export const mongoConfig = {
  uri: process.env.MONGODB_URI!,
  database: process.env.MONGODB_DATABASE || 'fbo_lambda_db',
  options: {
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
    serverSelectionTimeoutMS: parseInt(process.env.MONGODB_TIMEOUT_MS || '5000'),
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4, skip trying IPv6
    keepAlive: true,
    keepAliveInitialDelay: 300000,
    retryWrites: true,
    retryReads: true,
    readPreference: 'primary',
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 5000,
    },
    readConcern: {
      level: 'majority',
    },
  },
  collections: {
    transactions: 'transactions',
    users: 'users',
    accounts: 'accounts',
    logs: 'logs',
  },
};

// Validación de configuración
export const validateMongoConfig = (): void => {
  if (!mongoConfig.uri) {
    throw new Error('MONGODB_URI is required');
  }

  if (!mongoConfig.uri.startsWith('mongodb://') && !mongoConfig.uri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection string');
  }
};
```

### PostgreSQL Configuration

```typescript
// src/config/postgres.config.ts
export const postgresConfig = {
  host: process.env.POSTGRES_HOST!,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE!,
  user: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,

  // Pool configuration
  max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
  min: 5,
  idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT_MS || '30000'),
  connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT_MS || '2000'),

  // SSL configuration
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,

  // Query configuration
  statement_timeout: 30000,
  query_timeout: 30000,

  // Application name for monitoring
  application_name: 'fbo-lambda-template',
};

// Validación de configuración
export const validatePostgresConfig = (): void => {
  const required = ['host', 'database', 'user', 'password'];
  const missing = required.filter((key) => !postgresConfig[key as keyof typeof postgresConfig]);

  if (missing.length > 0) {
    throw new Error(`Missing PostgreSQL configuration: ${missing.join(', ')}`);
  }

  if (postgresConfig.port < 1 || postgresConfig.port > 65535) {
    throw new Error('POSTGRES_PORT must be between 1 and 65535');
  }
};
```

### BigQuery Configuration

```typescript
// src/config/bigquery.config.ts
export const bigQueryConfig = {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE_PATH,
  dataset: process.env.BIGQUERY_DATASET || 'finance_data',
  location: process.env.BIGQUERY_LOCATION || 'US',

  // Job configuration
  jobConfig: {
    writeDisposition: 'WRITE_APPEND',
    createDisposition: 'CREATE_IF_NEEDED',
    autodetect: true,
    maxBadRecords: 0,
  },

  // Query configuration
  queryConfig: {
    useLegacySql: false,
    maximumBytesBilled: '1000000000', // 1GB limit
    jobTimeoutMs: 300000, // 5 minutes
  },

  // Tables
  tables: {
    transactions: 'transactions',
    analytics: 'analytics',
    audit_logs: 'audit_logs',
  },
};

// Validación de configuración
export const validateBigQueryConfig = (): void => {
  if (!bigQueryConfig.projectId) {
    throw new Error('GOOGLE_CLOUD_PROJECT_ID is required');
  }

  if (process.env.NODE_ENV === 'production' && !bigQueryConfig.keyFilename) {
    throw new Error('GOOGLE_CLOUD_KEYFILE_PATH is required in production');
  }
};
```

## Configuración de Logging

### Logger Configuration

```typescript
// src/config/logger.config.ts
import { createLogger, format, transports } from 'winston';
import CloudWatchTransport from 'winston-cloudwatch';

const { combine, timestamp, errors, json, colorize, simple } = format;

export const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json()),
  defaultMeta: {
    service: 'fbo-lambda-template',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new transports.Console({
      format: process.env.NODE_ENV === 'development' ? combine(colorize(), simple()) : json(),
    }),

    // CloudWatch transport (solo en AWS)
    ...(process.env.NODE_ENV !== 'test' && process.env.AWS_REGION
      ? [
          new CloudWatchTransport({
            logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/aws/lambda/fbo-lambda-template',
            logStreamName: () => {
              const date = new Date().toISOString().split('T')[0];
              const randomId = Math.random().toString(36).substring(7);
              return `${date}-${randomId}`;
            },
            awsRegion: process.env.AWS_REGION,
            jsonMessage: true,
            retentionInDays: parseInt(process.env.CLOUDWATCH_LOG_RETENTION_DAYS || '14'),
          }),
        ]
      : []),
  ],

  // No logging en test por defecto
  silent: process.env.NODE_ENV === 'test' && !process.env.VERBOSE_LOGGING,
};

// Configuración de structured logging
export const structuredLogConfig = {
  // Campos que siempre deben estar presentes
  requiredFields: ['timestamp', 'level', 'message', 'service'],

  // Campos sensibles que no deben loggearse
  sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization', 'cookie', 'x-api-key'],

  // Configuración de correlación
  correlation: {
    enabled: true,
    headerName: 'x-correlation-id',
    generateId: () => Math.random().toString(36).substring(2, 15),
  },
};
```

## Configuración por Ambiente

### Development Environment

```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=true
VERBOSE_LOGGING=true

# Bases de datos locales
MONGODB_URI=mongodb://localhost:27017/fbo_lambda_dev
POSTGRES_HOST=localhost
POSTGRES_DATABASE=fbo_lambda_dev

# Mocks habilitados
MOCK_EXTERNAL_APIS=true
FEATURE_BIGQUERY_ENABLED=false

# Timeouts largos para debugging
HTTP_TIMEOUT=60000
TEST_TIMEOUT=60000

# AWS local (LocalStack)
AWS_ENDPOINT_URL=http://localhost:4566
S3_BUCKET_NAME=fbo-lambda-dev-bucket
```

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
LOG_LEVEL=info
DEBUG=false

# Bases de datos de staging
MONGODB_URI=mongodb+srv://staging-user:password@staging-cluster.mongodb.net/fbo_lambda_staging
POSTGRES_HOST=staging-postgres.amazonaws.com
POSTGRES_DATABASE=fbo_lambda_staging

# APIs reales pero con datos de prueba
MOCK_EXTERNAL_APIS=false
FINANCE_API_URL=https://staging-api.finance.example.com

# Configuración similar a producción
FEATURE_BIGQUERY_ENABLED=true
FEATURE_CIRCUIT_BREAKER=true

# Timeouts de producción
HTTP_TIMEOUT=30000
TEST_TIMEOUT=30000

# AWS staging
AWS_REGION=us-east-1
S3_BUCKET_NAME=fbo-lambda-staging-bucket
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=warn
DEBUG=false
VERBOSE_LOGGING=false

# Bases de datos de producción (usar Secrets Manager)
MONGODB_URI=${ssm:/fbo-lambda/mongodb-uri}
POSTGRES_HOST=${ssm:/fbo-lambda/postgres-host}
POSTGRES_PASSWORD=${ssm:/fbo-lambda/postgres-password}

# APIs de producción
MOCK_EXTERNAL_APIS=false
FINANCE_API_URL=https://api.finance.example.com
FINANCE_API_KEY=${ssm:/fbo-lambda/finance-api-key}

# Todas las features habilitadas
FEATURE_BIGQUERY_ENABLED=true
FEATURE_ADVANCED_LOGGING=true
FEATURE_CIRCUIT_BREAKER=true

# Timeouts optimizados
HTTP_TIMEOUT=15000
HTTP_RETRIES=2

# AWS producción
AWS_REGION=us-east-1
S3_BUCKET_NAME=fbo-lambda-prod-bucket

# Seguridad
JWT_SECRET=${ssm:/fbo-lambda/jwt-secret}
ENCRYPTION_KEY=${ssm:/fbo-lambda/encryption-key}

# Monitoring
METRICS_ENABLED=true
AWS_XRAY_TRACING_NAME=fbo-lambda-template-prod
```

### Test Environment

```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=error
VERBOSE_LOGGING=false

# Bases de datos en memoria o locales
MONGODB_URI=mongodb://localhost:27017/fbo_lambda_test
POSTGRES_HOST=localhost
POSTGRES_DATABASE=fbo_lambda_test

# Mocks para todo
MOCK_EXTERNAL_APIS=true
FEATURE_BIGQUERY_ENABLED=false

# Timeouts cortos para tests rápidos
HTTP_TIMEOUT=5000
TEST_TIMEOUT=10000

# AWS mock
AWS_REGION=us-east-1
S3_BUCKET_NAME=test-bucket
```

## Secrets Management

### AWS Secrets Manager

```typescript
// src/config/secrets.config.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export class SecretsManager {
  private static cache = new Map<string, { value: string; expiry: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  static async getSecret(secretName: string): Promise<string> {
    // Verificar cache
    const cached = this.cache.get(secretName);
    if (cached && Date.now() < cached.expiry) {
      return cached.value;
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await secretsClient.send(command);

      if (!response.SecretString) {
        throw new Error(`Secret ${secretName} is empty`);
      }

      // Cachear el secreto
      this.cache.set(secretName, {
        value: response.SecretString,
        expiry: Date.now() + this.CACHE_TTL,
      });

      return response.SecretString;
    } catch (error) {
      throw new Error(`Failed to retrieve secret ${secretName}: ${error}`);
    }
  }

  static async getSecretJson<T>(secretName: string): Promise<T> {
    const secretString = await this.getSecret(secretName);
    try {
      return JSON.parse(secretString) as T;
    } catch (error) {
      throw new Error(`Failed to parse secret ${secretName} as JSON: ${error}`);
    }
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

// Configuración de secretos
export const secretsConfig = {
  // Database credentials
  mongodbUri: 'fbo-lambda/mongodb-uri',
  postgresPassword: 'fbo-lambda/postgres-password',

  // API keys
  financeApiKey: 'fbo-lambda/finance-api-key',
  googleCloudKey: 'fbo-lambda/google-cloud-key',

  // Security
  jwtSecret: 'fbo-lambda/jwt-secret',
  encryptionKey: 'fbo-lambda/encryption-key',

  // External services
  redisPassword: 'fbo-lambda/redis-password',
};
```

### Environment Variables Loader

```typescript
// src/config/env.loader.ts
import { config } from 'dotenv';
import { SecretsManager } from './secrets.config';

export class EnvironmentLoader {
  static async load(): Promise<void> {
    // Cargar archivo .env apropiado
    const envFile = this.getEnvFile();
    config({ path: envFile });

    // En producción, cargar secretos desde AWS Secrets Manager
    if (process.env.NODE_ENV === 'production') {
      await this.loadSecrets();
    }

    // Validar configuración
    this.validateEnvironment();
  }

  private static getEnvFile(): string {
    const env = process.env.NODE_ENV || 'development';
    return `.env.${env}`;
  }

  private static async loadSecrets(): Promise<void> {
    try {
      // Cargar secretos críticos
      if (!process.env.MONGODB_URI?.startsWith('mongodb')) {
        process.env.MONGODB_URI = await SecretsManager.getSecret('fbo-lambda/mongodb-uri');
      }

      if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = await SecretsManager.getSecret('fbo-lambda/jwt-secret');
      }

      if (!process.env.FINANCE_API_KEY) {
        process.env.FINANCE_API_KEY = await SecretsManager.getSecret('fbo-lambda/finance-api-key');
      }
    } catch (error) {
      console.error('Failed to load secrets:', error);
      throw error;
    }
  }

  private static validateEnvironment(): void {
    const required = ['NODE_ENV', 'AWS_REGION', 'MONGODB_URI', 'POSTGRES_HOST', 'POSTGRES_DATABASE'];

    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }
}
```

## Validación de Configuración

### Configuration Validator

```typescript
// src/config/validator.ts
import { z } from 'zod';

// Schema de validación para variables de entorno
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  AWS_REGION: z.string().min(1),

  // Database
  MONGODB_URI: z.string().url(),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((n) => n > 0 && n < 65536),
  POSTGRES_DATABASE: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),

  // APIs
  FINANCE_API_URL: z.string().url(),
  FINANCE_API_KEY: z.string().min(1),

  // Security
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(32),

  // Optional
  DEBUG: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  MOCK_EXTERNAL_APIS: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  HTTP_TIMEOUT: z.string().optional().transform(Number).default('30000'),
  HTTP_RETRIES: z.string().optional().transform(Number).default('3'),
});

export class ConfigValidator {
  static validate(): z.infer<typeof envSchema> {
    try {
      return envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('\n');

        throw new Error(`Environment validation failed:\n${issues}`);
      }
      throw error;
    }
  }

  static validateDatabase(): void {
    // Validar conexión MongoDB
    if (!process.env.MONGODB_URI?.match(/^mongodb(\+srv)?:\/\/.+/)) {
      throw new Error('MONGODB_URI must be a valid MongoDB connection string');
    }

    // Validar configuración PostgreSQL
    const pgPort = parseInt(process.env.POSTGRES_PORT || '5432');
    if (pgPort < 1 || pgPort > 65535) {
      throw new Error('POSTGRES_PORT must be between 1 and 65535');
    }
  }

  static validateAWS(): void {
    const region = process.env.AWS_REGION;
    const validRegions = [
      'us-east-1',
      'us-east-2',
      'us-west-1',
      'us-west-2',
      'eu-west-1',
      'eu-west-2',
      'eu-central-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'ap-northeast-1',
    ];

    if (!validRegions.includes(region!)) {
      throw new Error(`AWS_REGION must be one of: ${validRegions.join(', ')}`);
    }
  }

  static validateSecurity(): void {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }

    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }
  }
}
```

### Health Check Configuration

```typescript
// src/config/health.config.ts
export interface HealthCheckConfig {
  timeout: number;
  retries: number;
  interval: number;
}

export const healthCheckConfig: Record<string, HealthCheckConfig> = {
  mongodb: {
    timeout: 5000,
    retries: 3,
    interval: 30000,
  },
  postgres: {
    timeout: 5000,
    retries: 3,
    interval: 30000,
  },
  financeApi: {
    timeout: 10000,
    retries: 2,
    interval: 60000,
  },
  bigquery: {
    timeout: 15000,
    retries: 2,
    interval: 120000,
  },
};

export const healthEndpointConfig = {
  path: '/health',
  enableDetailed: process.env.NODE_ENV !== 'production',
  includeVersion: true,
  includeUptime: true,
  includeMemoryUsage: process.env.NODE_ENV === 'development',
};
```

## Mejores Prácticas

### 1. **Gestión de Secretos**

```typescript
// ✅ Correcto - Usar AWS Secrets Manager en producción
const dbPassword = await SecretsManager.getSecret('fbo-lambda/db-password');

// ❌ Incorrecto - Hardcodear secretos
const dbPassword = 'my-secret-password';

// ✅ Correcto - Variables de entorno para configuración no sensible
const timeout = parseInt(process.env.HTTP_TIMEOUT || '30000');

// ❌ Incorrecto - Hardcodear configuración
const timeout = 30000;
```

### 2. **Validación de Configuración**

```typescript
// ✅ Correcto - Validar al inicio de la aplicación
export const initializeApp = async (): Promise<void> => {
  await EnvironmentLoader.load();
  ConfigValidator.validate();
  ConfigValidator.validateDatabase();
  ConfigValidator.validateAWS();
};

// ❌ Incorrecto - No validar configuración
export const initializeApp = async (): Promise<void> => {
  // Asumir que todo está configurado correctamente
};
```

### 3. **Configuración por Ambiente**

```typescript
// ✅ Correcto - Configuración específica por ambiente
const getLogLevel = (): string => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return 'debug';
    case 'test':
      return 'error';
    case 'production':
      return 'warn';
    default:
      return 'info';
  }
};

// ❌ Incorrecto - Misma configuración para todos los ambientes
const logLevel = 'debug';
```

### 4. **Configuración de Timeouts**

```typescript
// ✅ Correcto - Timeouts configurables y apropiados
const httpConfig = {
  timeout: parseInt(process.env.HTTP_TIMEOUT || '30000'),
  retries: parseInt(process.env.HTTP_RETRIES || '3'),
  retryDelay: parseInt(process.env.HTTP_RETRY_DELAY || '1000'),
};

// ❌ Incorrecto - Timeouts muy largos o muy cortos
const httpConfig = {
  timeout: 300000, // 5 minutos - muy largo
  retries: 10, // Muchos reintentos
  retryDelay: 100, // Muy poco tiempo entre reintentos
};
```

### 5. **Feature Flags**

```typescript
// ✅ Correcto - Feature flags para controlar funcionalidades
const features = {
  bigQueryEnabled: process.env.FEATURE_BIGQUERY_ENABLED === 'true',
  advancedLogging: process.env.FEATURE_ADVANCED_LOGGING === 'true',
  circuitBreaker: process.env.FEATURE_CIRCUIT_BREAKER === 'true',
};

if (features.bigQueryEnabled) {
  await bigQueryClient.insert(data);
}

// ❌ Incorrecto - Funcionalidades siempre habilitadas
await bigQueryClient.insert(data); // Siempre ejecuta
```

### 6. **Configuración de Logging**

```typescript
// ✅ Correcto - No loggear información sensible
logger.info('User authenticated', {
  userId: user.id,
  email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Ofuscar email
  timestamp: new Date().toISOString(),
});

// ❌ Incorrecto - Loggear información sensible
logger.info('User authenticated', {
  userId: user.id,
  email: user.email,
  password: user.password, // ¡Nunca loggear passwords!
  token: user.token, // ¡Nunca loggear tokens!
});
```

### 7. **Configuración de Base de Datos**

```typescript
// ✅ Correcto - Pool de conexiones optimizado
const dbConfig = {
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  minConnections: 5,
  idleTimeout: 30000,
  connectionTimeout: 2000,
  retryAttempts: 3,
};

// ❌ Incorrecto - Una conexión por request
const dbConfig = {
  maxConnections: 1,
  minConnections: 1,
  idleTimeout: 0,
  connectionTimeout: 60000,
};
```

## Troubleshooting

### Problemas Comunes

1. **Error: Missing environment variables**

   ```bash
   # Verificar que el archivo .env existe
   ls -la .env*

   # Verificar que las variables están cargadas
   node -e "console.log(process.env.NODE_ENV)"
   ```

2. **Error: Database connection failed**

   ```bash
   # Verificar conectividad
   telnet $POSTGRES_HOST $POSTGRES_PORT

   # Verificar credenciales
   psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DATABASE
   ```

3. **Error: AWS credentials not found**

   ```bash
   # Verificar credenciales AWS
   aws sts get-caller-identity

   # Verificar región
   echo $AWS_REGION
   ```

4. **Error: Secret not found in Secrets Manager**

   ```bash
   # Listar secretos
   aws secretsmanager list-secrets

   # Obtener secreto específico
   aws secretsmanager get-secret-value --secret-id fbo-lambda/mongodb-uri
   ```

### Scripts de Diagnóstico

```typescript
// scripts/diagnose-config.ts
import { ConfigValidator } from '../src/config/validator';
import { EnvironmentLoader } from '../src/config/env.loader';

async function diagnoseConfiguration(): Promise<void> {
  try {
    console.log('🔍 Diagnosing configuration...');

    // Cargar configuración
    await EnvironmentLoader.load();
    console.log('✅ Environment loaded successfully');

    // Validar configuración
    ConfigValidator.validate();
    console.log('✅ Configuration validation passed');

    // Validar bases de datos
    ConfigValidator.validateDatabase();
    console.log('✅ Database configuration valid');

    // Validar AWS
    ConfigValidator.validateAWS();
    console.log('✅ AWS configuration valid');

    // Validar seguridad
    ConfigValidator.validateSecurity();
    console.log('✅ Security configuration valid');

    console.log('🎉 All configuration checks passed!');
  } catch (error) {
    console.error('❌ Configuration diagnosis failed:', error);
    process.exit(1);
  }
}

diagnoseConfiguration();
```

---

**Mantenido por**: Financial Backoffice Team  
**Tech Lead**: José Carrillo <jose.carrillo@yummysuperapp.com>  
**Última actualización**: Agosto 2025  
**Versión**: 1.0.0
