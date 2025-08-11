# Guía de Testing

## Visión General

El FBO Lambda Template implementa una estrategia de testing completa que incluye unit tests, integration tests y mocks centralizados. El objetivo es mantener una cobertura de código superior al 95% y garantizar la calidad del software.

## Herramientas de Testing

### Vitest
- **Framework principal**: Vitest como runner de tests
- **Características**:
  - Ejecución rápida con hot reload
  - Soporte nativo para TypeScript
  - Mocking avanzado
  - Coverage integrado

### Configuración
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    }
  }
});
```

## Estructura de Tests

### Organización por Capas
```
tests/
├── clients/              # Tests de clientes
│   ├── http.client.test.ts
│   ├── mongo.client.test.ts
│   ├── postgres.client.test.ts
│   └── s3.client.test.ts
├── services/             # Tests de servicios
│   └── finance.service.test.ts
├── utils/                # Tests de utilidades
│   ├── helpers.test.ts
│   └── logger.util.test.ts
├── interfaces/           # Tests de interfaces
│   └── exceptions.test.ts
├── __mocks__/            # Mocks centralizados
│   ├── axios.mock.ts
│   ├── aws.mock.ts
│   └── database.mock.ts
├── __fixtures__/         # Datos de prueba
│   └── index.ts
└── setup.ts              # Configuración global
```

## Mocks Centralizados

### Axios Mock
```typescript
// tests/__mocks__/axios.mock.ts
export const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() }
  }
};

export const axiosMock = {
  default: {
    create: vi.fn(() => mockAxiosInstance)
  }
};
```

### AWS Mock
```typescript
// tests/__mocks__/aws.mock.ts
export const mockS3Instance = {
  send: vi.fn(),
  config: { region: 'us-east-1' }
};

export const mockS3Client = vi.fn(() => mockS3Instance);
```

### Database Mock
```typescript
// tests/__mocks__/database.mock.ts
export const mockMongoClient = {
  connect: vi.fn(),
  close: vi.fn(),
  db: vi.fn(() => mockMongoDb)
};

export const mockPgPool = {
  query: vi.fn(),
  connect: vi.fn(),
  end: vi.fn()
};
```

## Fixtures de Datos

### Estructura de Fixtures
```typescript
// tests/__fixtures__/index.ts
export const userFixtures = {
  validUser: {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User'
  },
  invalidUser: {
    id: '',
    email: 'invalid-email'
  }
};

export const financeFixtures = {
  validTransaction: {
    id: 'txn-123',
    amount: 100.50,
    currency: 'USD'
  }
};
```

## Tipos de Tests

### 1. Unit Tests

#### Características
- Tests aislados de una sola unidad de código
- Mocks para todas las dependencias externas
- Ejecución rápida
- Alta cobertura

#### Ejemplo: HTTP Client Test
```typescript
describe('HttpClient', () => {
  let httpClient: HttpClient;

  beforeEach(() => {
    resetAxiosMocks();
    httpClient = new HttpClient({ timeout: 5000 });
  });

  it('should make GET request successfully', async () => {
    const responseData = httpFixtures.successResponse;
    axiosMock.default.create().get.mockResolvedValue(
      mockSuccessResponse(responseData.data)
    );

    const result = await httpClient.get('/test');

    expect(result).toEqual(responseData.data);
    expect(axiosMock.default.create().get).toHaveBeenCalledWith('/test', undefined);
  });
});
```

### 2. Integration Tests

#### Características
- Tests de integración entre componentes
- Uso de servicios reales cuando es posible
- Validación de flujos completos

#### Ejemplo: Service Integration Test
```typescript
describe('FinanceService Integration', () => {
  let service: FinanceService;
  let httpClient: HttpClient;

  beforeEach(() => {
    httpClient = createHttpClient();
    service = new FinanceService(httpClient);
  });

  it('should fetch and convert currency rates', async () => {
    // Mock external API response
    mockExternalAPI();

    const result = await service.convertCurrency(100, 'USD', 'EUR');

    expect(result).toBeCloseTo(85, 2);
  });
});
```

### 3. Error Handling Tests

#### Características
- Validación de manejo de errores
- Tests de casos edge
- Verificación de logging de errores

#### Ejemplo: Error Handling Test
```typescript
describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    const error = mockErrorResponse('Network Error', 500);
    axiosMock.default.create().get.mockRejectedValue(error);

    await expect(httpClient.get('/test')).rejects.toThrow('Network Error');
  });

  it('should log errors with context', async () => {
    const loggerSpy = vi.spyOn(logger, 'error');
    
    try {
      await riskyOperation();
    } catch (error) {
      expect(loggerSpy).toHaveBeenCalledWith(
        'Operation failed',
        expect.objectContaining({ error })
      );
    }
  });
});
```

## Estrategias de Mocking

### 1. Mock por Módulo
```typescript
// Mock completo del módulo
vi.mock('axios', () => axiosMock);
```

### 2. Mock Parcial
```typescript
// Mock parcial manteniendo funcionalidad original
vi.mock('@/utils', async () => {
  const actual = await vi.importActual('@/utils');
  return {
    ...actual,
    createLogger: vi.fn(() => mockLogger)
  };
});
```

### 3. Mock Condicional
```typescript
// Mock basado en condiciones
vi.mock('fs', () => {
  if (process.env.NODE_ENV === 'test') {
    return mockFileSystem;
  }
  return vi.importActual('fs');
});
```

## Configuración de Tests

### Setup Global
```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';

