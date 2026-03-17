# Sistema de Materiales para Eventos - Documentación Final

## Estado: ✅ COMPLETADO Y FUNCIONAL

---

## Modelo de Negocio Clarificado

### 1. Materiales CONSUMIBLES (a entregar - Stock Eventos)

**Origen**: Donaciones o compras específicas para eventos

**Características**:

- ✅ Se **DESCONTAN INMEDIATAMENTE** al asignar a un evento
- ✅ Se entregan a los participantes y **NO regresan**
- ✅ Una vez asignados, el stock se reduce permanentemente
- ❌ **NO necesitan validación por fecha** (no se reutilizan)
- ✅ Pueden venir de donaciones (bloqueados, no se pueden eliminar)
- ✅ Se pueden agregar manualmente

**Flujo**:

1. Material tiene 100 unidades en `stockEventos`
2. Se asignan 50 unidades al Evento A (5 marzo) → Stock: 50
3. Se asignan 30 unidades al Evento B (10 marzo) → Stock: 20
4. Se asignan 30 unidades al Evento C (15 marzo) → ❌ ERROR (solo quedan 20)
5. Si se elimina asignación ANTES de que inicie el evento → Stock se revierte
6. Si evento ya inició → NO se puede eliminar asignación

**Ejemplo**: Camisetas, balones para donar, medallas, trofeos

---

### 2. Materiales REUTILIZABLES (a usar - Stock Fundación)

**Origen**: Patrimonio de la fundación

**Características**:

- ❌ **NO se descuenta stock** (son patrimonio, deben regresar)
- ✅ **Sistema de reservas por fecha** con validación de disponibilidad
- ✅ Detecta conflictos cuando eventos se solapan en fechas
- ✅ Calcula uso máximo concurrente
- ✅ Muestra qué eventos están usando el material y cuándo

**Flujo**:

1. Material tiene 10 unidades en `stockFundacion`
2. Evento A (5-7 marzo) planifica usar 8 unidades → ✅ Disponible
3. Evento B (10-12 marzo) planifica usar 8 unidades → ✅ Disponible (fechas no se solapan)
4. Evento C (6-8 marzo) planifica usar 8 unidades → ❌ ERROR (conflicto con Evento A)
5. Evento C (6-8 marzo) planifica usar 2 unidades → ✅ Disponible (quedan 2 libres)
6. Después del evento, los materiales regresan al inventario

**Ejemplo**: Conos, cronómetros, silbatos, redes, arcos portátiles

---

## Arquitectura Implementada

### Backend

#### Modelos Prisma

```prisma
model Material {
  stockFundacion         Int      // Para materiales reutilizables
  stockEventos           Int      // Para materiales consumibles
  stockEventosReservado  Int      // NO USADO (legacy)
}

model EventMaterial {
  // Materiales consumibles asignados
  // Descuento inmediato de stockEventos
  tipo       EventMaterialType  // CONSUMIBLE
  bloqueado  Boolean            // true si viene de donación
}

model EventMaterialReusable {
  // Materiales reutilizables planificados
  // NO descuenta stock, solo planificación
}

model MaterialMovement {
  tipoMovimiento  MovementType  // ASIGNACION_EVENTO, REVERSION_ASIGNACION
}
```

#### Servicios

**eventMaterialsConsumable.service.js**:

- `getByEvent()` - Obtener consumibles asignados
- `loadDonationMaterials()` - Cargar materiales de donaciones
- `assignMaterial()` - Asignar consumible (descuento inmediato)
- `removeAssignment()` - Eliminar asignación (reversión si evento no inició)

**eventMaterialsReusable.service.js**:

- `getByEvent()` - Obtener reutilizables planificados
- `assignMaterial()` - Planificar reutilizable (con validación por fecha)
- `checkMaterialAvailability()` - Validar disponibilidad por fecha
- `getMaterialAssignments()` - Ver todas las asignaciones de un material
- `calculateMaxConcurrentUsage()` - Calcular uso máximo concurrente
- `removeAssignment()` - Eliminar planificación

**eventMaterialsSummary.service.js**:

- `getSummary()` - Resumen agregado optimizado

#### Endpoints

```
# Resumen
GET    /api/materials/events/:eventId/materials-summary

# Consumibles
GET    /api/materials/events/:eventId/consumables
POST   /api/materials/events/:eventId/consumables
POST   /api/materials/events/:eventId/consumables/load-donations
DELETE /api/materials/events/consumables/:assignmentId

# Reutilizables
GET    /api/materials/events/:eventId/reusables
POST   /api/materials/events/:eventId/reusables
DELETE /api/materials/events/reusables/:assignmentId
GET    /api/materials/reusables/:materialId/availability
GET    /api/materials/reusables/:materialId/assignments  # NUEVO
```

---

### Frontend

#### Componentes

**EventMaterialsModal.jsx**: Modal principal con tabs

- Tab 1: Materiales a Entregar (consumibles)
- Tab 2: Materiales a Usar (reutilizables)

**DeliverableMaterialsTab.jsx**: Materiales consumibles

- Muestra donaciones (bloqueadas) y manuales
- Descuento inmediato al agregar
- Reversión al eliminar (si evento no inició)
- Bloqueo si evento ya inició

**UsableMaterialsTab.jsx**: Materiales reutilizables

