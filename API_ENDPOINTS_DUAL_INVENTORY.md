# API Endpoints - Dual Inventory System

## 📋 Overview

This document describes all API endpoints for the dual inventory system (Foundation + Events).

**Base URL:** `http://localhost:3000/api/materials`

---

## 🏗️ Materials

### Get All Materials

```http
GET /materials
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `estado` (optional): Filter by status (Activo/Inactivo)
- `categoriaId` (optional): Filter by category ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Balón fútbol #5",
      "categoria": "Balones",
      "stockFundacion": 50,
      "stockEventos": 30,
      "stockTotal": 80,
      "estado": "Activo"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Get Material by ID

```http
GET /materials/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Balón fútbol #5",
    "categoria": "Balones",
    "stockFundacion": 50,
    "stockEventos": 30,
    "stockTotal": 80,
    "estado": "Activo",
    "category": {
      "id": 1,
      "nombre": "Balones"
    }
  }
}
```

---

## 📦 Movements

### Register Entry Movement

```http
POST /movements
```

**Request Body:**
```json
{
  "material_id": 1,
  "tipo_movimiento": "Entrada",
  "cantidad": 100,
  "inventario_destino": "FUNDACION",  // or "EVENTOS"
  "fecha_ingreso": "2026-02-23",
  "proveedor_id": 2,
  "observaciones": "Material for internal use"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Entrada movement registered successfully",
  "data": {
    "id": 1,
    "materialId": 1,
    "tipoMovimiento": "Entrada",
    "cantidad": 100,
    "inventarioDestino": "FUNDACION",
    "stockAnterior": 50,
    "stockNuevo": 150
  }
}
```

### Get All Movements

```http
GET /movements
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `materialId` (optional): Filter by material
- `tipo` (optional): Filter by type (entrada/salida)

---

## 🔄 Transfers

### Transfer Stock Between Inventories

```http
POST /materials/:id/transfer
```

**Request Body:**
```json
{
  "from": "EVENTOS",
  "to": "FUNDACION",
  "cantidad": 10,
  "observaciones": "Transfer for internal use"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully transferred 10 units from EVENTOS to FUNDACION",
  "data": {
    "id": 1,
    "nombre": "Balón fútbol #5",
    "stockFundacion": 60,
    "stockEventos": 20,
    "stockTotal": 80
  }
}
```

**Validations:**
- Source and destination must be different
- Sufficient stock in source inventory
- Material must be active

---

## 🎯 Event Materials

### Get Materials Assigned to Event

```http
GET /events/:eventoId/materials
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "materialId": 1,
      "eventoId": 5,
      "cantidad": 50,
      "fechaAsignacion": "2026-02-23T10:00:00Z",
      "observaciones": "Material for tournament",
      "material": {
        "id": 1,
        "nombre": "Balón fútbol #5",
        "categoria": "Balones",
        "stockFundacion": 50,
        "stockEventos": 30
      }
    }
  ]
}
```

### Assign Material to Event

```http
POST /events/:eventoId/materials
```

**Request Body:**
```json
{
  "material_id": 1,
  "cantidad": 50,
  "observaciones": "Material for tournament"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully assigned 50 units of \"Balón fútbol #5\" to event",
  "data": {
    "id": 1,
    "materialId": 1,
    "eventoId": 5,
    "cantidad": 50,
    "fechaAsignacion": "2026-02-23T10:00:00Z",
    "material": {
      "id": 1,
      "nombre": "Balón fútbol #5",
      "stockFundacion": 50,
      "stockEventos": 30
    }
  }
}
```

**Important:**
- Stock is deducted IMMEDIATELY from `stock_eventos`
- No reservation states - direct deduction
- Validates sufficient stock in EVENTOS inventory

### Remove Material Assignment

```http
DELETE /events/:eventoId/materials/:assignmentId
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully removed assignment and returned 50 units to stock"
}
```

**Important:**
- Returns stock to `stock_eventos`
- Creates reversal movement record
- Deletes assignment record

---

## 📉 Discharges

### Register Material Discharge

```http
POST /materials/:id/discharge
```

**Request Body:**
```json
{
  "cantidad": 5,
  "tipo_baja": "Daño o Deterioro",
  "descripcion": "Materials damaged during training",
  "inventario_origen": "FUNDACION"  // optional, defaults to FUNDACION
}
```

**Response:**
```json
{
  "success": true,
  "message": "Discharge registered successfully. 5 unit(s) of \"Balón fútbol #5\" discharged.",
  "data": {
    "id": 1,
    "nombre": "Balón fútbol #5",
    "stockFundacion": 45,
    "stockEventos": 30,
    "stockTotal": 75
  }
}
```

**Discharge Types:**
- `Daño o Deterioro`
- `Pérdida`
- `Robo`
- `Ajuste de Inventario`
- `Otro`

---

## 🔑 Key Concepts

### Inventory Types

1. **FUNDACION**: Internal use inventory (day-to-day operations)
2. **EVENTOS**: Events inventory (materials that will be used/given in events)

### Movement Flow

```
1. Entry → Choose destination (FUNDACION or EVENTOS)
   ↓
2. Stock increases in chosen inventory
   ↓
3. Can transfer between inventories if needed
   ↓
4. Assign to event → Deducts from EVENTOS immediately
   ↓
5. Material exits definitively (no returns)
```

### Important Rules

✅ **DO:**
- Always specify `inventario_destino` when registering entries
- Transfer between inventories when needed
- Assign to events only from EVENTOS inventory
- Validate stock before operations

❌ **DON'T:**
- Don't use virtual reservations
- Don't expect material returns from events
- Don't edit discharges or exits
- Don't calculate `stockReservado` (no longer exists)

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Insufficient stock in EVENTOS. Available: 20, Requested: 30"
}
```

### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Material not found"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "User not authenticated"
}
```

---

## 📊 Frontend Integration Examples

### Display Material Stock

```javascript
// Material object from API
const material = {
  id: 1,
  nombre: "Balón fútbol #5",
  stockFundacion: 50,
  stockEventos: 30,
  stockTotal: 80
};

// Display in table
<tr>
  <td>{material.nombre}</td>
  <td>{material.stockFundacion}</td>
  <td>{material.stockEventos}</td>
  <td>{material.stockTotal}</td>
</tr>
```

### Register Entry

```javascript
const registerEntry = async (data) => {
  const response = await fetch('/api/materials/movements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      material_id: data.materialId,
      tipo_movimiento: 'Entrada',
      cantidad: data.cantidad,
      inventario_destino: data.inventoryType, // 'FUNDACION' or 'EVENTOS'
      fecha_ingreso: data.date,
      proveedor_id: data.providerId,
      observaciones: data.observations
    })
  });
  
  return await response.json();
};
```

### Transfer Stock

```javascript
const transferStock = async (materialId, data) => {
  const response = await fetch(`/api/materials/materials/${materialId}/transfer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      from: data.from,        // 'FUNDACION' or 'EVENTOS'
      to: data.to,            // 'FUNDACION' or 'EVENTOS'
      cantidad: data.cantidad,
      observaciones: data.observaciones
    })
  });
  
  return await response.json();
};
```

### Assign to Event

```javascript
const assignToEvent = async (eventoId, data) => {
  const response = await fetch(`/api/materials/events/${eventoId}/materials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      material_id: data.materialId,
      cantidad: data.cantidad,
      observaciones: data.observaciones
    })
  });
  
  return await response.json();
};
```

---

**Last Updated:** 2026-02-23  
**Version:** 2.0.0 (Dual Inventory System)
