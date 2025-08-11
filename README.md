# FBO Lambda Template

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-1.0+-yellow.svg)](https://vitest.dev/)
[![Coverage](https://img.shields.io/badge/Coverage-95%25+-brightgreen.svg)](https://vitest.dev/)

Un template robusto y escalable para aplicaciones Lambda con TypeScript, diseñado para proyectos empresariales que requieren alta calidad, mantenibilidad y cobertura de testing completa.

## 🚀 Características Principales

- **TypeScript**: Tipado estático completo con configuración estricta y tipos globales
- **Arquitectura Modular**: Separación clara de responsabilidades (Clients, Services, Utils)
- **Testing Integral**: Suite completa de tests con Vitest y cobertura del 95%+
- **Mocks Centralizados**: Sistema de mocks reutilizables y fixtures organizadas
- **Clientes de Base de Datos**: Soporte para MongoDB y PostgreSQL con pooling
- **Cliente HTTP**: Cliente robusto con reintentos, interceptores y manejo de errores
- **Cliente S3**: Operaciones completas de AWS S3 con presigned URLs
- **Logging Avanzado**: Sistema de logging estructurado con Winston
- **Manejo de Errores**: Excepciones personalizadas y manejo centralizado
- **Configuración Flexible**: Variables de entorno y configuración por ambiente
- **Documentación Completa**: Guías detalladas de arquitectura, API, configuración y deployment

## 📁 Estructura del Proyecto

```
fbo-lambda-template/
├── src/                          # Código fuente
│   ├── @types/                   # Definiciones de tipos TypeScript
│   ├── clients/                  # Clientes para servicios externos
│   │   ├── http.client.ts        # Cliente HTTP con Axios
│   │   ├── mongo.client.ts       # Cliente MongoDB
│   │   ├── postgres.client.ts    # Cliente PostgreSQL
│   │   └── s3.client.ts          # Cliente AWS S3
│   ├── interfaces/               # Interfaces y excepciones
│   │   └── exceptions/           # Excepciones personalizadas
│   ├── services/                 # Lógica de negocio
│   │   └── finance.service.ts    # Servicios financieros
│   ├── types/                    # Tipos globales
│   │   └── global.d.ts           # Declaraciones globales
│   ├── utils/                    # Utilidades y helpers
│   │   ├── helpers.ts            # Funciones auxiliares
│   │   └── logger.util.ts        # Sistema de logging
│   └── index.ts                  # Punto de entrada principal
├── tests/                        # Suite de pruebas
│   ├── __fixtures__/             # Datos de prueba
│   ├── __mocks__/                # Mocks centralizados
│   ├── clients/                  # Tests de clientes
│   ├── interfaces/               # Tests de interfaces
│   ├── services/                 # Tests de servicios
│   ├── utils/                    # Tests de utilidades
│   └── setup.ts                  # Configuración de tests
├── docs/                         # Documentación
│   ├── IMPROVEMENTS.md           # Mejoras y roadmap
│   ├── API.md                    # Documentación de API
│   ├── ARCHITECTURE.md           # Arquitectura del sistema
│   └── TESTING.md                # Guía de testing
└── package.json                  # Dependencias y scripts
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
npm run build        # Construir para producción
npm run dev          # Modo desarrollo con watch
npm run start        # Ejecutar versión construida
npm run clean        # Limpiar directorio dist
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Corregir problemas de linting automáticamente
npm run type-check   # Verificar tipos TypeScript
npm run test         # Ejecutar tests
npm run test:watch   # Ejecutar tests en modo watch
npm run test:coverage # Ejecutar tests con cobertura
npm run package      # Crear paquete para deployment
```

## ⚙️ Configuración

### Variables de Entorno Requeridas

```env
# Entorno
NODE_ENV=development

# API de Finanzas
FINANCE_API_BASE_URL=https://api.finance.example.com
FINANCE_API_KEY=your-api-key
FINANCE_DISPERSION_ENDPOINT=/api/v1/dispersion

# Configuración SFTP
SFTP_HOST=sftp.bank.example.com
SFTP_PORT=22
SFTP_USERNAME=your-username
SFTP_PASSWORD=your-password
SFTP_UPLOAD_PATH=/upload
SFTP_DOWNLOAD_PATH=/download

# AWS
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
FILE_REQUEST_PREFIX=requests
FILE_RESPONSE_PREFIX=responses

# Aplicación
APP_NAME=fbo-lambda-template
APP_VERSION=1.0.0
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

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📦 Deployment

### Preparación del Paquete

```bash
# Crear paquete optimizado
npm run package
```

### Configuración de Lambda

- **Runtime**: Node.js 22.x
- **Handler**: `dist/index.handler`
- **Memory**: 512 MB (recomendado)
- **Timeout**: 5 minutos
- **Environment Variables**: Configurar según `.env.example`

## 📚 Documentación Adicional

- **[Arquitectura](docs/ARCHITECTURE.md)**: Patrones de diseño, principios y estructura del sistema
- **[API Reference](docs/API.md)**: Documentación completa de todas las APIs y interfaces
- **[Configuración](docs/CONFIGURATION.md)**: Guía detallada de configuración y variables de entorno
- **[Testing](docs/TESTING.md)**: Estrategias de testing, mocks y mejores prácticas
- **[Deployment](docs/DEPLOYMENT.md)**: Guías de deployment para diferentes entornos
- **[Mejoras](docs/IMPROVEMENTS.md)**: Roadmap y mejoras planificadas

## 🔒 Seguridad

- ✅ Validación estricta de entrada con Zod
- ✅ Sanitización de nombres de archivo
- ✅ Manejo seguro de credenciales
- ✅ Logging sin exposición de datos sensibles
- ✅ Timeouts y límites de reintentos
- ✅ Validación de tipos en tiempo de ejecución

## 📄 Licencia

Este proyecto es privado y confidencial.