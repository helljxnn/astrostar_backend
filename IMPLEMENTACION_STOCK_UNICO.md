# Implementación del Sistema de Stock Único con Asignaciones a Eventos

## Fecha: 23 de febrero de 2026

## Resumen de Cambios

Se ha implementado exitosamente el nuevo modelo de gestión de materiales deportivos según las especificaciones del profesor:

### Concepto Principal:
- **Stock único** en la base de datos (una sola columna `stock`)
- **Asignaciones a eventos** son "reservas virtuales" que NO bajan el stock
- El stock solo se descuenta cuando se **finaliza manualmente el evento**

---

## Cambios en Base de Datos

### 1. Tabla `materials`
**ANTES:**
```sql
stockDisponible INTEGER  -- Stock para uso interno
stockEventos INTEGER     -- Stock para eventos
```

**AHORA:**
```sql
stock INTEGER  -- Stock total único
```

### 2. Nueva Tabla `event_material_assignments`
```sql
CREATE TABLE event_material_assignments (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL,
  evento_id INTEGER NOT NULL,
  cantidad_asignada INTEGER NOT NULL,
  cantidad_usada INTEGER DEFAULT 0,
  cantidad_devuelta INTEGER DEFAULT 0,
  estado EventAssignmentStatus DEFAULT 'RESERVADO',
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  fecha_finalizacion TIMESTAMP,
  observaciones TEXT,
  created_by INTEGER NOT NULL,
  created_by_name VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Estados de asignación:**
- `RESERVADO`: Material asignado al evento (NO baja del stock)
- `USADO`: Evento finalizado, stock descontado
- `DEVUELTO`: Material devuelto sin usar
- `CANCELADO`: Asignación cancelada

### 3. Tabla `material_movements`
**Nuevos campos:**
- `destino_stock`: Indica si el ingreso es para USO_INTERNO o EVENTOS (solo informativo)
- `tipo_baja`: Tipo de baja del material
- `fecha_ingreso`: Fecha del ingreso
- `proveedor_id`: Proveedor del material

---

## Flujo de Operaciones

### 1. Ingreso de Materiales
```javascript
POST /api/materials/movements
{
  "material_id": 1,
  "tipo_movimiento": "Entrada",
  "cantidad": 100,
  "destinoStock": "EVENTOS",  // o "USO_INTERNO"
  "evento_id": 5,             // Solo si destinoStock es EVENTOS
  "fechaIngreso": "2026-02-23",
  "proveedor_id": 2,
  "observaciones": "Material para torneo"
}
```

**Resultado:**
- Se suma al `stock` único: `stock += 100`
- Si `destinoStock === 'EVENTOS'`, se crea una asignación en `event_material_assignments` con estado `RESERVADO`
- El stock NO baja, solo se marca como "reservado"

### 2. Consultar Materiales
```javascript
GET /api/materials/materials
```

**Respuesta:**
```json
{
  "id": 1,
  "nombre": "Balón fútbol #5",
  "stock": 100,              // Stock total en BD
  "stockReservado": 50,      // Calculado desde asignaciones RESERVADO
  "stockDisponible": 50,     // Calculado: stock - stockReservado
  "estado": "Activo"
}
```

### 3. Finalizar Evento
```javascript
POST /api/materials/events/5/finalize
{
  "materiales": [
    {
      "material_id": 1,
      "cantidad_usada": 40,      // Se descuenta del stock
      "cantidad_devuelta": 10,   // NO se descuenta
      "observaciones": "10 balones devueltos en buen estado"
    }
  ]
}
```

**Resultado:**
- Actualiza asignación: `estado = 'USADO'`, `cantidad_usada = 40`, `cantidad_devuelta = 10`
- Descuenta del stock: `stock -= 40` (solo lo usado)
- Crea movimiento de salida por 40 unidades
- Los 10 devueltos quedan disponibles automáticamente

### 4. Consultar Asignaciones de un Evento
```javascript
GET /api/materials/events/5/assignments
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "materialId": 1,
    "eventoId": 5,
    "cantidadAsignada": 50,
    "cantidadUsada": 40,
    "cantidadDevuelta": 10,
    "estado": "USADO",
    "fechaAsignacion": "2026-02-20T10:00:00Z",
    "fechaFinalizacion": "2026-02-23T18:00:00Z",
    "material": {
      "id": 1,
      "nombre": "Balón fútbol #5",
      "categoria": "Balones",
      "stock": 60
    }
  }
]
```

### 5. Cancelar Asignación
```javascript
PATCH /api/materials/assignments/1/cancel
{
  "observaciones": "Evento cancelado"
}
```

**Resultado:**
- Cambia estado a `CANCELADO`
- El stock reservado se libera automáticamente

---

## Archivos Modificados

### Backend:

#### Migraciones:
- ✅ `prisma/migrations/20260223000000_unify_stock_and_event_assignments/migration.sql`

#### Schema:
- ✅ `prisma/schema.prisma` - Agregados modelos Material, MaterialCategory, MaterialMovement, EventMaterialAssignment

#### Repositorios:
- ✅ `src/modules/Materials/repository/materials.repository.js` - Actualizado para stock único
- ✅ `src/modules/Materials/repository/movements.repository.js` - Actualizado para stock único
- ✅ `src/modules/Materials/repository/eventAssignments.repository.js` - NUEVO

#### Servicios:
- ✅ `src/modules/Materials/services/materials.service.js` - Actualizado
- ✅ `src/modules/Materials/services/movements.service.js` - Actualizado
- ✅ `src/modules/Materials/services/eventAssignments.service.js` - NUEVO

#### Controladores:
- ✅ `src/modules/Materials/controllers/materials.controller.js` - Sin cambios necesarios
- ✅ `src/modules/Materials/controllers/movements.controller.js` - Sin cambios necesarios
- ✅ `src/modules/Materials/controllers/eventAssignments.controller.js` - NUEVO

#### Rutas:
- ✅ `src/modules/Materials/routes/eventAssignments.routes.js` - NUEVO
- ✅ `src/modules/Materials/routes/index.js` - Actualizado

---

## Endpoints Nuevos

### Asignaciones a Eventos:

1. **GET** `/api/materials/events/:eventoId/assignments`
   - Obtener asignaciones de materiales de un evento

2. **POST** `/api/materials/events/:eventoId/finalize`
   - Finalizar evento y descontar materiales usados del stock

3. **PATCH** `/api/materials/assignments/:id/cancel`
   - Cancelar asignación de material a evento

---

## Validaciones Implementadas

### Al Asignar Materiales a Evento:
```javascript
const stockDisponible = material.stock - stockReservado;
if (cantidad > stockDisponible) {
  throw new Error(`Stock insuficiente. Disponible: ${stockDisponible}`);
}
```

### Al Finalizar Evento:
```javascript
// Validar que las cantidades coincidan
if (cantidadUsada + cantidadDevuelta > cantidadAsignada) {
  throw new Error('Las cantidades no coinciden con la asignación');
}

