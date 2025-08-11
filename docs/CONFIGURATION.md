# Guía de Configuración

## Visión General

Esta guía describe todas las opciones de configuración disponibles en el FBO Lambda Template, incluyendo variables de entorno, configuración de TypeScript, testing, y deployment.

## Tabla de Contenidos

- [Variables de Entorno](#variables-de-entorno)
- [Configuración de TypeScript](#configuración-de-typescript)
- [Configuración de Testing](#configuración-de-testing)
- [Configuración de AWS](#configuración-de-aws)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Configuración de Logging](#configuración-de-logging)
- [Configuración de Desarrollo](#configuración-de-desarrollo)
- [Configuración de Producción](#configuración-de-producción)

## Variables de Entorno

### Archivo .env

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Entorno de aplicación
NODE_ENV=development
LOG_LEVEL=debug

# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017/fbo-lambda
MONGODB_DATABASE=fbo-lambda

# Base de datos PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=fbo-lambda
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_SSL=false
POSTGRES_MAX_CONNECTIONS=20

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=fbo-lambda-bucket

# HTTP Client Configuration
HTTP_TIMEOUT=30000
HTTP_RETRIES=3
HTTP_RETRY_DELAY=1000

# External APIs
FINANCE_API_URL=https://api.exchangerate-api.com/v4/latest
FINANCE_API_KEY=your-api-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
DATADOG_API_KEY=your-datadog-key
```

### Variables por Entorno

#### Development (.env.development)

```bash
NODE_ENV=development
LOG_LEVEL=debug
MONGODB_URI=mongodb://localhost:27017/fbo-lambda-dev
POSTGRES_DATABASE=fbo-lambda-dev
AWS_REGION=us-east-1
HTTP_TIMEOUT=10000
```

#### Testing (.env.test)

```bash
NODE_ENV=test
LOG_LEVEL=error
MONGODB_URI=mongodb://localhost:27017/fbo-lambda-test
POSTGRES_DATABASE=fbo-lambda-test
AWS_REGION=us-east-1
HTTP_TIMEOUT=5000
```

#### Staging (.env.staging)

```bash
NODE_ENV=staging
LOG_LEVEL=info
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fbo-lambda-staging
POSTGRES_HOST=staging-db.amazonaws.com
AWS_REGION=us-east-1
HTTP_TIMEOUT=15000
```

#### Production (.env.production)

```bash
NODE_ENV=production
LOG_LEVEL=warn
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/fbo-lambda-prod
POSTGRES_HOST=prod-db.amazonaws.com
AWS_REGION=us-east-1
HTTP_TIMEOUT=30000
SENTRY_DSN=your-production-sentry-dsn
```

### Validación de Variables

```typescript
// src/config/env.validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']),
  
  // Database
  MONGODB_URI: z.string().url(),
  MONGODB_DATABASE: z.string().min(1),
  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive(),
  POSTGRES_DATABASE: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  
  // AWS
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
  AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  S3_BUCKET_NAME: z.string().min(1),
  
  // HTTP
  HTTP_TIMEOUT: z.coerce.number().int().positive().default(30000),
  HTTP_RETRIES: z.coerce.number().int().nonnegative().default(3),
  HTTP_RETRY_DELAY: z.coerce.number().int().positive().default(1000),
});

export const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment variables:', error.errors);
    process.exit(1);
  }
};
```

## Configuración de TypeScript

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/clients/*": ["src/clients/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/interfaces/*": ["src/interfaces/*"],
      "@/types/*": ["src/types/*"],
      "@tests/*": ["tests/*"],
      "@mocks/*": ["tests/__mocks__/*"],
      "@fixtures/*": ["tests/__fixtures__/*"]
    }
  },
  "include": [
    "src/**/*",
    "tests/**/*",
    "src/types/global.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "coverage"
  ]
}
```

### tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": false
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "tests/**/*",
    "node_modules",
    "dist"
  ]
}
```

### Configuración de Path Mapping

Para que los path aliases funcionen correctamente:

1. **En desarrollo**: TypeScript resuelve automáticamente
2. **En runtime**: Usar `tsconfig-paths` o `module-alias`
3. **En tests**: Vitest usa la configuración de `tsconfig.json`

```typescript
// src/config/paths.ts
import { resolve } from 'path';

