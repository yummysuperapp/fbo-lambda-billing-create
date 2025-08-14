# 📋 GitHub Templates

Este directorio contiene las plantillas de GitHub para Pull Requests e Issues, diseñadas específicamente para el equipo de Financial Backoffice siguiendo nuestros dogmas y definiciones de proceso.

## 🎯 Plantillas Disponibles

### Pull Request Template

- **Archivo**: `pull_request_template.md`
- **Propósito**: Asegurar que todos los PRs cumplan con la Definition of Done (DoD)
- **Incluye**: Checklist de DoD, validación de dogmas, evidencia requerida

### Issue Templates

#### 🐛 Bug Report (`bug_report.md`)

- Para reportar bugs y errores en el sistema
- Incluye validación de documentación según dogmas del equipo
- Clasificación de criticidad e impacto

#### ✨ Feature Request (`feature_request.md`)

- Para proponer nuevas funcionalidades
- Basado en Definition of Ready (DoR)
- Incluye análisis de escalabilidad y eficiencia

#### 🔧 Technical Task (`technical_task.md`)

- Para tareas técnicas, spikes y POCs
- Enfocado en mejoras de infraestructura y deuda técnica
- Validación de impacto en testing y performance

#### 📊 Technical Debt (`technical_debt.md`)

- Para documentar deuda técnica identificada
- Seguimiento de bugs documentados y despriorizados
- Análisis de impacto y estrategias de resolución

## 🏗️ Dogmas del Equipo Integrados

Todas las plantillas incorporan nuestros dogmas fundamentales:

### Escalabilidad y Eficiencia

- ✅ Todo debe ser escalable, elástico y pensado en usos futuros
- ✅ Soluciones eficientes son escalables y elásticas
- ✅ Todo lo versionado es rastreable y documentado

### Testing y Calidad

- ✅ Proyectos con pruebas unitarias deben sumar al menos 3% adicional
- ✅ Excepción: proyectos con +80% de cobertura
- ✅ Todo bug sin documentación es un error

### Responsabilidad y Proceso

- ✅ Toda tarea debe ser asignada a un responsable
- ✅ Todo responsable debe velar por el cumplimiento
- ✅ Solo PM o TL pueden marcar tareas como HECHO
- ✅ Bugs documentados son deuda técnica válida

## ✅ Definition of Ready (DoR)

Las plantillas de features incluyen validación completa de DoR:

- 🎯 **Claridad**: Entendimiento claro y documentado de la finalidad
- 🔍 **Dependencias**: Identificación y validación de dependencias de terceros
- 📊 **Data**: Estado y calidad de la data entendidos
- 🎯 **Casos de Uso**: Casos de uso y bordes definidos con criterios claros
- 📈 **Métricas**: Métricas de éxito definidas y acordadas
- 🔧 **Viabilidad**: Viabilidad técnica validada
- ⏱️ **Timeline**: Fecha límite establecida

## ✅ Definition of Done (DoD)

Las plantillas de PR incluyen validación completa de DoD:

- 🚀 **Implementación**: Completa, demostrable y auditada
- 🧪 **Testing**: Pruebas automatizadas y manuales aprobadas
- 📊 **Evidencia**: Documentación en PR con capturas, logs, reportes
- 🔍 **QA**: Certificación de QA y validación por Finanzas
- 📚 **Documentación**: Técnica y funcional actualizada
- 🎯 **Producción**: Desplegado y funcionando sin errores críticos

## 📋 Uso de las Plantillas

### Para Pull Requests

1. La plantilla se carga automáticamente al crear un PR
2. Completar todos los checkboxes aplicables
3. Incluir evidencia requerida (capturas, logs, reportes)
4. Asegurar que el pipeline de CI/CD pase exitosamente
5. Solo PM o TL pueden aprobar y mergear

### Para Issues

1. Seleccionar el tipo de issue apropiado
2. Completar toda la información requerida
3. Asignar responsable específico
4. Establecer prioridad y timeline
5. Validar que cumple con los dogmas del equipo

## 🔄 Proceso de Mejora Continua

Estas plantillas son documentos vivos que evolucionan con el equipo:

- 📈 **Métricas**: Seguimiento de efectividad de las plantillas
- 🔄 **Feedback**: Incorporación de feedback del equipo
- 📚 **Actualización**: Actualización basada en lecciones aprendidas
- 🎯 **Optimización**: Optimización continua del proceso

## 📞 Contacto y Soporte

Para dudas sobre las plantillas o procesos:

- **Tech Lead**: José Carrillo <jose.carrillo@yummysuperapp.com>
- **Documentación**: [docs/](../docs/)
- **Discusiones**: [GitHub Discussions](../../discussions)

---

**Recordatorio**: Estas plantillas reflejan nuestros dogmas y procesos establecidos. Su uso correcto asegura la calidad, escalabilidad y mantenibilidad de nuestros proyectos.
