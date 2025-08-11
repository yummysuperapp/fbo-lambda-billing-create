# Guía de Deployment

## Visión General

Esta guía describe los diferentes métodos de deployment disponibles para el FBO Lambda Template, incluyendo configuraciones para desarrollo local, staging, y producción.

## Tabla de Contenidos

- [Preparación para Deployment](#preparación-para-deployment)
- [Deployment Local](#deployment-local)
- [Deployment con Docker](#deployment-con-docker)
- [Deployment en AWS Lambda](#deployment-en-aws-lambda)
- [Deployment en AWS ECS](#deployment-en-aws-ecs)
- [Deployment en Kubernetes](#deployment-en-kubernetes)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)
- [Rollback y Recovery](#rollback-y-recovery)

## Preparación para Deployment

### 1. Pre-requisitos

```bash
# Verificar versiones
node --version  # >= 18.0.0
npm --version   # >= 8.0.0
docker --version # >= 20.0.0

# Instalar dependencias globales
npm install -g typescript
npm install -g serverless
npm install -g aws-cli
```

### 2. Build del Proyecto

```bash
# Limpiar builds anteriores
npm run clean

# Verificar tipos
npm run type-check

# Ejecutar tests
npm run test:coverage

# Lint y format
npm run lint:fix
npm run format

# Build para producción
npm run build
```

### 3. Verificación Pre-deployment

```bash
# Verificar que el build funciona
node dist/index.js

# Verificar variables de entorno
npm run env:validate

# Verificar dependencias de seguridad
npm audit

# Verificar tamaño del bundle
npm run bundle:analyze
```

## Deployment Local

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.development
# Editar .env.development con valores locales

# Iniciar servicios de desarrollo
docker-compose -f docker-compose.dev.yml up -d

# Iniciar aplicación en modo desarrollo
npm run dev
```

### Testing Local

```bash
# Configurar entorno de testing
cp .env.example .env.test

# Ejecutar tests
npm run test

# Ejecutar tests con coverage
npm run test:coverage

# Ejecutar tests en modo watch
npm run test:watch
```

## Deployment con Docker

### 1. Build de Imagen Docker

```dockerfile
# Dockerfile.production
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY src/ ./src/

# Build de la aplicación
RUN npm run build

# Etapa de runtime
FROM node:18-alpine AS runtime

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copiar archivos necesarios
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Configurar usuario
USER nextjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Comando de inicio
CMD ["node", "dist/index.js"]
```

### 2. Build y Push

```bash
# Build de imagen
docker build -f Dockerfile.production -t fbo-lambda:latest .

# Tag para registry
docker tag fbo-lambda:latest your-registry/fbo-lambda:v1.0.0

# Push a registry
docker push your-registry/fbo-lambda:v1.0.0
```

### 3. Docker Compose para Producción

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: your-registry/fbo-lambda:v1.0.0
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    env_file:
      - .env.production
    depends_on:
      - mongodb
      - postgres
      - redis
    networks:
      - app-network
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  mongodb:
    image: mongo:6
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
      - ./mongo-init.js:/docker-entrypoint-initdb.d/mongo-init.js:ro
    networks:
      - app-network
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=fbo_lambda
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - app-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network
    restart: unless-stopped

volumes:
  mongodb_data:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

## Deployment en AWS Lambda

### 1. Configuración Serverless

```yaml
# serverless.yml
service: fbo-lambda-template

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs18.x
  region: ${env:AWS_REGION, 'us-east-1'}
  stage: ${env:STAGE, 'dev'}
  memorySize: 512
  timeout: 30
  
  environment:
    NODE_ENV: ${env:NODE_ENV}
    LOG_LEVEL: ${env:LOG_LEVEL}
    MONGODB_URI: ${env:MONGODB_URI}
    S3_BUCKET_NAME: ${env:S3_BUCKET_NAME}
    
  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - s3:GetObject
            - s3:PutObject
            - s3:DeleteObject
          Resource: "arn:aws:s3:::${env:S3_BUCKET_NAME}/*"
        - Effect: Allow
          Action:
            - logs:CreateLogGroup
            - logs:CreateLogStream
            - logs:PutLogEvents
          Resource: "*"

functions:
  api:
    handler: dist/lambda.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY
    vpc:
      securityGroupIds:
        - ${env:SECURITY_GROUP_ID}
      subnetIds:
        - ${env:SUBNET_ID_1}
        - ${env:SUBNET_ID_2}

  worker:
    handler: dist/worker.handler
    events:
      - sqs:
          arn: ${env:SQS_QUEUE_ARN}
          batchSize: 10

  scheduler:
    handler: dist/scheduler.handler
    events:
      - schedule: rate(5 minutes)

resources:
  Resources:
    S3Bucket:
      Type: AWS::S3::Bucket
      Properties:
        BucketName: ${env:S3_BUCKET_NAME}
        VersioningConfiguration:
          Status: Enabled
        PublicAccessBlockConfiguration:
          BlockPublicAcls: true
          BlockPublicPolicy: true
          IgnorePublicAcls: true
          RestrictPublicBuckets: true

plugins:
  - serverless-offline
  - serverless-dotenv-plugin
  - serverless-webpack
  - serverless-prune-plugin

custom:
  dotenv:
    path: .env.${self:provider.stage}
  
  webpack:
    webpackConfig: webpack.config.js
    includeModules: true
    packager: npm
    
  prune:
    automatic: true
    number: 3
```

### 2. Lambda Handler

```typescript
// src/lambda.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createApp } from './app';
import { createLogger } from './utils/logger.util';

const logger = createLogger('Lambda');
const app = createApp();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Lambda invocation started', {
      requestId: context.awsRequestId,
      path: event.path,
      method: event.httpMethod
    });

    // Procesar request
    const response = await app.handleRequest(event);

    logger.info('Lambda invocation completed', {
      requestId: context.awsRequestId,
      statusCode: response.statusCode
    });

    return response;

  } catch (error) {
    logger.error('Lambda invocation failed', {
      requestId: context.awsRequestId,
      error: error.message,
      stack: error.stack
    });

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        requestId: context.awsRequestId
      })
    };
  }
};
```

### 3. Deployment Commands

```bash
# Instalar Serverless CLI
npm install -g serverless

