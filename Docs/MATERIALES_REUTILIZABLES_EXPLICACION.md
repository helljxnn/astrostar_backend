# Sistema de Materiales Reutilizables

## Concepto General

El sistema de materiales deportivos maneja dos tipos de materiales según su naturaleza:

### 1. Materiales Consumibles (`esReutilizable = false`)

- **Definición**: Materiales que se entregan en el evento y NO regresan al inventario
- **Ejemplos**: Agua, snacks, premios, material desechable, camisetas de regalo
- **Stock**: Se almacenan en `stockEventos`
- **Comportamiento**:
  - Se descuenta stock cuando finaliza el evento
  - No se pueden reutilizar en otros eventos
  - Provienen principalmente de donaciones

### 2. Materiales Reutilizables (`esReutilizable = true`)

- **Definición**: Materiales que se usan en el evento pero regresan al inventario
- **Ejemplos**: Balones, conos, redes, uniformes, equipos deportivos, cronómetros
- **Stock**: Se almacenan en `stockFundacion`
- **Comportamiento**:
  - **NO se descuenta stock** al asignar a eventos
  - Solo se planifica su uso (reserva temporal)
  - Después del evento, automáticamente están disponibles de nuevo
  - Se pueden usar en múltiples eventos si las fechas no se solapan

## Validación por Fecha (Disponibilidad)

### ¿Cómo funciona?

El sistema valida la disponibilidad de materiales reutilizables basándose en las fechas de los eventos:

```
Stock Fundación: 20 balones

Evento A (5-10 marzo): 10 balones ✅ Disponible
Evento B (8-12 marzo): 15 balones ❌ Solo 10 disponibles (Evento A usa 10)
Evento C (15-20 marzo): 20 balones ✅ Disponible (no hay solapamiento)
```

### Lógica de Validación

1. **Detectar eventos solapados**: Busca eventos cuyas fechas se cruzan
2. **Calcular uso**: Suma las cantidades planificadas en eventos solapados
3. **Verificar disponibilidad**: `Stock Fundación - Total Usado en Solapados >= Cantidad Solicitada`

### Ejemplo Detallado

**Escenario:**

- Material: Balones de fútbol
- Stock Fundación: 30 unidades
- `esReutilizable = true`

**Eventos planificados:**

| Evento            | Fechas      | Cantidad   | Estado                                          |
| ----------------- | ----------- | ---------- | ----------------------------------------------- |
| Torneo Infantil   | 5-7 marzo   | 15 balones | ✅ Aprobado (30 disponibles)                    |
| Clínica Deportiva | 6-8 marzo   | 10 balones | ✅ Aprobado (15 disponibles: 30 - 15)           |
| Campeonato        | 6-9 marzo   | 10 balones | ❌ Rechazado (solo 5 disponibles: 30 - 15 - 10) |
| Liga Juvenil      | 12-15 marzo | 25 balones | ✅ Aprobado (30 disponibles, sin solapamiento)  |

## Flujo de Trabajo

### Para Materiales a Entregar (Consumibles)

1. Usuario selecciona material del stock eventos
2. Sistema valida stock disponible en tiempo real
3. Al agregar: se crea registro en `EventMaterial`
4. **Al finalizar evento**: se descuenta del `stockEventos`

### Para Materiales a Usar (Reutilizables)

1. Usuario selecciona material del stock fundación
2. Sistema valida:
   - Material marcado como `esReutilizable = true`
   - Stock fundación suficiente
   - **Disponibilidad por fecha** (no conflictos con otros eventos)
3. Al agregar: se crea registro en `EventMaterialReusable`
4. **NO se descuenta stock** (solo planificación)
5. Después del evento: material automáticamente disponible de nuevo

## Migración Aplicada

La migración `20260304185918_mark_reusable_materials` clasifica los materiales existentes:

```sql
-- Materiales con stock SOLO en fundación -> REUTILIZABLE
UPDATE materials
SET es_reutilizable = true
WHERE stock_fundacion > 0 AND stock_eventos = 0;

-- Materiales con stock en eventos -> CONSUMIBLE
UPDATE materials
SET es_reutilizable = false
WHERE stock_eventos > 0;
```

## Endpoints API

### Materiales a Usar (Reutilizables)

- `POST /api/materials/events/:eventId/reusables` - Planificar uso de material
- `DELETE /api/materials/events/reusables/:assignmentId` - Eliminar planificación
- `GET /api/materials/events/:eventId/reusables` - Listar materiales planificados

### Validaciones Backend

```javascript
// Valida que sea reutilizable
if (!material.esReutilizable) {
  return { success: false, message: "This material is not marked as reusable" };
}

// Valida disponibilidad por fecha
const isAvailable = await checkMaterialAvailability(
  materialId,
  cantidad,
  event.startDate,
  event.endDate,
);
```

## Filtros en Frontend

### Pestaña "Materiales a Entregar"

```javascript
stockType: "eventos"; // Solo consumibles (esReutilizable = false)
```

### Pestaña "Materiales a Usar"

```javascript
stockType: "fundacion"; // Solo reutilizables (esReutilizable = true)
```

## Beneficios del Sistema

1. **Optimización de recursos**: Los materiales reutilizables no se "gastan"
2. **Planificación eficiente**: Evita conflictos de disponibilidad por fecha
3. **Trazabilidad**: Historial de uso sin afectar el stock
4. **Flexibilidad**: Múltiples eventos pueden usar los mismos materiales si no se solapan
5. **Realismo**: Refleja el comportamiento real de los materiales deportivos

## Próximos Pasos (Opcional)

- [ ] Dashboard de disponibilidad de materiales por fecha
- [ ] Alertas de conflictos al crear eventos
- [ ] Reporte de uso de materiales reutilizables
- [ ] Sistema de check-in/check-out para materiales reutilizables