export const paths = {
  root: resolve(__dirname, '../..'),
  src: resolve(__dirname, '..'),
  dist: resolve(__dirname, '../../dist'),
  tests: resolve(__dirname, '../../tests'),
  docs: resolve(__dirname, '../../docs'),
  coverage: resolve(__dirname, '../../coverage'),
};
```

## Configuración de Testing

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'coverage',
      'tests/__mocks__',
      'tests/__fixtures__'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/index.ts'
      ],
      thresholds: {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/clients': resolve(__dirname, './src/clients'),
      '@/services': resolve(__dirname, './src/services'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/interfaces': resolve(__dirname, './src/interfaces'),
      '@/types': resolve(__dirname, './src/types'),
      '@tests': resolve(__dirname, './tests'),
      '@mocks': resolve(__dirname, './tests/__mocks__'),
      '@fixtures': resolve(__dirname, './tests/__fixtures__')
    }
  }
});
```

### Setup de Tests

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { config } from 'dotenv';

// Cargar variables de entorno para tests
config({ path: '.env.test' });

// Setup global antes de todos los tests
beforeAll(async () => {
  // Configuración global de tests
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

// Cleanup después de todos los tests
afterAll(async () => {
  // Cleanup global
});

// Setup antes de cada test
beforeEach(() => {
  // Reset de mocks globales
  vi.clearAllMocks();
});

// Cleanup después de cada test
afterEach(() => {
  // Cleanup específico por test
});
```

## Configuración de AWS

### AWS SDK v3 Configuration

```typescript
// src/config/aws.config.ts
import { S3ClientConfig } from '@aws-sdk/client-s3';

export const awsConfig: S3ClientConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  } : undefined, // Usar IAM roles si no hay credenciales explícitas
  maxAttempts: 3,
  retryMode: 'adaptive',
};

export const s3Config = {
  bucketName: process.env.S3_BUCKET_NAME!,
  region: process.env.AWS_REGION || 'us-east-1',
  presignedUrlExpiration: 3600, // 1 hora
};
```

### IAM Policies

#### Política para S3

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::fbo-lambda-bucket",
        "arn:aws:s3:::fbo-lambda-bucket/*"
      ]
    }
  ]
}
```

