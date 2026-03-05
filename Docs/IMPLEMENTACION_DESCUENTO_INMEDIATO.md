# Implementación: Descuento Inmediato de Stock Eventos

## Resumen

Se implementó el sistema de **descuento inmediato** para materiales consumibles (stock eventos) asignados a eventos, con capacidad de reversión si el evento no ha iniciado.

## Flujo Implementado

### 1. Al Asignar Material a Evento

**Backend (`eventMaterialsConsumable.service.js`):**

```javascript
// Transacción atómica
await prisma.$transaction(async (tx) => {
  // 1. Descuenta stock INMEDIATAMENTE
  await tx.material.update({
    where: { id: materialId },
    data: { stockEventos: stockEventos - cantidad },
  });

  // 2. Crea movimiento de trazabilidad
  await tx.materialMovement.create({
    tipoMovimiento: "ASIGNACION_EVENTO",
    cantidad,
    inventarioOrigen: "EVENTOS",
    eventoId,
  });

  // 3. Crea asignación
  await tx.eventMaterial.create({ materialId, eventoId, cantidad });
});
```

**Frontend:**

- Usuario ve stock disponible REAL
- Al asignar, stock se descuenta inmediatamente
- Validación en tiempo real de stock disponible

### 2. Al Eliminar Asignación (Solo si evento NO ha iniciado)

**Backend:**

```javascript
// Validación de fecha
const now = new Date();
const eventStartDate = new Date(event.startDate);

if (eventStartDate <= now) {
  return {
    success: false,
    message: "Cannot remove materials from started events",
  };
}

// Transacción atómica
await prisma.$transaction(async (tx) => {
  // 1. REVIERTE el descuento
  await tx.material.update({
    where: { id: materialId },
    data: { stockEventos: stockEventos + cantidad },
  });

  // 2. Crea movimiento de reversión
  await tx.materialMovement.create({
    tipoMovimiento: "REVERSION_ASIGNACION",
    cantidad,
    inventarioDestino: "EVENTOS",
  });

  // 3. Elimina asignación
  await tx.eventMaterial.delete({ where: { id: assignmentId } });
});
```

**Frontend:**

- Si evento NO ha iniciado: botón eliminar activo
- Si evento YA inició: botón bloqueado (candado)
- Banner informativo cuando evento ha iniciado

### 3. Bloqueo por Fecha de Inicio

**Frontend (ambas pestañas):**

```javascript
const eventHasStarted = useMemo(() => {
  if (!event?.startDate) return false;
  const now = new Date();
  const startDate = new Date(event.startDate);
  return startDate <= now;
}, [event]);

// UI condicional
{
  eventHasStarted && (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <Lock /> Evento iniciado - Materiales bloqueados
    </div>
  );
}

{
  !eventHasStarted && <button onClick={handleAdd}>Agregar Material</button>;
}
```

## Ventajas del Sistema

### ✅ Consistencia de Datos

- Stock siempre refleja la realidad física
- No hay discrepancias entre sistema y bodega
- Inventario físico coincide con sistema

### ✅ Simplicidad

- No depende de jobs ni procesos automáticos
- Lógica clara y directa
- Fácil de entender para usuarios

### ✅ Trazabilidad Completa

- Cada operación genera movimiento en historial
- Se puede auditar quién, cuándo y por qué
- Reversiones también quedan registradas

### ✅ Prevención de Errores

- Validación de stock en tiempo real
- No se pueden asignar más de lo disponible
- Bloqueo automático cuando evento inicia

### ✅ Flexibilidad Controlada

- Permite corregir errores antes de que inicie el evento
- Una vez iniciado, protege la integridad de datos
- Balance entre flexibilidad y control

## Tipos de Movimiento Agregados

Se agregaron nuevos tipos al enum `TipoMovimiento`:

```prisma
enum TipoMovimiento {
  Entrada                // Ingreso de stock
  Salida                 // Salida manual
  Baja                   // Baja por daño/pérdida
  TRANSFERENCIA          // Entre inventarios
  ASIGNACION_EVENTO      // Asignación a evento (descuento)
  REVERSION_ASIGNACION   // Reversión de asignación (devolución)
}
```

