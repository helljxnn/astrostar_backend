# API de Materiales para Eventos

## Descripción General

Este módulo conecta eventos con materiales deportivos, diferenciando entre:

1. **Materiales Consumibles** (a entregar): Se descuentan del stock de eventos
2. **Materiales Reutilizables** (a usar): Solo planificación, sin descuento de stock

## Flujo de Trabajo

### Materiales Consumibles (a entregar)

1. Al abrir el modal de materiales, se cargan automáticamente las donaciones asignadas al evento
2. Las donaciones aparecen bloqueadas (no se pueden eliminar)
3. Se pueden agregar otros materiales consumibles manualmente
4. Al confirmar, se reserva el stock (incrementa `stockEventosReservado`)
5. Al finalizar el evento, se descuenta el stock real y se crean movimientos

### Materiales Reutilizables (a usar)

1. Se seleccionan materiales marcados como reutilizables
2. El sistema valida disponibilidad por fecha (no solapamiento con otros eventos)
3. Si hay conflicto, muestra los eventos que ya usan ese material
4. No se descuenta stock, solo se registra la planificación

## Endpoints

### Materiales Consumibles

#### GET /api/materials/events/:eventoId/consumables

Obtiene los materiales consumibles asignados a un evento (incluyendo donaciones).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "materialId": 5,
      "eventoId": 10,
      "cantidad": 50,
      "tipo": "CONSUMIBLE",
      "bloqueado": true,
      "donacionId": 3,
      "observaciones": "Donación DON-2026-001",
      "material": {
        "id": 5,
        "nombre": "Balones de fútbol",
        "categoria": "Deportivo",
        "stockEventos": 100
      },
      "donacion": {
        "id": 3,
        "code": "DON-2026-001",
        "donorSponsor": {
          "id": 2,
          "name": "Fundación XYZ"
        }
      }
    }
  ]
}
```

#### POST /api/materials/events/:eventoId/consumables/load-donations

Carga automáticamente las donaciones asignadas al evento como materiales consumibles bloqueados.

**Response:**

```json
{
  "success": true,
  "data": [...],
  "message": "Successfully loaded 3 donation materials"
}
```

#### POST /api/materials/events/:eventoId/consumables

Asigna un material consumible al evento manualmente.

**Request Body:**

```json
{
  "material_id": 5,
  "cantidad": 20,
  "observaciones": "Material adicional para el torneo"
}
```

**Response:**

```json
{
  "success": true,
  "data": {...},
  "message": "Successfully assigned 20 units of \"Balones de fútbol\""
}
```

#### DELETE /api/materials/events/consumables/:assignmentId

Elimina una asignación de material consumible (solo si no está bloqueado por donación).

**Response:**

```json
{
  "success": true,
  "message": "Successfully removed 20 units"
}
```

#### POST /api/materials/events/:eventoId/finalize-consumables

Finaliza el evento y descuenta el stock real de materiales consumibles.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "materialId": 5,
      "materialNombre": "Balones de fútbol",
      "cantidad": 50,
      "stockAnterior": 100,
      "stockNuevo": 50
    }
  ],
  "message": "Successfully deducted 1 consumable material(s)"
}
```

### Materiales Reutilizables

#### GET /api/materials/events/:eventoId/reusables

Obtiene los materiales reutilizables asignados a un evento.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "materialId": 8,
      "eventoId": 10,
      "cantidad": 5,
      "observaciones": "Mesas para registro",
      "material": {
        "id": 8,
        "nombre": "Mesas plegables",
        "categoria": "Mobiliario",
        "stockFundacion": 20,
        "esReutilizable": true
      }
    }
  ]
}
```

#### POST /api/materials/events/:eventoId/reusables

Asigna un material reutilizable al evento (solo planificación).

**Request Body:**

```json
{
  "material_id": 8,
  "cantidad": 5,
  "observaciones": "Mesas para registro"
}
```

**Response (éxito):**

```json
{
  "success": true,
  "data": {...},
  "message": "Successfully planned 5 units of \"Mesas plegables\" for event"
}
```

**Response (conflicto):**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Material not available for these dates. Available: 2, Requested: 5",
  "conflictingEvents": [
    {
      "id": 12,
      "name": "Torneo Regional",
      "startDate": "2026-03-05T00:00:00.000Z",
      "endDate": "2026-03-07T00:00:00.000Z",
      "cantidad": 3
    }
  ]
}
```

#### DELETE /api/materials/events/reusables/:assignmentId

Elimina una asignación de material reutilizable.

**Response:**

```json
{
  "success": true,
  "message": "Successfully removed 5 units"
}
```

#### GET /api/materials/reusables/:materialId/availability

Verifica la disponibilidad de un material reutilizable para un rango de fechas.

**Query Parameters:**

- `startDate`: Fecha de inicio (ISO 8601)
- `endDate`: Fecha de fin (ISO 8601)
- `excludeEventoId` (opcional): ID del evento a excluir de la validación

**Response:**

```json
{
  "success": true,
  "data": {
    "available": true,
    "message": "Material is available"
  }
}
```

## Modelos de Base de Datos

### EventMaterial (Consumibles)

```prisma
model EventMaterial {
  id              Int               @id @default(autoincrement())
  materialId      Int
  eventoId        Int
  cantidad        Int
  tipo            EventMaterialType @default(CONSUMIBLE)
  donacionId      Int?              // Si viene de donación
  bloqueado       Boolean           @default(false) // true si es donación
  observaciones   String?
  createdBy       Int
  createdByName   String?
  fechaAsignacion DateTime          @default(now())

  material        Material
  evento          Service
  donacion        Donation?
}
```

### EventMaterialReusable (Reutilizables)

```prisma
model EventMaterialReusable {
  id              Int      @id @default(autoincrement())
  materialId      Int
  eventoId        Int
  cantidad        Int
  observaciones   String?
  createdBy       Int
  createdByName   String?
  fechaAsignacion DateTime @default(now())

  material        Material
  evento          Service
}
```

### Material (actualizado)

```prisma
model Material {
  // ... campos existentes
  esReutilizable        Boolean  @default(false)
  eventMaterials        EventMaterial[]
  eventMaterialsReusable EventMaterialReusable[]
}
```

## Reglas de Negocio

### Materiales Consumibles

1. Se reserva stock al asignar (`stockEventosReservado++`)
2. Se descuenta stock real al finalizar evento
3. Las donaciones se cargan automáticamente y no se pueden eliminar
4. Solo se pueden asignar materiales con stock disponible

### Materiales Reutilizables

1. No se descuenta stock en ningún momento
2. Se valida disponibilidad por fecha (no solapamiento)
3. Solo se pueden asignar materiales marcados como `esReutilizable = true`
4. El stock de fundación debe ser suficiente para todos los eventos en las mismas fechas

## Códigos de Error

- `404`: Material, evento o asignación no encontrada
- `400`: Validación fallida (stock insuficiente, material no disponible, etc.)
- `500`: Error interno del servidor

## Notas de Implementación

1. Todas las operaciones usan transacciones atómicas para garantizar consistencia
2. Los materiales de donación se identifican por `donacionId != null` y `bloqueado = true`
3. La validación de disponibilidad de reutilizables considera eventos con fechas solapadas
4. Al finalizar un evento, se crean movimientos de tipo `SALIDA_EVENTO` en `material_movements`