beforeAll(async () => {
  // Configuración global antes de todos los tests
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Limpieza global después de todos los tests
});

beforeEach(() => {
  // Reset de mocks antes de cada test
  vi.clearAllMocks();
});
```

### Variables de Entorno para Tests
```typescript
// tests/setup.ts
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.LOG_LEVEL = 'error';
process.env.AWS_REGION = 'us-east-1';
```

## Cobertura de Código

### Configuración de Coverage
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: [
    'node_modules/**',
    'tests/**',
    'dist/**',
    '**/*.d.ts'
  ],
  thresholds: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
}
```

### Reportes de Coverage
```bash
# Generar reporte de cobertura
npm run test:cov

# Ver reporte HTML
open coverage/index.html

# Reporte en consola
npm test -- --coverage
```

### Métricas de Coverage por Módulo
- **HTTP Client**: 98%+
- **Database Clients**: 95%+
- **Services**: 100%
- **Utils**: 98%+
- **Interfaces**: 100%

## Mejores Prácticas

### 1. Naming Conventions
```typescript
// Descriptive test names
describe('HttpClient', () => {
  describe('GET requests', () => {
    it('should return data when request is successful', () => {});
    it('should throw error when request fails', () => {});
    it('should retry on network timeout', () => {});
  });
});
```

### 2. Test Structure (AAA Pattern)
```typescript
it('should process transaction successfully', async () => {
  // Arrange
  const transaction = financeFixtures.validTransaction;
  const expectedResult = { success: true, id: 'txn-123' };
  mockDatabaseResponse(expectedResult);

  // Act
  const result = await service.processTransaction(transaction);

  // Assert
  expect(result).toEqual(expectedResult);
  expect(mockDatabase.insert).toHaveBeenCalledWith(transaction);
});
```

### 3. Test Data Management
```typescript
// Use fixtures for consistent test data
const testUser = userFixtures.validUser;
const testTransaction = financeFixtures.validTransaction;

// Create test-specific data when needed
const customUser = {
  ...userFixtures.validUser,
  email: 'custom@test.com'
};
```

### 4. Async Testing
```typescript
// Proper async/await usage
it('should handle async operations', async () => {
  const promise = service.asyncOperation();
  await expect(promise).resolves.toBe(expectedValue);
});

// Testing rejections
it('should handle async errors', async () => {
  const promise = service.failingOperation();
  await expect(promise).rejects.toThrow('Expected error');
});
```

## Debugging Tests

### 1. Debug Mode
```bash
# Run tests in debug mode
npm test -- --inspect-brk

# Run specific test file
npm test -- tests/clients/http.client.test.ts
```

### 2. Console Debugging
```typescript
it('should debug test execution', () => {
  console.log('Debug info:', testData);
  // Test logic
});
```

### 3. Snapshot Testing
```typescript
it('should match snapshot', () => {
  const result = generateComplexObject();
  expect(result).toMatchSnapshot();
});
```

## Performance Testing

### 1. Timing Tests
```typescript
it('should complete within time limit', async () => {
  const start = Date.now();
  await service.performOperation();
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(1000); // 1 second
});
```

### 2. Memory Usage
```typescript
it('should not leak memory', () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Perform operations
  for (let i = 0; i < 1000; i++) {
    service.operation();
  }
  
  global.gc(); // Force garbage collection
  const finalMemory = process.memoryUsage().heapUsed;
  
  expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024); // 1MB
});
```

## CI/CD Integration

### 1. GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:cov
```

### 2. Coverage Gates
```bash
# Fail build if coverage below threshold
npm run test:cov -- --coverage.thresholds.global.lines=95
```

## Comandos Útiles

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch

# Tests específicos
npm test -- tests/clients/

# Tests con patrón
npm test -- --grep "HTTP Client"

# Tests con timeout personalizado
npm test -- --timeout 10000

# Tests en modo verbose
npm test -- --verbose

# Tests con reporter específico
npm test -- --reporter=json
```

## Troubleshooting

### Problemas Comunes

#### 1. Mocks no funcionan
```typescript
// Asegurar que el mock se configura antes del import
vi.hoisted(() => {
  vi.mock('axios', () => axiosMock);
});
```

#### 2. Tests intermitentes
```typescript
// Usar beforeEach para reset de estado
beforeEach(() => {
  vi.clearAllMocks();
  resetTestState();
});
```

#### 3. Timeouts en tests async
```typescript
// Aumentar timeout para operaciones lentas
it('should handle slow operation', async () => {
  // Test logic
}, 10000); // 10 second timeout
```

#### 4. Memory leaks en tests
```typescript
// Limpiar recursos después de cada test
afterEach(() => {
  cleanupResources();
  vi.clearAllMocks();
});
```

## Métricas y Reporting

### 1. Coverage Reports
- **HTML Report**: Navegable en browser
- **JSON Report**: Para integración con herramientas
- **Text Report**: Para consola

### 2. Test Results
- **JUnit XML**: Para CI/CD integration
- **JSON**: Para análisis programático
- **Console**: Para desarrollo local

### 3. Performance Metrics
- **Test execution time**
- **Memory usage**
- **Coverage trends**

## Roadmap de Testing

### Corto Plazo
- [ ] Implementar property-based testing
- [ ] Añadir mutation testing
- [ ] Mejorar performance de tests

### Mediano Plazo
- [ ] Tests de carga automatizados
- [ ] Visual regression testing
- [ ] Contract testing

### Largo Plazo
- [ ] AI-powered test generation
- [ ] Chaos engineering tests
- [ ] Production testing strategies