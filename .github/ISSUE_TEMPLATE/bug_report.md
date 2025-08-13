---
name: 🐛 Bug Report
about: Reportar un bug o error en el sistema
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

# 🐛 Bug Report

## 📋 Información del Bug

### Descripción
<!-- Descripción clara y concisa del bug -->

### Comportamiento Esperado
<!-- Describe qué esperabas que pasara -->

### Comportamiento Actual
<!-- Describe qué está pasando actualmente -->

### Pasos para Reproducir
1. 
2. 
3. 
4. 

## 🔍 Información Técnica

### Ambiente
- [ ] Desarrollo
- [ ] Testing
- [ ] Staging
- [ ] Producción

### Versión/Branch
<!-- Especifica la versión o branch donde ocurre el bug -->

### Logs/Errores
```
<!-- Incluir logs relevantes, stack traces, etc. -->
```

## 📊 Impacto y Criticidad

### Nivel de Criticidad
- [ ] 🔴 Crítico (Sistema no funciona, pérdida de datos)
- [ ] 🟠 Alto (Funcionalidad principal afectada)
- [ ] 🟡 Medio (Funcionalidad secundaria afectada)
- [ ] 🟢 Bajo (Problema cosmético o menor)

### Impacto en el Negocio
<!-- Describe cómo afecta este bug al negocio o usuarios -->

### Usuarios Afectados
<!-- Número estimado o porcentaje de usuarios afectados -->

## 🏗️ Validación de Dogmas del Equipo

### Documentación del Bug
- [ ] Bug documentado completamente (según dogma: "Todo bug sin documentación es un error")
- [ ] Contexto claro para PM y TL
- [ ] Impacto en escalabilidad identificado
- [ ] Dependencias de terceros identificadas

### Responsabilidad
- [ ] Responsable asignado
- [ ] Prioridad definida en contexto de negocio
- [ ] Fecha límite establecida (si aplica)

## 🔗 Información Adicional

### Screenshots/Videos
<!-- Adjuntar evidencia visual si ayuda a entender el problema -->

### Contexto Adicional
<!-- Cualquier otra información relevante -->

### Enlaces Relacionados
- Issues relacionados: 
- Documentación: 
- Logs de monitoreo: 

## 🌿 Nomenclatura de Rama para Corrección

Cuando se corrija este bug, la rama debe seguir la convención:

```
fix/FB-[NÚMERO-JIRA]_[descripción-corta]
```

**Ejemplo**: `fix/FB-456_correccion-error-conexion`

> 📋 **Recordatorio**: El número de Jira debe coincidir con el ticket asociado a este issue.

---

**Nota**: Este bug será considerado deuda técnica una vez documentado y priorizado por los líderes del equipo.