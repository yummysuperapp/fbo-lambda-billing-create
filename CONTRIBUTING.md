# Guía de Contribución

¡Gracias por tu interés en contribuir al proyecto FBO Lambda Template! Esta guía te ayudará a entender nuestro proceso de desarrollo y cómo puedes contribuir efectivamente.

## 📋 Tabla de Contenidos

- [Dogmas del Equipo](#dogmas-del-equipo)
- [Definition of Ready (DoR)](#definition-of-ready-dor)
- [Definition of Done (DoD)](#definition-of-done-dod)
- [Proceso de Contribución](#proceso-de-contribución)
- [Estándares de Código](#estándares-de-código)
- [Testing](#testing)
- [Documentación](#documentación)
- [Revisión de Código](#revisión-de-código)

## 🏗️ Dogmas del Equipo

Antes de contribuir, es fundamental entender y seguir nuestros dogmas:

### Escalabilidad y Eficiencia

- ✅ **Todo lo que se haga debe ser escalable, elástico y pensado en usos futuros** (sin hacer trabajo de más)
- ✅ **Todo lo eficiente es escalable y elástico**
- ✅ **Todo lo versionado es rastreable y documentado**

### Testing y Calidad

- ✅ **Todo proyecto que implemente pruebas unitarias debe sumar al menos 3% adicional** al estado actual
- ✅ **Excepción**: Si el proyecto se encuentra en +80% de cobertura
- ✅ **Todo bug sin documentación es un error**

### Responsabilidad y Proceso

- ✅ **Toda tarea debe ser asignada a un responsable**
- ✅ **Todo responsable debe velar por el cumplimiento de su tarea**
- ✅ **Las tareas solo deben ser pasadas a HECHO por el PM o TL**
- ✅ **Si tienes muchas dudas, pártelo y divídete el trabajo con otras personas**

### Deuda Técnica

- ✅ **Los bugs son deuda técnica, siempre que esté documentado y los líderes sepan que existe**

## ✅ Definition of Ready (DoR)

Antes de comenzar cualquier trabajo, asegúrate de que cumple con la DoR:

### 🎯 Claridad y Entendimiento

- [ ] **Entendimiento claro y documentado** de la finalidad de la historia de usuario
- [ ] **Contexto claro para el PM y el TL** de la idea inicial
- [ ] **Sin dudas en cuanto a su finalidad** (si hay dudas, realizar Spike o POC)

### 🔍 Análisis Técnico

- [ ] **Dependencias de terceros identificadas** y su disponibilidad validada
- [ ] **Estado y calidad de la data** entendidos antes del refinamiento
- [ ] **Viabilidad técnica validada** (limitaciones de sistemas, infraestructura o integraciones)

### 📊 Definición y Métricas

- [ ] **Casos de uso y casos borde definidos** con criterios de aceptación claros
- [ ] **Criticidad o prioridad identificada** en el contexto del negocio
- [ ] **Métricas de éxito definidas** para validar el cumplimiento
- [ ] **Fecha límite de entrega (deadline)** establecida

### 📏 Estimación

- [ ] **Estimación realizada**: Todo lo que sea mayor a 13 puntos o tome más de 10 días pasa a ser Epic
- [ ] **Spike definido**: De ser necesario, mínimo 2 pts y máximo 5 pts

## ✅ Definition of Done (DoD)

Todo trabajo debe cumplir con la DoD antes de ser considerado completo:

### 🚀 Implementación

- [ ] **Implementación completa y demostrable**
- [ ] **Certificación de QA** y validación por Finanzas (cuando aplique)
- [ ] **Código desplegado y funcionando correctamente en PROD** sin errores críticos
- [ ] **Solución auditable** por Finanzas y otros equipos externos

### 🧪 Testing y Calidad

- [ ] **Pruebas automatizadas y/o manuales ejecutadas y aprobadas**
- [ ] **Cobertura de casos de uso y casos borde**
- [ ] **Incremento mínimo de 3% en cobertura** (o mantenida si >80%)
- [ ] **Pipeline de CI/CD ejecutado exitosamente**

### 📊 Evidencia y Documentación

- [ ] **Evidencia documentada en el Pull Request** (capturas, logs, reportes, instrucciones)
- [ ] **Documentación técnica y funcional actualizada** en Notion
- [ ] **Data unificada correctamente**, evitando corrupción o pérdidas
- [ ] **Fuente de la verdad establecida** para entidades dependientes

## 🔄 Proceso de Contribución

### 1. Preparación

```bash
# 1. Fork del repositorio (si es externo)
# 2. Clonar el repositorio
git clone https://github.com/yummysuperapp/fbo-lambda-template.git
cd fbo-lambda-template

# 3. Instalar dependencias
npm install

# 4. Verificar que todo funciona
npm run check-all
```

### 2. Desarrollo

```bash
# 1. Crear rama desde develop
git checkout develop
git pull origin develop
git checkout -b feature/FB-123_descripcion-corta

# 2. Realizar cambios siguiendo estándares
# 3. Ejecutar tests frecuentemente
npm run test:watch

# 4. Verificar calidad antes de commit
npm run check-all
```

### 3. Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato: tipo(scope): descripción

# Ejemplos:
git commit -m "feat(clients): add BigQuery client with connection pooling"
git commit -m "fix(services): resolve memory leak in finance service"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(utils): add edge cases for helper functions"
git commit -m "refactor(handlers): improve error handling structure"
```

**Tipos permitidos:**

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (no afectan funcionalidad)
- `refactor`: Refactoring de código
- `test`: Añadir o modificar tests
- `chore`: Tareas de mantenimiento
- `perf`: Mejoras de performance
- `ci`: Cambios en CI/CD

### 4. Pull Request

1. **Crear PR** usando la plantilla automática
2. **Completar checklist** de DoD
3. **Incluir evidencia** (capturas, logs, métricas)
4. **Asignar reviewers** (mínimo TL)
5. **Esperar aprobación** antes de merge

## 🌿 Convenciones de Nomenclatura de Ramas

Todas las ramas deben seguir la convención que incluye el código de Jira como prefijo:

### Formato Obligatorio

```
<tipo>/<código-jira>_<descripción-corta>
```

### Tipos de Rama

- **`feat/`**: Nuevas funcionalidades
- **`fix/`**: Corrección de bugs
- **`hotfix/`**: Correcciones urgentes en producción
- **`refactor/`**: Refactoring de código
- **`docs/`**: Cambios en documentación
- **`test/`**: Añadir o modificar tests
- **`chore/`**: Tareas de mantenimiento

### Ejemplos Correctos

```bash
# Nuevas funcionalidades
git checkout -b feat/FB-123_integracion-bigquery
git checkout -b feat/FB-456_cliente-http-mejorado

# Corrección de bugs
git checkout -b fix/FB-789_error-conexion-mongodb
git checkout -b fix/FB-101_validacion-parametros

# Hotfix urgente
git checkout -b hotfix/FB-999_fallo-critico-produccion

# Refactoring
git checkout -b refactor/FB-234_optimizacion-queries

# Documentación
git checkout -b docs/FB-567_actualizacion-readme

# Testing
git checkout -b test/FB-890_cobertura-servicios
```

### Reglas Importantes

- ✅ **Obligatorio**: Usar código de Jira con prefijo `FB-`
- ✅ **Obligatorio**: Usar guión bajo `_` después del código
- ✅ **Obligatorio**: Descripción en kebab-case (guiones)
- ✅ **Máximo 50 caracteres** para la descripción
- ❌ **Prohibido**: Espacios, caracteres especiales, mayúsculas en descripción

### Validación Automática

Los workflows de CI/CD validarán automáticamente que las ramas sigan esta convención antes de permitir el merge.

## 💻 Estándares de Código

### TypeScript

```typescript
// ✅ Correcto: Strong typing
interface UserData {
	id: string;
	email: string;
	createdAt: Date;
}

const processUser = (user: UserData): Promise<ProcessResult> => {
	// Implementation
};

// ❌ Incorrecto: Uso de any
const processUser = (user: any): any => {
	// Implementation
};
```

### Naming Conventions

```typescript
// Variables y funciones: camelCase
const userName = 'jose.carrillo';
const calculateTotal = () => {};

// Clases y interfaces: PascalCase
class DatabaseClient {}
interface ApiResponse {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Archivos y directorios: kebab-case
// user-service.ts
// database-clients/
```

### 🌐 Estándares de Idioma

> **CRÍTICO**: Este proyecto sigue estándares estrictos de idioma que DEBEN ser respetados en todas las contribuciones.

#### 📝 Reglas Obligatorias

**✅ CÓDIGO FUENTE (Siempre en inglés)**

```typescript
// ✅ CORRECTO: Variables, funciones, clases en inglés
const calculateTransactionFee = (amount: number): number => {
	const processingFee = amount * 0.025;
	return processingFee;
};

interface PaymentRequest {
	userId: string;
	amount: number;
	currency: string;
}

// ❌ INCORRECTO: Código en español
const calcularComisionTransaccion = (monto: number): number => {
	const comisionProcesamiento = monto * 0.025;
	return comisionProcesamiento;
};
```

**✅ COMENTARIOS DE CÓDIGO (Siempre en inglés)**

```typescript
// ✅ CORRECTO: Comentarios de código en inglés
/**
 * Validates payment request data
 * @param request - Payment request object
 * @returns Validation result
 */
const validatePayment = (request: PaymentRequest): boolean => {
	// Check if amount is positive
	if (request.amount <= 0) {
		return false;
	}
	return true;
};

// ❌ INCORRECTO: Comentarios en español
/**
 * Valida los datos de solicitud de pago
 * @param solicitud - Objeto de solicitud de pago
 * @returns Resultado de validación
 */
```

**✅ DOCUMENTACIÓN (Siempre en español)**

```markdown
<!-- ✅ CORRECTO: Documentación en español -->

## Configuración de Base de Datos

Esta sección explica cómo configurar la conexión a PostgreSQL para el ambiente de desarrollo.

### Pasos de Instalación

1. Instalar PostgreSQL 15+
2. Crear base de datos `fbo_dev`
3. Configurar variables de entorno

<!-- ❌ INCORRECTO: Documentación en inglés -->

## Database Configuration

This section explains how to configure PostgreSQL connection for development environment.
```

**✅ FRAGMENTOS DE CÓDIGO EN DOCUMENTACIÓN (Siempre en inglés)**

````markdown
<!-- ✅ CORRECTO: Código en documentación en inglés -->

## Ejemplo de Uso

```typescript
const client = new DatabaseClient({
	host: 'localhost',
	port: 5432,
	database: 'fbo_dev',
});

const result = await client.executeQuery('SELECT * FROM transactions');
```
````

<!-- ❌ INCORRECTO: Código en documentación en español -->

```typescript
const cliente = new ClienteBaseDatos({
	servidor: 'localhost',
	puerto: 5432,
	baseDatos: 'fbo_dev',
});
```

#### 🎯 Aplicación por Tipo de Archivo

| Tipo de Archivo       | Idioma del Contenido | Ejemplos                        |
| --------------------- | -------------------- | ------------------------------- |
| **Código TypeScript** | 🇺🇸 Inglés            | `*.ts`, `*.js`, `*.mjs`         |
| **Tests**             | 🇺🇸 Inglés            | `*.test.ts`, `*.spec.ts`        |
| **Configuración**     | 🇺🇸 Inglés            | `tsconfig.json`, `package.json` |
| **Documentación**     | 🇪🇸 Español           | `README.md`, `docs/*.md`        |
| **Commits**           | 🇪🇸 Español           | Títulos y descripciones         |
| **Pull Requests**     | 🇪🇸 Español           | Títulos y descripciones         |
| **Issues**            | 🇪🇸 Español           | Títulos y descripciones         |

#### 🚫 Violaciones Comunes a Evitar

```typescript
// ❌ NUNCA: Mezclar idiomas en el mismo contexto
const calculateTotal = (monto: number): number => {
	// Calcular el total con impuestos
	const tax = amount * 0.19;
	return monto + tax;
};

// ❌ NUNCA: Variables en español
const nombreUsuario = 'jose.carrillo';
const configuracionBaseDatos = { host: 'localhost' };

// ❌ NUNCA: Funciones en español
function procesarTransaccion(datos: any) {
	return datos;
}

// ❌ NUNCA: Clases en español
class ServicioFinanciero {
	constructor() {}
}
```

#### 📚 Referencia a Documentación Completa

Para documentación técnica detallada, arquitectura del sistema y guías de implementación, consulta:

**🔗 [Notion - Financial Backoffice Documentation](https://www.notion.so/yummy/financial-backoffice)**

Esta documentación incluye:

- Especificaciones técnicas completas
- Diagramas de arquitectura actualizados
- Guías de troubleshooting
- Procedimientos operativos
- Roadmap y planificación

### Estructura de Archivos

```typescript
// 1. Imports externos
import { Lambda } from 'aws-sdk';
import axios from 'axios';

// 2. Imports internos
import { DatabaseClient } from '@/clients';
import { Logger } from '@/utils';

// 3. Types e interfaces
interface ServiceConfig {
	timeout: number;
	retries: number;
}

// 4. Constantes
const DEFAULT_TIMEOUT = 5000;

// 5. Implementación
export class FinanceService {
	// Implementation
}
```

## 🧪 Testing

### Cobertura Requerida

- **Mínimo**: Incremento del 3% sobre el estado actual
- **Excepción**: Proyectos con >80% pueden mantener cobertura
- **Objetivo**: 100% de cobertura en funciones críticas

### Tipos de Tests

```typescript
// Unit Tests
describe('FinanceService', () => {
	it('should calculate total correctly', () => {
		// Test implementation
	});

	it('should handle edge cases', () => {
		// Edge case testing
	});
});

// Integration Tests
describe('Database Integration', () => {
	it('should connect to MongoDB successfully', async () => {
		// Integration test
	});
});
```

### Comandos de Testing

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch

# Verificación completa
npm run check-all
```

## 📚 Documentación

### Código

```typescript
/**
 * Calculates the total amount including taxes and fees
 * @param baseAmount - The base amount before calculations
 * @param taxRate - Tax rate as decimal (e.g., 0.19 for 19%)
 * @param fees - Additional fees to include
 * @returns The total calculated amount
 * @throws {ValidationError} When baseAmount is negative
 */
export const calculateTotal = (baseAmount: number, taxRate: number, fees: number = 0): number => {
	// Implementation
};
```

### README y Docs

- Mantener `README.md` actualizado
- Documentar cambios en `docs/IMPROVEMENTS.md`
- Actualizar `docs/ARCHITECTURE.md` para cambios estructurales
- Incluir ejemplos de uso

## 👥 Revisión de Código

### Proceso

1. **Auto-revisión**: Revisar tu propio código antes de crear PR
2. **Peer Review**: Al menos un desarrollador del equipo
3. **Tech Lead Review**: José Carrillo para cambios arquitectónicos
4. **PM Approval**: Para features que afecten funcionalidad

### Criterios de Revisión

#### ✅ Aprobación

- Cumple con dogmas del equipo
- Sigue estándares de código
- Tests pasan y cobertura aumenta
- Documentación actualizada
- No introduce deuda técnica

#### ❌ Rechazo

- Viola dogmas del equipo
- Tests fallan o cobertura disminuye
- Código no documentado
- Introduce vulnerabilidades
- No sigue convenciones

### Comentarios de Review

```markdown
# Ejemplos de comentarios constructivos

## ✅ Correcto

"Considera usar un Map aquí para mejorar la performance de búsqueda O(1) vs O(n)"
"Falta validación de entrada para el parámetro 'email'"
"Excelente uso de tipos, muy claro"

## ❌ Incorrecto

"Esto está mal"
"No me gusta este approach"
"Cambia todo"
```

## 🚨 Políticas de Seguridad

### Información Sensible

- **NUNCA** commitear credenciales, API keys, o secretos
- Usar variables de entorno para configuración sensible
- Revisar `.env.example` para variables requeridas

### Dependencias

```bash
# Auditar dependencias regularmente
npm audit

# Actualizar dependencias con vulnerabilidades
npm audit fix
```

## 📞 Contacto y Soporte

### Equipo de Liderazgo

- **Tech Lead**: José Carrillo <jose.carrillo@yummysuperapp.com>
- **Product Manager**: [PM Name] <pm@yummysuperapp.com>

### Canales de Comunicación

- **Issues Técnicos**: GitHub Issues
- **Discusiones**: GitHub Discussions
- **Urgencias**: Slack #fbo-team
- **Documentación**: Notion workspace

### Recursos Adicionales

- [Documentación de Arquitectura](docs/ARCHITECTURE.md)
- [Guía de Configuración](docs/CONFIGURATION.md)
- [Log de Mejoras](docs/IMPROVEMENTS.md)
- [Código de Conducta](CODE_OF_CONDUCT.md)

---

**¡Gracias por contribuir al éxito del equipo Financial Backoffice!** 🚀

_Última actualización: Agosto 2025_
