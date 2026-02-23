# Guía de Pruebas - Sistema de Stock Único

## Preparación

1. Asegúrate de que el servidor esté corriendo:
```bash
npm run dev
```

2. Ten a mano un token de autenticación válido

---

## Prueba 1: Verificar Estructura de Materiales

### GET /api/materials/materials

**Request:**
```bash
GET http://localhost:3000/api/materials/materials
Authorization: Bearer {tu_token}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Material de prueba",
      "stock": 100,              // ✅ Stock único
      "stockReservado": 0,       // ✅ Calculado desde asignaciones
      "stockDisponible": 100,    // ✅ Calculado: stock - stockReservado
      "stockTotal": 100,         // ✅ Igual a stock
      "estado": "Activo"
    }
  ]
}
```

**Verificar:**
- ✅ Ya NO existen `stockDisponible` y `stockEventos` como campos de BD
- ✅ Ahora hay `stock` (único)
- ✅ `stockReservado` y `stockDisponible` son calculados

---

## Prueba 2: Ingreso de Material para Uso Interno

### POST /api/materials/movements

**Request:**
```bash
POST http://localhost:3000/api/materials/movements
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "material_id": 1,
  "tipo_movimiento": "Entrada",
  "cantidad": 50,
  "destinoStock": "USO_INTERNO",
  "fechaIngreso": "2026-02-23",
  "proveedor_id": 1,
  "observaciones": "Ingreso para uso interno"
}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Movimiento de entrada registrado exitosamente"
}
```

**Verificar en BD:**
```sql
SELECT stock FROM materials WHERE id = 1;
-- Debe mostrar: stock aumentado en 50

SELECT * FROM event_material_assignments WHERE material_id = 1;
-- NO debe haber asignación (porque es USO_INTERNO)
```

---

## Prueba 3: Ingreso de Material para Evento

### POST /api/materials/movements

**Request:**
```bash
POST http://localhost:3000/api/materials/movements
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "material_id": 1,
  "tipo_movimiento": "Entrada",
  "cantidad": 30,
  "destinoStock": "EVENTOS",
  "evento_id": 1,
  "fechaIngreso": "2026-02-23",
  "observaciones": "Material para torneo infantil"
}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Movimiento de entrada registrado exitosamente"
}
```

**Verificar en BD:**
```sql
-- 1. Stock aumentó
SELECT stock FROM materials WHERE id = 1;
-- Debe mostrar: stock aumentado en 30

-- 2. Se creó asignación
SELECT * FROM event_material_assignments 
WHERE material_id = 1 AND evento_id = 1;
-- Debe mostrar:
-- cantidad_asignada = 30
-- estado = 'RESERVADO'
-- cantidad_usada = 0
-- cantidad_devuelta = 0
```

**Verificar en API:**
```bash
GET http://localhost:3000/api/materials/materials/1
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "stock": 80,              // 50 (uso interno) + 30 (eventos)
    "stockReservado": 30,     // Calculado desde asignaciones RESERVADO
    "stockDisponible": 50,    // 80 - 30
    "stockTotal": 80
  }
}
```

---

## Prueba 4: Consultar Asignaciones de un Evento

### GET /api/materials/events/:eventoId/assignments

**Request:**
```bash
GET http://localhost:3000/api/materials/events/1/assignments
Authorization: Bearer {tu_token}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "materialId": 1,
      "eventoId": 1,
      "cantidadAsignada": 30,
      "cantidadUsada": 0,
      "cantidadDevuelta": 0,
      "estado": "RESERVADO",
      "fechaAsignacion": "2026-02-23T...",
      "material": {
        "id": 1,
        "nombre": "Material de prueba",
        "stock": 80
      }
    }
  ]
}
```

---

## Prueba 5: Finalizar Evento (Caso Exitoso)

### POST /api/materials/events/:eventoId/finalize

**Request:**
```bash
POST http://localhost:3000/api/materials/events/1/finalize
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "materiales": [
    {
      "material_id": 1,
      "cantidad_usada": 20,
      "cantidad_devuelta": 10,
      "observaciones": "10 unidades devueltas en buen estado"
    }
  ]
}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Evento finalizado exitosamente. Stock actualizado.",
  "data": [
    {
      "id": 1,
      "materialId": 1,
      "eventoId": 1,
      "cantidadAsignada": 30,
      "cantidadUsada": 20,
      "cantidadDevuelta": 10,
      "estado": "USADO",
      "fechaFinalizacion": "2026-02-23T..."
    }
  ]
}
```

**Verificar en BD:**
```sql
-- 1. Stock descontado solo lo usado
SELECT stock FROM materials WHERE id = 1;
-- Debe mostrar: 60 (80 - 20)

-- 2. Asignación actualizada
SELECT * FROM event_material_assignments WHERE id = 1;
-- Debe mostrar:
-- cantidad_usada = 20
-- cantidad_devuelta = 10
-- estado = 'USADO'
-- fecha_finalizacion = NOW()

-- 3. Movimiento de salida creado
SELECT * FROM material_movements 
WHERE material_id = 1 AND tipo_movimiento = 'Salida' 
ORDER BY fecha DESC LIMIT 1;
-- Debe mostrar:
-- cantidad = 20 (solo lo usado)
-- destino = 'Evento'
-- evento_id = 1
```