# Configurar AWS credentials
aws configure

# Deploy a desarrollo
npm run deploy:dev

# Deploy a staging
npm run deploy:staging

# Deploy a producción
npm run deploy:prod

# Ver logs
serverless logs -f api -t

# Remover deployment
serverless remove
```

## Deployment en AWS ECS

### 1. Task Definition

```json
{
  "family": "fbo-lambda-template",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "fbo-lambda-app",
      "image": "your-registry/fbo-lambda:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:mongodb-uri"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/fbo-lambda-template",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 2. Service Definition

```json
{
  "serviceName": "fbo-lambda-service",
  "cluster": "fbo-lambda-cluster",
  "taskDefinition": "fbo-lambda-template:1",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-12345", "subnet-67890"],
      "securityGroups": ["sg-12345"],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:region:account:targetgroup/fbo-lambda-tg",
      "containerName": "fbo-lambda-app",
      "containerPort": 3000
    }
  ],
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 50
  }
}
```

### 3. Deployment Script

```bash
#!/bin/bash
# deploy-ecs.sh

set -e

# Variables
CLUSTER_NAME="fbo-lambda-cluster"
SERVICE_NAME="fbo-lambda-service"
TASK_DEFINITION="fbo-lambda-template"
IMAGE_URI="your-registry/fbo-lambda:latest"

echo "Building and pushing Docker image..."
docker build -t $IMAGE_URI .
docker push $IMAGE_URI

echo "Updating task definition..."
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json

echo "Updating service..."
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --task-definition $TASK_DEFINITION

echo "Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME

echo "Deployment completed successfully!"
```

## Deployment en Kubernetes

### 1. Deployment Manifest

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fbo-lambda-app
  labels:
    app: fbo-lambda
spec:
  replicas: 3
  selector:
    matchLabels:
      app: fbo-lambda
  template:
    metadata:
      labels:
        app: fbo-lambda
    spec:
      containers:
      - name: fbo-lambda
        image: your-registry/fbo-lambda:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: LOG_LEVEL
          value: "info"
        envFrom:
        - secretRef:
            name: fbo-lambda-secrets
        - configMapRef:
            name: fbo-lambda-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: fbo-lambda-service
spec:
  selector:
    app: fbo-lambda
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fbo-lambda-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.fbo-lambda.com
    secretName: fbo-lambda-tls
  rules:
  - host: api.fbo-lambda.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fbo-lambda-service
            port:
              number: 80
```

### 2. ConfigMap y Secrets

```yaml
# k8s/configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fbo-lambda-config
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  HTTP_TIMEOUT: "30000"
  HTTP_RETRIES: "3"
---
apiVersion: v1
kind: Secret
metadata:
  name: fbo-lambda-secrets
type: Opaque
stringData:
  MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/fbo-lambda"
  POSTGRES_HOST: "postgres.example.com"
  POSTGRES_PASSWORD: "secure-password"
  AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE"
  AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
```

### 3. Deployment Commands

```bash
# Aplicar configuración
kubectl apply -f k8s/

# Verificar deployment
kubectl get deployments
kubectl get pods
kubectl get services

# Ver logs
kubectl logs -f deployment/fbo-lambda-app

# Escalar aplicación
kubectl scale deployment fbo-lambda-app --replicas=5

# Rolling update
kubectl set image deployment/fbo-lambda-app fbo-lambda=your-registry/fbo-lambda:v2.0.0

# Rollback
kubectl rollout undo deployment/fbo-lambda-app
```

## CI/CD Pipeline

### 1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run type check
      run: npm run type-check
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.image.outputs.image }}
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        file: Dockerfile.production
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Output image
      id: image
      run: echo "image=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}" >> $GITHUB_OUTPUT

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying ${{ needs.build.outputs.image }} to staging"
        # Aquí iría el comando de deployment específico

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying ${{ needs.build.outputs.image }} to production"
        # Aquí iría el comando de deployment específico
```

### 2. GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

test:
  stage: test
  image: node:18
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run lint
    - npm run type-check
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -f Dockerfile.production -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  only:
    - main
    - develop

deploy-staging:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - echo "Deploying to staging"
    - curl -X POST "$STAGING_WEBHOOK_URL" -H "Authorization: Bearer $STAGING_TOKEN"
  environment:
    name: staging
    url: https://staging.fbo-lambda.com
  only:
    - develop

deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - echo "Deploying to production"
    - curl -X POST "$PRODUCTION_WEBHOOK_URL" -H "Authorization: Bearer $PRODUCTION_TOKEN"
  environment:
    name: production
    url: https://api.fbo-lambda.com
  when: manual
  only:
    - main
```

## Monitoreo y Observabilidad

### 1. Health Checks

```typescript
// src/health-check.ts
import { createMongoClient } from './clients/mongo.client';
import { createPostgresClient } from './clients/postgres.client';
import { createS3Client } from './clients/s3.client';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    [key: string]: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
}

