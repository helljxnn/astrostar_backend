# Resumen de Implementación: Conexión Eventos-Materiales

## ✅ Cambios Realizados en el Backend

### 1. Schema de Base de Datos (Prisma)

#### Nuevas Tablas:

- `event_materials_reusable`: Materiales reutilizables asignados a eventos

#### Tablas Modificadas:

- `materials`: Agregado campo `esReutilizable` (Boolean)
- `event_materials`: Agregados campos:
  - `tipo` (EventMaterialType: CONSUMIBLE | REUTILIZABLE)
  - `donacionId` (Int?, relación con Donation)
  - `bloqueado` (Boolean, true para donaciones)
  - Relación FK con `Service` (eventos)
  - Relación FK con `Donation`

- `Service`: Agregadas relaciones:
  - `eventMaterials` (EventMaterial[])
  - `eventMaterialsReusable` (EventMaterialReusable[])

- `Donation`: Agregada relación:
  - `eventMaterials` (EventMaterial[])

#### Nuevo Enum:

```prisma
enum EventMaterialType {
  CONSUMIBLE
  REUTILIZABLE
}
```

### 2. Servicios Creados

#### `eventMaterialsConsumable.service.js`

- `getByEvent()`: Obtener consumibles del evento
- `loadDonationMaterials()`: Cargar donaciones automáticamente
- `assignMaterial()`: Asignar consumible manualmente
- `removeAssignment()`: Eliminar asignación (solo si no es donación)
- `finalizeEvent()`: Descontar stock real al finalizar

#### `eventMaterialsReusable.service.js`

- `getByEvent()`: Obtener reutilizables del evento
- `assignMaterial()`: Asignar reutilizable con validación de disponibilidad
- `removeAssignment()`: Eliminar asignación
- `checkMaterialAvailability()`: Validar disponibilidad por fecha
- `getMaterialAvailability()`: Endpoint público de disponibilidad

### 3. Controladores Creados

- `eventMaterialsConsumable.controller.js`: Maneja requests de consumibles
- `eventMaterialsReusable.controller.js`: Maneja requests de reutilizables

### 4. Rutas API Creadas

#### Consumibles:

- `GET /api/materials/events/:eventoId/consumables`
- `POST /api/materials/events/:eventoId/consumables/load-donations`
- `POST /api/materials/events/:eventoId/consumables`
- `DELETE /api/materials/events/consumables/:assignmentId`
- `POST /api/materials/events/:eventoId/finalize-consumables`

#### Reutilizables:

- `GET /api/materials/events/:eventoId/reusables`
- `POST /api/materials/events/:eventoId/reusables`
- `DELETE /api/materials/events/reusables/:assignmentId`
- `GET /api/materials/reusables/:materialId/availability`

### 5. Migración de Base de Datos

✅ Aplicada exitosamente con script: `scripts/apply_event_materials_migration.js`

**Cambios aplicados:**

- Enum `EventMaterialType` creado
- Columna `es_reutilizable` agregada a `materials`
- Columnas `tipo`, `donacion_id`, `bloqueado` agregadas a `event_materials`
- Tabla `event_materials_reusable` creada
- Foreign keys agregadas
- Índices creados para optimización

**⚠️ IMPORTANTE:** La migración NO borró datos existentes. Todos los datos se preservaron.

## 📋 Flujo de Trabajo Implementado

### Materiales a Entregar (Consumibles)

1. **Carga Automática de Donaciones:**

   ```
   POST /api/materials/events/:eventoId/consumables/load-donations
   ```

   - Busca donaciones tipo ESPECIE asignadas al evento
   - Crea registros en `event_materials` con `bloqueado=true`
   - No se pueden eliminar (protegidos)

2. **Asignación Manual:**

   ```
   POST /api/materials/events/:eventoId/consumables
   Body: { material_id, cantidad, observaciones }
   ```

   - Valida stock disponible en `stockEventos`
   - Reserva stock (incrementa `stockEventosReservado`)
   - Permite eliminación posterior

3. **Finalización del Evento:**
   ```
   POST /api/materials/events/:eventoId/finalize-consumables
   ```

   - Descuenta stock real de `stockEventos`
   - Decrementa `stockEventosReservado`
   - Crea movimientos tipo `SALIDA_EVENTO`

### Materiales a Usar (Reutilizables)

1. **Asignación con Validación:**

   ```
   POST /api/materials/events/:eventoId/reusables
   Body: { material_id, cantidad, observaciones }
   ```

   - Valida que el material tenga `esReutilizable=true`
   - Verifica disponibilidad por fecha (no solapamiento)
   - Si hay conflicto, retorna eventos que usan el material
   - NO descuenta stock

