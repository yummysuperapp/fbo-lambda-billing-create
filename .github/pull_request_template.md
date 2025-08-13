# 🔄 Pull Request Template

## 📋 Información General

### Tipo de Cambio
- [ ] 🐛 Bug fix (cambio que corrige un issue)
- [ ] ✨ Nueva funcionalidad (cambio que añade funcionalidad)
- [ ] 💥 Breaking change (fix o feature que causaría que funcionalidad existente no funcione como se espera)
- [ ] 📚 Documentación (cambios solo en documentación)
- [ ] 🔧 Refactoring (cambio de código que no corrige un bug ni añade una funcionalidad)
- [ ] ⚡ Mejora de rendimiento
- [ ] 🧪 Tests (añadir tests faltantes o corregir tests existentes)
- [ ] 🔨 Chores (cambios en el proceso de build o herramientas auxiliares)

### Descripción
<!-- Describe brevemente los cambios realizados -->

### Issue/Ticket Relacionado
<!-- Enlaza el issue o ticket relacionado -->
Closes #

## ✅ Definition of Done (DoD) Checklist

### 🚀 Implementación
- [ ] Implementación completa y demostrable
- [ ] Código desplegado y funcionando correctamente en PROD sin errores críticos
- [ ] La solución es auditable por Finanzas y otros equipos
- [ ] La data resultante se unifica correctamente, evitando corrupción o pérdidas
- [ ] Se convierte en fuente de la verdad para las entidades dependientes

### 🧪 Testing y Calidad
- [ ] Pruebas automatizadas ejecutadas y aprobadas
- [ ] Cobertura de tests incrementada en al menos 3% (o mantenida si >80%)
- [ ] Casos de uso y casos borde cubiertos
- [ ] Pipeline de CI/CD ejecutado exitosamente
- [ ] Validación por QA completada
- [ ] Validación por Finanzas (si aplica)

### 📊 Evidencia y Documentación
- [ ] Capturas de pantalla/videos (si aplica)
- [ ] Logs de pruebas incluidos
- [ ] Reportes de testing adjuntos
- [ ] Instrucciones de prueba documentadas
- [ ] Documentación técnica actualizada en Notion
- [ ] Documentación funcional actualizada

## 🏗️ Dogmas del Equipo - Validación

### Escalabilidad y Eficiencia
- [ ] La solución es escalable y elástica
- [ ] Pensado en usos futuros sin trabajo innecesario
- [ ] Solución eficiente implementada
- [ ] Todo lo versionado es rastreable y documentado

### Responsabilidad y Proceso
- [ ] Tarea asignada a responsable específico
- [ ] Responsable ha velado por el cumplimiento
- [ ] Solo errores documentados considerados como deuda técnica
- [ ] Dependencias de terceros identificadas y validadas

## 🔍 Testing

### Cobertura de Tests
<!-- Incluir reporte de cobertura actual -->
- Cobertura anterior: ___%
- Cobertura actual: ___%
- Incremento: ___%

### Tipos de Tests Ejecutados
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests (si aplica)
- [ ] Performance tests (si aplica)

## 📸 Evidencia Visual

<!-- Incluir capturas, videos, logs, etc. -->

### Screenshots/Videos
<!-- Adjuntar evidencia visual si aplica -->

### Logs Relevantes
```
<!-- Incluir logs importantes aquí -->
```

## 🔗 Enlaces Relacionados

- [ ] Documentación en Notion: [Link]
- [ ] Issue/Ticket: [Link]
- [ ] Deployment: [Link]
- [ ] Métricas/Monitoreo: [Link]

## 🚨 Consideraciones Especiales

<!-- Mencionar cualquier consideración especial, limitaciones, o puntos de atención -->

## 📝 Notas para el Reviewer

<!-- Información adicional para quien revise el PR -->

---

**Recordatorio**: Este PR solo puede ser marcado como HECHO por el PM o TL según los dogmas del equipo.