// Validar stock suficiente
if (material.stock < cantidadUsada) {
  throw new Error('Stock insuficiente para registrar el uso');
}
```

---

## Ejemplos de Uso Completo

### Escenario 1: Ingreso para Uso Interno
```javascript
// 1. Ingresar 100 balones
POST /api/materials/movements
{
  "material_id": 1,
  "tipo_movimiento": "Entrada",
  "cantidad": 100,
  "destinoStock": "USO_INTERNO",
  "fechaIngreso": "2026-02-23",
  "proveedor_id": 2
}

// Resultado en BD:
// materials.stock = 100
// No se crea asignación

// 2. Consultar material
GET /api/materials/materials/1
// Respuesta:
{
  "stock": 100,
  "stockReservado": 0,
  "stockDisponible": 100
}
```

### Escenario 2: Ingreso para Evento
```javascript
// 1. Ingresar 50 conos para evento
POST /api/materials/movements
{
  "material_id": 2,
  "tipo_movimiento": "Entrada",
  "cantidad": 50,
  "destinoStock": "EVENTOS",
  "evento_id": 5,
  "fechaIngreso": "2026-02-23"
}

// Resultado en BD:
// materials.stock = 50
// event_material_assignments: { materialId: 2, eventoId: 5, cantidadAsignada: 50, estado: 'RESERVADO' }

// 2. Consultar material
GET /api/materials/materials/2
// Respuesta:
{
  "stock": 50,
  "stockReservado": 50,  // Calculado desde asignaciones
  "stockDisponible": 0
}

// 3. Finalizar evento
POST /api/materials/events/5/finalize
{
  "materiales": [
    {
      "material_id": 2,
      "cantidad_usada": 40,
      "cantidad_devuelta": 10
    }
  ]
}

// Resultado en BD:
// materials.stock = 10 (50 - 40)
// event_material_assignments.estado = 'USADO'
// event_material_assignments.cantidadUsada = 40
// event_material_assignments.cantidadDevuelta = 10

// 4. Consultar material después de finalizar
GET /api/materials/materials/2
// Respuesta:
{
  "stock": 10,
  "stockReservado": 0,   // Ya no está reservado
  "stockDisponible": 10
}
```

### Escenario 3: Validación de Stock Insuficiente
```javascript
// Material tiene: stock = 100, stockReservado = 80, stockDisponible = 20

// Intentar asignar 30 a un evento
POST /api/materials/movements
{
  "material_id": 1,
  "tipo_movimiento": "Entrada",
  "cantidad": 30,
  "destinoStock": "EVENTOS",
  "evento_id": 6
}

// Respuesta:
{
  "success": false,
  "message": "Stock insuficiente. Disponible: 20, Solicitado: 30"
}
```

---

## Migración de Datos

La migración SQL automáticamente:
1. Convierte `stock_disponible + stock_eventos` → `stock`
2. Elimina columnas antiguas
3. Crea tabla `event_material_assignments`
4. Preserva todos los movimientos históricos

---

## Próximos Pasos (Opcional)

1. **Frontend**: Actualizar componentes para usar el nuevo modelo
2. **Reportes**: Agregar reportes de materiales por evento
3. **Notificaciones**: Alertar cuando stock disponible sea bajo
4. **Historial**: Mostrar historial de asignaciones por material

---

## Notas Importantes

⚠️ **Cambios Breaking:**
- Los campos `stockDisponible` y `stockEventos` ya NO existen en la BD
- Ahora se usa `stock` (único) y `stockReservado` (calculado)

✅ **Compatibilidad:**
- Todos los movimientos históricos se preservan
- El frontend debe calcular `stockDisponible = stock - stockReservado`

🔒 **Seguridad:**
- Todas las operaciones son transacciones atómicas
- Validaciones de stock en cada operación
- No se puede finalizar evento con cantidades incorrectas

---

## Estado de Implementación

✅ **COMPLETADO** - Backend implementado y probado
⏳ **PENDIENTE** - Actualización del frontend (ya implementado previamente)
⏳ **PENDIENTE** - Pruebas de integración completas

---

**Implementado por:** Kiro AI Assistant  
**Fecha:** 23 de febrero de 2026  
**Versión:** 1.0.0
