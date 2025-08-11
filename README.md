# FBO Lambda Template

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1+-yellow.svg)](https://vitest.dev/)
[![ESLint](https://img.shields.io/badge/ESLint-9.17+-purple.svg)](https://eslint.org/)
[![Coverage](https://img.shields.io/badge/Coverage-99.9%25-brightgreen.svg)](https://vitest.dev/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue.svg)](https://github.com/features/actions)

Un template robusto y escalable para aplicaciones Lambda con TypeScript, diseñado para proyectos empresariales que requieren alta calidad, mantenibilidad y cobertura de testing completa.

## 🚀 Características Principales

- **TypeScript 5.7+**: Tipado estático completo con configuración estricta y tipos globales
- **Node.js 20.x**: Runtime moderno con soporte para las últimas características
- **Arquitectura Modular**: Separación clara de responsabilidades (Clients, Services, Utils)
- **Testing Integral**: Suite completa de tests con Vitest 2.1+ y cobertura del 99.9%
- **ESLint 9.17+**: Configuración moderna con flat config y reglas estrictas
- **Mocks Centralizados**: Sistema de mocks reutilizables y fixtures organizadas
- **Clientes de Base de Datos**: Soporte para MongoDB y PostgreSQL con pooling
- **Cliente HTTP**: Cliente robusto con reintentos, interceptores y manejo de errores
- **Cliente S3**: Operaciones completas de AWS S3 con presigned URLs
- **Logging Avanzado**: Sistema de logging estructurado y configurable
- **Manejo de Errores**: Excepciones personalizadas y manejo centralizado
- **Configuración Flexible**: Variables de entorno y configuración por ambiente
- **CI/CD Integrado**: Pipeline completo con GitHub Actions y Codecov
- **Documentación Completa**: Guías detalladas de arquitectura, API, configuración y deployment

## 📁 Estructura del Proyecto

```
fbo-lambda-template/
├── .github/                      # Configuración de GitHub
│   └── workflows/
│       └── ci-cd.yml             # Pipeline de CI/CD con GitHub Actions
├── src/                          # Código fuente
│   ├── @types/                   # Definiciones de tipos TypeScript
│   │   ├── clients.d.ts          # Tipos para clientes
│   │   ├── config.d.ts           # Tipos de configuración
│   │   ├── context.d.ts          # Tipos de contexto Lambda
│   │   ├── events.d.ts           # Tipos de eventos
│   │   ├── global.d.ts           # Declaraciones globales
│   │   ├── index.d.ts            # Tipos principales
│   │   └── responses.d.ts        # Tipos de respuestas
│   ├── clients/                  # Clientes para servicios externos
│   │   ├── http.client.ts        # Cliente HTTP con Axios
│   │   ├── mongo.client.ts       # Cliente MongoDB
│   │   ├── postgres.client.ts    # Cliente PostgreSQL
│   │   ├── s3.client.ts          # Cliente AWS S3
│   │   └── index.ts              # Exportaciones de clientes
│   ├── config/                   # Configuración de la aplicación
│   │   ├── app.config.ts         # Configuración principal
│   │   ├── environment.config.ts # Variables de entorno
│   │   └── index.ts              # Exportaciones de configuración
│   ├── handlers/                 # Manejadores de eventos
│   │   └── index.ts              # Manejadores principales
│   ├── interfaces/               # Interfaces y excepciones
│   │   ├── base.ts               # Interfaces base
│   │   ├── exceptions.ts         # Excepciones personalizadas
│   │   ├── validation.ts         # Validaciones
│   │   └── index.ts              # Exportaciones de interfaces
│   ├── services/                 # Lógica de negocio
│   │   ├── finance.service.ts    # Servicios financieros
│   │   └── index.ts              # Exportaciones de servicios
│   ├── utils/                    # Utilidades y helpers
│   │   ├── helpers.util.ts       # Funciones auxiliares
│   │   ├── logger.util.ts        # Sistema de logging
│   │   └── index.ts              # Exportaciones de utilidades
│   └── index.ts                  # Punto de entrada principal
├── tests/                        # Suite de pruebas
│   ├── __fixtures__/             # Datos de prueba
│   │   └── index.ts              # Fixtures centralizadas
│   ├── __mocks__/                # Mocks centralizados
│   │   ├── aws.mock.ts           # Mocks de AWS
│   │   ├── axios.mock.ts         # Mocks de Axios
│   │   └── database.mock.ts      # Mocks de base de datos
│   ├── clients/                  # Tests de clientes
│   ├── interfaces/               # Tests de interfaces
│   ├── services/                 # Tests de servicios
│   ├── utils/                    # Tests de utilidades
│   ├── index.test.ts             # Tests principales
│   └── setup.ts                  # Configuración de tests
├── docs/                         # Documentación
│   ├── API.md                    # Documentación de API
│   ├── ARCHITECTURE.md           # Arquitectura del sistema
│   ├── CONFIGURATION.md          # Guía de configuración
│   ├── DEPLOYMENT.md             # Guía de deployment
│   ├── IMPROVEMENTS.md           # Mejoras y roadmap
│   └── TESTING.md                # Guía de testing
├── scripts/                      # Scripts de utilidad
│   └── deploy.mjs                # Script de deployment
├── eslint.config.js              # Configuración de ESLint v9
├── vitest.config.ts              # Configuración de Vitest
├── tsconfig.json                 # Configuración de TypeScript
├── package.json                  # Dependencias y scripts
└── .env.example                  # Variables de entorno de ejemplo
```

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Construir el proyecto
npm run build

# Ejecutar en modo desarrollo
npm run dev
```

## 📋 Scripts Disponibles

```bash
# Construcción y desarrollo
npm run build          # Construir para producción
npm run build:watch    # Construir en modo watch
npm run start          # Ejecutar versión construida
npm run start:dev      # Modo desarrollo con tsx
npm run start:local    # Ejecutar en modo local
npm run clean          # Limpiar directorio dist

# Calidad de código
npm run lint           # Ejecutar ESLint v9
npm run lint:fix       # Corregir problemas de linting automáticamente
npm run type-check     # Verificar tipos TypeScript

# Testing con Vitest
npm run test           # Ejecutar tests
npm run test:cov       # Ejecutar tests con cobertura
npm run test:watch     # Ejecutar tests en modo watch

# Deployment
npm run package        # Crear paquete para deployment
npm run deploy         # Ejecutar script de deployment
npm run deploy:dev     # Deploy a desarrollo
npm run deploy:prod    # Deploy a producción
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION

# Lambda Functions
LAMBDA_FUNCTION_NAME_DEV
LAMBDA_FUNCTION_NAME_PROD

# Environment Variables
FINANCE_API_BASE_URL_DEV/PROD
FINANCE_API_KEY_DEV/PROD
SFTP_HOST_DEV/PROD
SFTP_USERNAME_DEV/PROD
SFTP_PASSWORD_DEV/PROD
S3_BUCKET_NAME_DEV/PROD
```

## 🔄 Flujos de Trabajo

### 1. Subida a SFTP Bancario (S3 → SFTP)

Triggered por eventos S3:
1. Detecta nuevos archivos en S3 con el prefijo configurado
2. Valida el formato y tamaño del archivo
3. Transfiere el archivo al SFTP bancario
4. Notifica al sistema de finanzas
5. Envía notificaciones de estado

### 2. Descarga desde SFTP Bancario (SFTP → S3)

Triggered por eventos personalizados:
1. Lista archivos disponibles en SFTP bancario
2. Descarga archivos nuevos o específicos
3. Sube archivos a S3 con el prefijo de respuesta
4. Notifica al sistema de finanzas
5. Envía notificaciones de estado

## 🧪 Testing

El proyecto utiliza **Vitest 2.1+** como framework de testing con una cobertura del **99.9%**.

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm run test

# Tests con cobertura (genera reportes HTML y LCOV)
npm run test:cov

# Tests en modo watch para desarrollo
npm run test:watch
```

### Características del Testing

- ✅ **276 tests** ejecutándose exitosamente
- ✅ **99.9% de cobertura** de código
- ✅ **Mocks centralizados** para AWS, Axios y bases de datos
- ✅ **Fixtures organizadas** para datos de prueba
- ✅ **Tests unitarios** para todos los clientes, servicios y utilidades
- ✅ **Configuración de CI/CD** con reporte automático a Codecov
- ✅ **Reportes HTML** detallados de cobertura

### Estructura de Tests

```
tests/
├── __fixtures__/     # Datos de prueba reutilizables
├── __mocks__/        # Mocks para servicios externos
├── clients/          # Tests de clientes (HTTP, S3, DB)
├── interfaces/       # Tests de interfaces y validaciones
├── services/         # Tests de lógica de negocio
├── utils/            # Tests de utilidades y helpers
└── setup.ts          # Configuración global de tests
```

## 📦 Deployment

### CI/CD Pipeline

El proyecto incluye un pipeline completo de CI/CD con **GitHub Actions**:

- ✅ **Tests automáticos** con Vitest
- ✅ **Linting** con ESLint v9
- ✅ **Type checking** con TypeScript
- ✅ **Comentarios de cobertura** automáticos en PRs
- ✅ **Build automático** para deployment
- ✅ **Deploy automático** a desarrollo y producción
- ✅ **Artifacts de cobertura** con retención de 30 días

### Preparación del Paquete

```bash
# Crear paquete optimizado para Lambda
npm run package

# Deploy manual a desarrollo
npm run deploy:dev

# Deploy manual a producción
npm run deploy:prod
```

### Configuración de Lambda

- **Runtime**: Node.js 20.x
- **Handler**: `dist/index.handler`
- **Memory**: 512 MB (recomendado)
- **Timeout**: 5 minutos
- **Environment Variables**: Configurar según `.env.example`

### Secrets Requeridos para CI/CD

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION

# Lambda Functions
LAMBDA_FUNCTION_NAME_DEV
LAMBDA_FUNCTION_NAME_PROD

# Environment Variables
FINANCE_API_BASE_URL_DEV/PROD
FINANCE_API_KEY_DEV/PROD
SFTP_HOST_DEV/PROD
SFTP_USERNAME_DEV/PROD
SFTP_PASSWORD_DEV/PROD
S3_BUCKET_NAME_DEV/PROD
```

## 📚 Documentación Adicional

- **[Arquitectura](docs/ARCHITECTURE.md)**: Patrones de diseño, principios y estructura del sistema
- **[API Reference](docs/API.md)**: Documentación completa de todas las APIs y interfaces
- **[Configuración](docs/CONFIGURATION.md)**: Guía detallada de configuración y variables de entorno
- **[Testing](docs/TESTING.md)**: Estrategias de testing, mocks y mejores prácticas
- **[Deployment](docs/DEPLOYMENT.md)**: Guías de deployment para diferentes entornos
- **[Mejoras](docs/IMPROVEMENTS.md)**: Roadmap y mejoras planificadas

## 🔧 Mejoras Técnicas Recientes

### Migración a Herramientas Modernas

- ✅ **ESLint v9**: Migración completa a flat config con reglas estrictas
- ✅ **Vitest 2.1+**: Reemplazo de Jest por Vitest para mejor rendimiento
- ✅ **TypeScript 5.7+**: Actualización a la versión más reciente
- ✅ **Node.js 20.x**: Runtime moderno con mejor rendimiento

### Calidad de Código

- ✅ **99.9% de cobertura**: Incremento significativo en la cobertura de tests
- ✅ **276 tests**: Suite completa de pruebas unitarias
- ✅ **Tipos estrictos**: Eliminación completa de tipos `any`
- ✅ **Linting automático**: Corrección automática de problemas de código

### CI/CD Mejorado

- ✅ **GitHub Actions**: Pipeline completo de CI/CD
- ✅ **Comentarios automáticos**: Reportes de cobertura en PRs
- ✅ **Deploy automático**: Deployment a múltiples ambientes
- ✅ **Quality Gates**: Validación automática de calidad

## 🔒 Seguridad

- ✅ **Validación estricta** de entrada con Zod
- ✅ **Sanitización** de nombres de archivo
- ✅ **Manejo seguro** de credenciales
- ✅ **Logging estructurado** sin exposición de datos sensibles
- ✅ **Timeouts y límites** de reintentos configurables
- ✅ **Validación de tipos** en tiempo de ejecución
- ✅ **Tipado estricto** sin uso de `any`
- ✅ **Secrets management** en CI/CD

## 📄 Licencia

Este proyecto es privado y confidencial.