## Casos de Uso

### Caso 1: Planificación Normal

```
1. Usuario asigna 50 bebidas a Evento A (fecha futura)
   → Stock: 100 - 50 = 50 disponibles

2. Evento A se realiza exitosamente
   → Stock ya está correcto (50)
   → No requiere acción adicional
```

### Caso 2: Corrección de Error

```
1. Usuario asigna 50 bebidas por error
   → Stock: 100 - 50 = 50 disponibles

2. Usuario detecta error ANTES de que inicie evento
   → Elimina asignación
   → Stock: 50 + 50 = 100 disponibles ✅
```

### Caso 3: Evento Cancelado

```
1. Usuario asigna 50 bebidas a Evento A
   → Stock: 100 - 50 = 50 disponibles

2. Evento se cancela ANTES de iniciar
   → Usuario elimina asignación
   → Stock: 50 + 50 = 100 disponibles ✅

3. Si evento ya inició, NO se puede eliminar
   → Materiales ya fueron apartados físicamente
```

### Caso 4: Evento Ya Iniciado

```
1. Evento A inició hoy
   → Botón "Agregar Material" desaparece
   → Botones "Eliminar" se convierten en candados
   → Banner: "Evento iniciado - Materiales bloqueados"

2. Usuario no puede modificar materiales
   → Protege integridad de datos
   → Stock ya refleja la realidad física
```

## Comparación con Enfoque Anterior

### ❌ Enfoque Anterior (Reserva Temporal)

```
Al asignar:
├─ stockEventos: 100 (no cambia)
├─ stockEventosReservado: 50 (reserva)
└─ Disponible: 50 (calculado)

Problemas:
- Stock físico no coincide con sistema
- Depende de jobs para finalizar
- Puede haber inconsistencias
- Confuso para inventario físico
```

### ✅ Enfoque Actual (Descuento Inmediato)

```
Al asignar:
├─ stockEventos: 50 (descuenta inmediatamente)
└─ Disponible: 50 (real)

Ventajas:
- Stock físico = stock sistema
- No depende de jobs
- Siempre consistente
- Claro para inventario físico
```

## Migraciones Aplicadas

1. `20260304195831_add_event_movement_types`
   - Agrega tipos `ASIGNACION_EVENTO` y `REVERSION_ASIGNACION`

## Archivos Modificados

### Backend

- `src/modules/Materials/services/eventMaterialsConsumable.service.js`
  - `assignMaterial()`: Descuento inmediato + movimiento
  - `removeAssignment()`: Validación fecha + reversión + movimiento
  - Eliminado: `finalizeEvent()` (ya no necesario)

- `prisma/schema.prisma`
  - Enum `TipoMovimiento`: Nuevos valores agregados

### Frontend

- `DeliverableMaterialsTab.jsx`
  - Validación `eventHasStarted`
  - Banner de bloqueo
  - Botones condicionales

- `UsableMaterialsTab.jsx`
  - Validación `eventHasStarted`
  - Banner de bloqueo
  - Botones condicionales

## Próximos Pasos (Opcional)

- [ ] Dashboard de stock en tiempo real
- [ ] Alertas de stock bajo
- [ ] Reporte de materiales por evento
- [ ] Historial de reversiones
- [ ] Notificaciones cuando evento está por iniciar

## Notas Importantes

1. **Stock Eventos vs Stock Fundación:**
   - Stock Eventos: Se descuenta al asignar (consumibles)
   - Stock Fundación: Solo planificación, NO se descuenta (reutilizables)

2. **Donaciones:**
   - Materiales de donaciones están bloqueados (`bloqueado: true`)
   - No se pueden eliminar manualmente
   - Se cargan automáticamente desde donaciones verificadas

3. **Validación de Fecha:**
   - Se compara `event.startDate` con fecha actual
   - Si `startDate <= now` → evento iniciado → bloqueo
   - Validación en backend Y frontend (doble seguridad)

4. **Transacciones Atómicas:**
   - Todas las operaciones usan `prisma.$transaction`
   - Garantiza consistencia de datos
   - Si falla algo, se revierte todo