2. **Verificación de Disponibilidad:**
   ```
   GET /api/materials/reusables/:materialId/availability?startDate=...&endDate=...
   ```

   - Calcula cantidad disponible considerando eventos solapados
   - Retorna lista de eventos en conflicto si los hay

## 🔄 Próximos Pasos (Frontend)

### 1. Crear Modal de Materiales

Componente: `EventMaterialsModal.jsx`

**Estructura:**

```jsx
<Modal>
  <Tabs>
    <Tab label="Materiales a Entregar">
      <ConsumableMaterialsTab
        eventoId={eventoId}
        onLoad={loadDonations}
        onAdd={addConsumable}
        onRemove={removeConsumable}
      />
    </Tab>
    <Tab label="Materiales a Usar">
      <ReusableMaterialsTab
        eventoId={eventoId}
        eventDates={{ startDate, endDate }}
        onAdd={addReusable}
        onRemove={removeReusable}
        onCheckAvailability={checkAvailability}
      />
    </Tab>
  </Tabs>
</Modal>
```

### 2. Pestaña de Consumibles

**Funcionalidades:**

- Botón "Cargar Donaciones" (ejecuta al abrir modal)
- Lista de materiales con indicador de "Donación" (bloqueados)
- Selector para agregar materiales manualmente
- Input de cantidad con validación de stock disponible
- Botón eliminar (deshabilitado para donaciones)

**API Calls:**

```javascript
// Cargar donaciones
POST /api/materials/events/${eventoId}/consumables/load-donations

// Listar consumibles
GET /api/materials/events/${eventoId}/consumables

// Agregar manual
POST /api/materials/events/${eventoId}/consumables
Body: { material_id, cantidad, observaciones }

// Eliminar
DELETE /api/materials/events/consumables/${assignmentId}
```

### 3. Pestaña de Reutilizables

**Funcionalidades:**

- Selector de materiales (filtrar por `esReutilizable=true`)
- Input de cantidad
- Validación en tiempo real de disponibilidad
- Mostrar eventos en conflicto si los hay
- Lista de materiales asignados

**API Calls:**

```javascript
// Verificar disponibilidad
GET /api/materials/reusables/${materialId}/availability?startDate=${start}&endDate=${end}

// Listar reutilizables
GET /api/materials/events/${eventoId}/reusables

// Agregar
POST /api/materials/events/${eventoId}/reusables
Body: { material_id, cantidad, observaciones }

// Eliminar
DELETE /api/materials/events/reusables/${assignmentId}
```

### 4. Botón en Lista de Eventos

Agregar botón "Materiales" en cada fila de la tabla de eventos:

```jsx
<IconButton
  onClick={() => openMaterialsModal(event.id)}
  title="Gestionar materiales"
>
  <InventoryIcon />
</IconButton>
```

### 5. Servicio Frontend

Crear: `src/features/dashboard/pages/Admin/pages/SportsMaterials/Materials/services/EventMaterialsService.js`

```javascript
class EventMaterialsService {
  // Consumibles
  async getConsumables(eventoId) { ... }
  async loadDonations(eventoId) { ... }
  async addConsumable(eventoId, data) { ... }
  async removeConsumable(assignmentId) { ... }

  // Reutilizables
  async getReusables(eventoId) { ... }
  async addReusable(eventoId, data) { ... }
  async removeReusable(assignmentId) { ... }
  async checkAvailability(materialId, startDate, endDate) { ... }
}
```

## 📝 Notas Importantes

1. **Donaciones Bloqueadas:** Los materiales de donación tienen `bloqueado=true` y NO se pueden eliminar desde el frontend.

2. **Validación de Stock:**
   - Consumibles: Valida `stockEventos - stockEventosReservado`
   - Reutilizables: Valida `stockFundacion` considerando eventos solapados

3. **Finalización de Eventos:** El descuento real de stock solo ocurre al finalizar el evento con el endpoint `/finalize-consumables`.

4. **Transacciones Atómicas:** Todas las operaciones críticas usan transacciones de Prisma para garantizar consistencia.

5. **Índices de BD:** Se crearon índices en columnas clave para optimizar consultas.

## 🧪 Testing

Para probar la implementación:

1. Crear un evento
2. Asignar una donación tipo ESPECIE al evento
3. Abrir modal de materiales
4. Verificar que las donaciones se cargan automáticamente
5. Intentar eliminar una donación (debe fallar)
6. Agregar materiales consumibles manualmente
7. Agregar materiales reutilizables
8. Verificar validación de disponibilidad con eventos solapados

## 📚 Documentación

- API completa: `Docs/API_MATERIALES_EVENTOS.md`
- Este resumen: `Docs/RESUMEN_IMPLEMENTACION_MATERIALES_EVENTOS.md`