export async function healthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {};

  // Check MongoDB
  try {
    const mongoStart = Date.now();
    const mongoClient = await createMongoClient();
    await mongoClient.db().admin().ping();
    checks.mongodb = {
      status: 'up',
      responseTime: Date.now() - mongoStart
    };
  } catch (error) {
    checks.mongodb = {
      status: 'down',
      error: error.message
    };
  }

  // Check PostgreSQL
  try {
    const pgStart = Date.now();
    const pgClient = await createPostgresClient();
    await pgClient.query('SELECT 1');
    checks.postgres = {
      status: 'up',
      responseTime: Date.now() - pgStart
    };
  } catch (error) {
    checks.postgres = {
      status: 'down',
      error: error.message
    };
  }

  // Check S3
  try {
    const s3Start = Date.now();
    const s3Client = createS3Client();
    await s3Client.listBuckets();
    checks.s3 = {
      status: 'up',
      responseTime: Date.now() - s3Start
    };
  } catch (error) {
    checks.s3 = {
      status: 'down',
      error: error.message
    };
  }

  const allHealthy = Object.values(checks).every(check => check.status === 'up');

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks
  };
}
```

### 2. Métricas con Prometheus

```typescript
// src/metrics.ts
import promClient from 'prom-client';

// Crear registry
const register = new promClient.Registry();

// Métricas por defecto
promClient.collectDefaultMetrics({ register });

// Métricas personalizadas
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const databaseConnectionPool = new promClient.Gauge({
  name: 'database_connection_pool_size',
  help: 'Current database connection pool size',
  labelNames: ['database_type']
});

// Registrar métricas
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(databaseConnectionPool);

export { register };
```

## Rollback y Recovery

### 1. Estrategias de Rollback

#### Blue-Green Deployment

```bash
#!/bin/bash
# blue-green-deploy.sh

CURRENT_ENV=$(kubectl get service fbo-lambda-service -o jsonpath='{.spec.selector.version}')
NEW_ENV=$([ "$CURRENT_ENV" = "blue" ] && echo "green" || echo "blue")

echo "Current environment: $CURRENT_ENV"
echo "Deploying to: $NEW_ENV"

# Deploy nueva versión
kubectl set image deployment/fbo-lambda-$NEW_ENV fbo-lambda=your-registry/fbo-lambda:$NEW_VERSION

# Esperar que esté listo
kubectl rollout status deployment/fbo-lambda-$NEW_ENV