#### Política para Lambda

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::fbo-lambda-bucket/*"
    }
  ]
}
```

## Configuración de Base de Datos

### MongoDB Configuration

```typescript
// src/config/mongodb.config.ts
import { MongoClientOptions } from 'mongodb';

export const mongoConfig: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  retryReads: true,
  compressors: ['zlib'],
};

export const mongoSettings = {
  uri: process.env.MONGODB_URI!,
  database: process.env.MONGODB_DATABASE!,
  options: mongoConfig,
};
```

### PostgreSQL Configuration

```typescript
// src/config/postgres.config.ts
import { PoolConfig } from 'pg';

export const postgresConfig: PoolConfig = {
  host: process.env.POSTGRES_HOST!,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE!,
  user: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
  ssl: process.env.POSTGRES_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

## Configuración de Logging

### Winston Configuration

```typescript
// src/config/logger.config.ts
import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

export const loggerConfig: winston.LoggerOptions = {
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'fbo-lambda',
    environment: nodeEnv
  },
  transports: [
    new winston.transports.Console({
      format: nodeEnv === 'development' 
        ? winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        : winston.format.json()
    })
  ]
};

// Agregar transports adicionales para producción
if (nodeEnv === 'production') {
  loggerConfig.transports?.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  );
}
```

## Configuración de Desarrollo

### package.json Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.build.json",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "clean": "rimraf dist coverage",
    "prepare": "husky install"
  }
}
```

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error'
  },
  env: {
    node: true,
    es2022: true
  }
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Husky Pre-commit Hooks

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run test
```

## Configuración de Producción

### Dockerfile

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/fbo-lambda
      - POSTGRES_HOST=postgres
    depends_on:
      - mongo
      - postgres
    networks:
      - app-network

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=fbo-lambda
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  mongo-data:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

### Serverless Configuration

```yaml
# serverless.yml
service: fbo-lambda-template

provider:
  name: aws
  runtime: nodejs18.x
  region: ${env:AWS_REGION, 'us-east-1'}
  stage: ${env:STAGE, 'dev'}
  environment:
    NODE_ENV: ${env:NODE_ENV}
    LOG_LEVEL: ${env:LOG_LEVEL}
    MONGODB_URI: ${env:MONGODB_URI}
    S3_BUCKET_NAME: ${env:S3_BUCKET_NAME}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - s3:GetObject
        - s3:PutObject
        - s3:DeleteObject
      Resource: "arn:aws:s3:::${env:S3_BUCKET_NAME}/*"

functions:
  api:
    handler: dist/index.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true

plugins:
  - serverless-offline
  - serverless-dotenv-plugin

custom:
  dotenv:
    path: .env.${self:provider.stage}
```

## Configuración de Monitoreo

### Sentry Configuration

```typescript
// src/config/sentry.config.ts
import * as Sentry from '@sentry/node';

export const initSentry = (): void => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: undefined }),
      ],
    });
  }
};
```

### Health Check Configuration

```typescript
// src/config/health.config.ts
export const healthCheckConfig = {
  timeout: 5000,
  checks: {
    mongodb: true,
    postgres: true,
    s3: true,
    external_apis: true,
  },
  endpoints: {
    health: '/health',
    ready: '/ready',
    live: '/live',
  },
};
```

## Mejores Prácticas

### 1. Seguridad de Configuración

- ✅ Nunca commitear archivos `.env`
- ✅ Usar variables de entorno para secretos
- ✅ Validar configuración al inicio
- ✅ Usar diferentes configuraciones por entorno

### 2. Gestión de Secretos

- ✅ AWS Secrets Manager para producción
- ✅ Variables de entorno para desarrollo
- ✅ Rotación automática de secretos
- ✅ Principio de menor privilegio

### 3. Configuración por Entorno

- ✅ Archivos `.env` específicos por entorno
- ✅ Configuración centralizada
- ✅ Validación de esquemas
- ✅ Valores por defecto sensatos

### 4. Monitoreo y Observabilidad

- ✅ Logging estructurado
- ✅ Métricas de aplicación
- ✅ Health checks
- ✅ Alertas automáticas

## Troubleshooting

### Problemas Comunes

#### 1. Path Aliases no funcionan

**Problema**: Los imports con `@/` no se resuelven

**Solución**:
```bash
# Verificar tsconfig.json
npm run type-check

# Para runtime, instalar tsconfig-paths
npm install tsconfig-paths
node -r tsconfig-paths/register dist/index.js
```

#### 2. Variables de entorno no se cargan

**Problema**: `process.env.VARIABLE` es undefined

**Solución**:
```typescript
// Cargar dotenv al inicio
import { config } from 'dotenv';
config();

// O usar dotenv-expand para interpolación
import { expand } from 'dotenv-expand';
expand(config());
```

#### 3. Tests no encuentran mocks

**Problema**: Mocks no se aplican correctamente

**Solución**:
```typescript
// Usar vi.hoisted para mocks
vi.mock('@/clients/http.client', () => vi.hoisted(() => ({
  HttpClient: vi.fn(),
})));
```

#### 4. Conexión a base de datos falla

**Problema**: Timeout o conexión rechazada

**Solución**:
```typescript
// Verificar configuración de red
// Aumentar timeouts
// Verificar credenciales
// Revisar logs de la base de datos
```