**Verificar en API:**
```bash
GET http://localhost:3000/api/materials/materials/1
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "stock": 60,              // 80 - 20 (usado)
    "stockReservado": 0,      // Ya no hay reservas activas
    "stockDisponible": 60,    // Todo disponible
    "stockTotal": 60
  }
}
```

---

## Prueba 6: Validación - Cantidades No Coinciden

### POST /api/materials/events/:eventoId/finalize

**Request:**
```bash
POST http://localhost:3000/api/materials/events/1/finalize
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "materiales": [
    {
      "material_id": 1,
      "cantidad_usada": 25,
      "cantidad_devuelta": 10
    }
  ]
}
```

**Respuesta Esperada:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Las cantidades no coinciden para \"Material de prueba\". Asignado: 30, Usado + Devuelto: 35"
}
```

---

## Prueba 7: Validación - Stock Insuficiente al Asignar

**Escenario:** Material tiene stock = 100, stockReservado = 80, stockDisponible = 20

**Request:**
```bash
POST http://localhost:3000/api/materials/movements
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "material_id": 1,
  "tipo_movimiento": "Entrada",
  "cantidad": 30,
  "destinoStock": "EVENTOS",
  "evento_id": 2,
  "fechaIngreso": "2026-02-23"
}
```

**Respuesta Esperada:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Stock insuficiente. Disponible: 20, Solicitado: 30"
}
```

---

## Prueba 8: Cancelar Asignación

### PATCH /api/materials/assignments/:id/cancel

**Request:**
```bash
PATCH http://localhost:3000/api/materials/assignments/1/cancel
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "observaciones": "Evento cancelado por mal clima"
}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Asignación cancelada exitosamente",
  "data": {
    "id": 1,
    "estado": "CANCELADO",
    "observaciones": "Evento cancelado por mal clima"
  }
}
```

**Verificar:**
```bash
GET http://localhost:3000/api/materials/materials/1
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "data": {
    "stock": 100,
    "stockReservado": 0,      // ✅ Liberado automáticamente
    "stockDisponible": 100
  }
}
```

---

## Prueba 9: Baja de Material

### POST /api/materials/materials/:id/discharge

**Request:**
```bash
POST http://localhost:3000/api/materials/materials/1/discharge
Authorization: Bearer {tu_token}
Content-Type: application/json

{
  "cantidad": 5,
  "tipo_baja": "Daño o Deterioro",
  "descripcion": "Materiales dañados durante entrenamiento"
}
```

**Respuesta Esperada:**
```json
{
  "success": true,
  "message": "Baja registrada exitosamente. 5 unidad(es) de \"Material de prueba\" dada(s) de baja."
}
```

**Verificar en BD:**
```sql
-- Stock descontado
SELECT stock FROM materials WHERE id = 1;
-- Debe mostrar: stock - 5

-- Movimiento de baja creado
SELECT * FROM material_movements 
WHERE material_id = 1 AND tipo_movimiento = 'Baja' 
ORDER BY fecha DESC LIMIT 1;
-- Debe mostrar:
-- cantidad = 5
-- tipo_baja = 'DanoDeterioro'
```

---

## Checklist de Verificación

### Base de Datos:
- [ ] Tabla `materials` tiene columna `stock` (única)
- [ ] NO existen columnas `stockDisponible` ni `stockEventos`
- [ ] Tabla `event_material_assignments` existe
- [ ] Enum `EventAssignmentStatus` existe

### API - Materiales:
- [ ] GET /api/materials/materials retorna `stock`, `stockReservado`, `stockDisponible`
- [ ] POST /api/materials/movements con `destinoStock: "USO_INTERNO"` suma al stock
- [ ] POST /api/materials/movements con `destinoStock: "EVENTOS"` suma al stock Y crea asignación

### API - Asignaciones:
- [ ] GET /api/materials/events/:id/assignments retorna asignaciones del evento
- [ ] POST /api/materials/events/:id/finalize descuenta solo lo usado
- [ ] PATCH /api/materials/assignments/:id/cancel libera el stock reservado

### Validaciones:
- [ ] No se puede asignar más de lo disponible
- [ ] No se puede finalizar con cantidades incorrectas
- [ ] No se puede finalizar si no hay stock suficiente

---

## Comandos Útiles para Debugging

### Ver stock de un material:
```sql
SELECT id, nombre, stock FROM materials WHERE id = 1;
```

### Ver asignaciones activas:
```sql
SELECT * FROM event_material_assignments 
WHERE estado = 'RESERVADO';
```

### Calcular stock reservado manualmente:
```sql
SELECT material_id, SUM(cantidad_asignada) as stock_reservado
FROM event_material_assignments
WHERE estado = 'RESERVADO'
GROUP BY material_id;
```

### Ver últimos movimientos:
```sql
SELECT * FROM material_movements 
ORDER BY fecha DESC LIMIT 10;
```

---

## Problemas Comunes

### Error: "Column stockDisponible does not exist"
**Solución:** Regenerar cliente de Prisma
```bash
npx prisma generate
```

### Error: "Table event_material_assignments does not exist"
**Solución:** Aplicar migraciones
```bash
npx prisma migrate deploy
```

### Stock reservado no se calcula correctamente
**Solución:** Verificar que las asignaciones tengan estado 'RESERVADO'
```sql
SELECT * FROM event_material_assignments WHERE material_id = 1;
```

---

**Fecha:** 23 de febrero de 2026  
**Versión:** 1.0.0