# Verificar health check
if curl -f http://fbo-lambda-$NEW_ENV:3000/health; then
  echo "Health check passed, switching traffic"
  kubectl patch service fbo-lambda-service -p '{"spec":{"selector":{"version":"'$NEW_ENV'"}}}'
  echo "Traffic switched to $NEW_ENV"
else
  echo "Health check failed, rolling back"
  exit 1
fi
```

#### Canary Deployment

```yaml
# k8s/canary.yml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: fbo-lambda-rollout
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10
      - pause: {duration: 2m}
      - setWeight: 20
      - pause: {duration: 2m}
      - setWeight: 50
      - pause: {duration: 2m}
      - setWeight: 100
      canaryService: fbo-lambda-canary
      stableService: fbo-lambda-stable
      trafficRouting:
        nginx:
          stableIngress: fbo-lambda-stable
          annotationPrefix: nginx.ingress.kubernetes.io
  selector:
    matchLabels:
      app: fbo-lambda
  template:
    metadata:
      labels:
        app: fbo-lambda
    spec:
      containers:
      - name: fbo-lambda
        image: your-registry/fbo-lambda:latest
```

### 2. Backup y Recovery

#### Database Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)

# MongoDB backup
mongodump --uri="$MONGODB_URI" --out="/backups/mongodb_$DATE"

# PostgreSQL backup
pg_dump "$POSTGRES_URI" > "/backups/postgres_$DATE.sql"

# Upload to S3
aws s3 sync /backups/ s3://fbo-lambda-backups/

# Cleanup old backups (keep last 7 days)
find /backups -type f -mtime +7 -delete
```

#### Disaster Recovery Plan

```markdown
## Disaster Recovery Checklist

### 1. Identificar el Problema
- [ ] Verificar métricas y alertas
- [ ] Revisar logs de aplicación
- [ ] Verificar infraestructura

### 2. Comunicación
- [ ] Notificar al equipo
- [ ] Actualizar status page
- [ ] Comunicar a stakeholders

### 3. Rollback Inmediato
- [ ] Ejecutar rollback automático
- [ ] Verificar que el rollback funcionó
- [ ] Confirmar que el servicio está operativo

### 4. Investigación
- [ ] Analizar causa raíz
- [ ] Documentar incidente
- [ ] Crear plan de prevención

### 5. Post-mortem
- [ ] Reunión de post-mortem
- [ ] Actualizar runbooks
- [ ] Implementar mejoras
```

## Mejores Prácticas

### 1. Seguridad en Deployment

- ✅ Usar imágenes base oficiales y actualizadas
- ✅ Escanear vulnerabilidades en imágenes
- ✅ Usar usuarios no-root en containers
- ✅ Implementar network policies
- ✅ Rotar secretos regularmente

### 2. Performance y Escalabilidad

- ✅ Configurar resource limits apropiados
- ✅ Implementar horizontal pod autoscaling
- ✅ Usar connection pooling para bases de datos
- ✅ Implementar caching estratégico
- ✅ Optimizar tamaño de imágenes Docker

### 3. Observabilidad

- ✅ Implementar logging estructurado
- ✅ Configurar métricas de negocio
- ✅ Establecer alertas proactivas
- ✅ Implementar distributed tracing
- ✅ Crear dashboards informativos

### 4. Reliability

- ✅ Implementar circuit breakers
- ✅ Configurar retry policies
- ✅ Usar health checks robustos
- ✅ Implementar graceful shutdown
- ✅ Planificar capacity planning

## Troubleshooting

### Problemas Comunes

#### 1. Container no inicia

```bash
# Verificar logs
docker logs container-id

# Verificar recursos
docker stats

# Verificar configuración
docker inspect container-id
```

#### 2. Health checks fallan

```bash
# Verificar endpoint manualmente
curl -f http://localhost:3000/health

# Verificar logs de aplicación
kubectl logs deployment/fbo-lambda-app

# Verificar configuración de health check
kubectl describe deployment fbo-lambda-app
```

#### 3. Performance issues

```bash
# Verificar métricas de CPU/Memory
kubectl top pods

# Verificar logs de aplicación
kubectl logs -f deployment/fbo-lambda-app

# Verificar métricas de base de datos
# Revisar slow query logs
```

#### 4. Deployment stuck

```bash
# Verificar status del rollout
kubectl rollout status deployment/fbo-lambda-app

# Verificar eventos
kubectl get events --sort-by=.metadata.creationTimestamp

# Rollback si es necesario
kubectl rollout undo deployment/fbo-lambda-app
```