- Planificación sin descuento de stock
- Validación por fecha con detección de conflictos
- Muestra eventos en conflicto con fechas
- Bloqueo si evento ya inició

**MaterialAssignmentsModal.jsx**: Vista de asignaciones (NUEVO)

- Muestra todos los eventos que usan un material
- Calcula uso máximo concurrente
- Muestra disponibilidad mínima
- Filtro para incluir eventos completados
- Timeline de uso por fechas

---

## Validaciones Implementadas

### Materiales Consumibles

1. ✅ Stock disponible en tiempo real
2. ✅ Descuento inmediato al asignar
3. ✅ Reversión al eliminar (solo si evento no inició)
4. ✅ Bloqueo de edición si evento ya inició
5. ✅ Donaciones bloqueadas (no se pueden eliminar)
6. ✅ Indicadores visuales de stock insuficiente

### Materiales Reutilizables

1. ✅ Validación de disponibilidad por fecha
2. ✅ Detección de conflictos con eventos solapados
3. ✅ Cálculo de uso máximo concurrente
4. ✅ Muestra eventos en conflicto con detalles
5. ✅ Bloqueo de edición si evento ya inició
6. ✅ Vista de asignaciones por material

---

## Casos de Uso

### Caso 1: Evento con Camisetas para Donar (Consumible)

```
Material: Camisetas Deportivas
Stock Eventos: 200 unidades

1. Evento "Torneo Infantil" (15 marzo):
   - Asignar 100 camisetas → Stock: 100 ✅

2. Evento "Maratón" (20 marzo):
   - Asignar 80 camisetas → Stock: 20 ✅

3. Evento "Copa Local" (25 marzo):
   - Intentar asignar 50 camisetas → ❌ ERROR (solo quedan 20)
   - Asignar 20 camisetas → Stock: 0 ✅

4. Si "Torneo Infantil" se cancela ANTES del 15 marzo:
   - Eliminar asignación → Stock: 100 ✅ (reversión)

5. Si "Torneo Infantil" ya inició (15 marzo o después):
   - NO se puede eliminar asignación ❌ (bloqueado)
```

### Caso 2: Evento con Conos Reutilizables (Reutilizable)

```
Material: Conos de Entrenamiento
Stock Fundación: 50 unidades

1. Evento A (5-7 marzo):
   - Planificar 30 conos → ✅ Disponible

2. Evento B (10-12 marzo):
   - Planificar 40 conos → ✅ Disponible (fechas no se solapan)

3. Evento C (6-8 marzo):
   - Planificar 30 conos → ❌ ERROR
   - Conflicto con Evento A (5-7 marzo)
   - Disponible: 20 conos (50 - 30 del Evento A)

4. Evento C (6-8 marzo):
   - Planificar 20 conos → ✅ Disponible

5. Uso máximo concurrente: 50 conos
   - Evento A: 30 conos (5-7 marzo)
   - Evento C: 20 conos (6-8 marzo)
   - Total simultáneo: 50 conos ✅

6. Ver asignaciones del material:
   - Evento A: 30 conos (5-7 marzo)
   - Evento B: 40 conos (10-12 marzo)
   - Evento C: 20 conos (6-8 marzo)
   - Uso máximo concurrente: 50 conos
   - Disponible mínimo: 0 conos
```

---

## Próximos Pasos Sugeridos

1. ✅ Sistema de validación por fecha implementado
2. ✅ Vista de asignaciones por material implementada
3. ⏳ Integrar con módulo de eventos (siguiente fase)
4. ⏳ Dashboard de disponibilidad de materiales
5. ⏳ Alertas de stock bajo para consumibles
6. ⏳ Reporte de uso por evento
7. ⏳ Sistema de check-in/check-out para reutilizables
8. ⏳ Notificaciones antes de que inicie evento

---

## Testing Checklist

### Consumibles

- [x] Asignar material consumible → verificar descuento inmediato
- [x] Eliminar material antes de iniciar evento → verificar reversión
- [x] Intentar eliminar después de iniciar evento → verificar bloqueo
- [x] Donaciones bloqueadas
- [x] Stock disponible en tiempo real
- [x] Validaciones con SweetAlert2

### Reutilizables

- [x] Asignar material reutilizable → verificar que NO descuenta stock
- [x] Validar disponibilidad por fecha
- [x] Detectar conflictos con eventos solapados
- [x] Mostrar eventos en conflicto con detalles
- [x] Calcular uso máximo concurrente
- [x] Ver asignaciones por material
- [x] Eliminar material reutilizable
- [x] Bloqueo si evento ya inició

---

## Notas Importantes

1. **Diferencia clave**: Consumibles se descontan, reutilizables se reservan por fecha
2. **Campo `stockEventosReservado`**: Existe en schema pero NO se usa (legacy)
3. **Validación por fecha**: Solo para reutilizables, no para consumibles
4. **Uso máximo concurrente**: Calcula la mayor cantidad en uso simultáneamente
5. **Bloqueo por fecha**: Aplica a AMBOS tipos cuando evento ya inició

---

## Contacto y Soporte

Para dudas o problemas, revisar:

- `API_MATERIALES_EVENTOS.md` - Documentación de API
- `RESUMEN_FINAL_MATERIALES_EVENTOS.md` - Resumen anterior
- Este documento - Documentación final actualizada
