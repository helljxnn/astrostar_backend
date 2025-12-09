# 📋 Sistema de Matrículas con Vencimiento Automático

## ✅ Implementación Completada

---

## 🎯 Requisitos Implementados

### Estados

**Deportista:**
- ✅ Activo
- ✅ Inactivo (con razón de inactividad)

**Matrícula:**
- ✅ Vigente
- ✅ Vencida

### Lógica de Negocio

1. ✅ **Al crear matrícula:**
   - Deportista → Estado: Activo
   - Matrícula → Estado: Vigente
   - Fecha de vencimiento → 1 año después de fecha de inicio

2. ✅ **Después de 1 año (automático):**
   - Matrícula → Estado: Vencida
   - Deportista → Estado: Inactivo
   - Razón → "Inactiva por vencimiento de matrícula"

3. ✅ **Renovación de matrícula:**
   - Crea nueva matrícula vigente
   - Reactiva deportista
   - Nueva fecha de vencimiento a 1 año

---

## 🗄️ Cambios en Base de Datos

### Tabla `enrollments`

**Campos Nuevos:**
```sql
fechaInicio       TIMESTAMP    -- Fecha de inicio de la matrícula
fechaVencimiento  TIMESTAMP    -- Fecha de vencimiento (1 año después)
```

**Índices Agregados:**
```sql
CREATE INDEX idx_enrollments_fechaVencimiento ON enrollments(fechaVencimiento);
```

### Tabla `athletes`

**Campos Nuevos:**
```sql
inactivityReason  VARCHAR(200)  -- Razón de inactividad (nullable)
```

---

## 🔌 Endpoints Nuevos

### 1. Procesar Matrículas Vencidas (Manual)

**Endpoint:** `POST /api/enrollments/process-expired`

**Descripción:** Procesa manualmente todas las matrículas vencidas

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Procesadas 3 matrículas vencidas",
  "data": {
    "processed": 3,
    "errors": 0,
    "details": [
      {
        "enrollmentId": 1,
        "athleteId": 5,
        "athleteName": "María García",
        "fechaVencimiento": "2023-12-01T00:00:00.000Z",
        "status": "processed"
      }
    ]
  }
}
```

### 2. Renovar Matrícula

**Endpoint:** `POST /api/enrollments/renew/:athleteId`

**Descripción:** Renueva la matrícula de un deportista inactivo

**Headers:**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Request Body (opcional):**
```json
{
  "fechaInicio": "2024-12-08",
  "observaciones": "Renovación de matrícula",
  "comprobantePago": "url_del_comprobante"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Matrícula renovada exitosamente. Deportista reactivado.",
  "data": {
    "enrollment": {
      "id": 10,
      "athleteId": 5,
      "fechaInicio": "2024-12-08T00:00:00.000Z",
      "fechaVencimiento": "2025-12-08T00:00:00.000Z",
      "estado": "Vigente"
    },
    "athlete": {
      "id": 5,
      "status": "Active",
      "inactivityReason": null
    }
  }
}
```

---

## ⚙️ Proceso Automático (Cron Job)

### Configuración

**Frecuencia:** Diario a las 00:00 (medianoche)

**Archivo:** `src/jobs/enrollmentExpirationJob.js`

**Inicio Automático:** Se inicia al arrancar el servidor

### Logs del Job

```
🕐 [CRON] Iniciando verificación de matrículas vencidas...
📅 Fecha: 2024-12-08T00:00:00.000Z
🔍 Encontradas 2 matrículas vencidas
✅ Procesada matrícula 1 - Deportista: María García
✅ Procesada matrícula 2 - Deportista: Juan Pérez
✅ [CRON] Verificación completada:
   - Matrículas procesadas: 2
   - Errores: 0
```

### Ejecución Manual del Job

```javascript
import { runEnrollmentExpirationCheck } from './src/jobs/enrollmentExpirationJob.js';

// Ejecutar manualmente
const result = await runEnrollmentExpirationCheck();
```

---

## 📊 Flujo Completo

### Crear Matrícula

```
Usuario crea matrícula
    ↓
Sistema crea deportista (Estado: Activo)
    ↓
Sistema crea matrícula (Estado: Vigente)
    ↓
Sistema calcula fecha de vencimiento (+ 1 año)
    ↓
✅ Deportista activo con matrícula vigente
```

### Vencimiento Automático

```
Cron Job se ejecuta diariamente (00:00)
    ↓
Busca matrículas vigentes con fecha vencida
    ↓
Para cada matrícula vencida:
    ├─ Actualiza matrícula → Estado: Vencida
    └─ Actualiza deportista → Estado: Inactivo
                            → Razón: "Inactiva por vencimiento de matrícula"
    ↓
✅ Deportistas inactivos por vencimiento
```

### Renovación

```
Usuario renueva matrícula de deportista inactivo
    ↓
Sistema crea nueva matrícula (Estado: Vigente)
    ↓
Sistema calcula nueva fecha de vencimiento (+ 1 año)
    ↓
Sistema reactiva deportista (Estado: Activo, Razón: null)
    ↓
✅ Deportista reactivado con nueva matrícula
```

---

## 🧪 Pruebas

### Script de Prueba

**Archivo:** `scripts/test-enrollment-expiration.js`

**Ejecutar:**
```bash
node scripts/test-enrollment-expiration.js
```

**Qué hace:**
1. Verifica estructura de BD
2. Crea matrícula de prueba vencida
3. Ejecuta proceso de vencimiento
4. Verifica cambios
5. Limpia datos de prueba

### Prueba Manual

1. **Crear matrícula:**
```bash
POST /api/enrollments
{
  "athlete": { ... },
  "enrollment": { ... }
}
```

2. **Verificar fechas:**
```bash
GET /api/enrollments/:id
```

3. **Procesar vencimientos:**
```bash
POST /api/enrollments/process-expired
```

4. **Renovar matrícula:**
```bash
POST /api/enrollments/renew/:athleteId
```

---

## 📱 Integración Frontend

### Mostrar Estado de Matrícula

```javascript
// En la tabla de matrículas
{enrollment.estado === 'Vigente' ? (
  <Badge color="success">Vigente</Badge>
) : (
  <Badge color="danger">Vencida</Badge>
)}

// Mostrar fecha de vencimiento
<span>
  Vence: {new Date(enrollment.fechaVencimiento).toLocaleDateString()}
</span>
```

### Mostrar Estado de Deportista

```javascript
// En el modal de ver deportista
{athlete.status === 'Active' ? (
  <Badge color="success">Activo</Badge>
) : (
  <div>
    <Badge color="danger">Inactivo</Badge>
    {athlete.inactivityReason && (
      <p className="text-muted mt-2">
        <small>{athlete.inactivityReason}</small>
      </p>
    )}
  </div>
)}
```

### Botón de Renovación

```javascript
// Mostrar solo si deportista está inactivo por vencimiento
{athlete.status === 'Inactive' && 
 athlete.inactivityReason?.includes('vencimiento') && (
  <Button 
    color="primary"
    onClick={() => handleRenewEnrollment(athlete.id)}
  >
    Renovar Matrícula
  </Button>
)}
```

---

## 🔒 Validaciones Implementadas

1. ✅ **Al crear matrícula:**
   - Deportista siempre se crea Activo
   - Matrícula siempre se crea Vigente
   - Fecha de vencimiento se calcula automáticamente

2. ✅ **Al procesar vencimientos:**
   - Solo procesa matrículas Vigentes
   - Solo procesa si fecha de vencimiento <= hoy
   - Actualiza ambos (matrícula y deportista) en transacción

3. ✅ **Al renovar:**
   - Verifica que deportista existe
   - Crea nueva matrícula (no modifica la anterior)
   - Reactiva deportista automáticamente

---

## 📝 Notas Importantes

1. **Historial de Matrículas:**
   - Cada renovación crea una NUEVA matrícula
   - Las matrículas vencidas NO se eliminan
   - Se mantiene historial completo

2. **Múltiples Matrículas:**
   - Un deportista puede tener múltiples matrículas (historial)
   - Solo UNA puede estar Vigente a la vez
   - Las demás estarán Vencidas

3. **Cron Job:**
   - Se ejecuta automáticamente al iniciar el servidor
   - Se ejecuta diariamente a las 00:00
   - También se puede ejecutar manualmente vía endpoint

4. **Transacciones:**
   - Todos los procesos usan transacciones de Prisma
   - Si algo falla, se hace rollback automático
   - Garantiza consistencia de datos

---

## 🚀 Próximos Pasos (Futuro)

### Pagos Mensuales (Pendiente)

Cuando se implemente:

```prisma
model MonthlyPayment {
  id               Int            @id @default(autoincrement())
  enrollmentId     Int
  month            Int            // 1-12
  year             Int
  amount           Decimal
  status           PaymentStatus  @default(Pending)
  dueDate          DateTime
  paidDate         DateTime?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  enrollment       Enrollment     @relation(fields: [enrollmentId], references: [id])
}

enum PaymentStatus {
  Pending
  Paid
  Overdue
}
```

---

## ✅ Checklist de Implementación

- [x] Actualizar schema de Prisma
- [x] Migrar base de datos
- [x] Actualizar servicio de matrículas
- [x] Agregar lógica de vencimiento automático
- [x] Agregar lógica de renovación
- [x] Crear job de cron
- [x] Actualizar controladores
- [x] Actualizar rutas
- [x] Actualizar repositorio
- [x] Crear scripts de prueba
- [x] Documentar sistema
- [ ] Actualizar frontend (pendiente)
- [ ] Probar en producción

---

**Fecha de Implementación:** Diciembre 8, 2024  
**Versión:** 1.0  
**Estado:** ✅ Backend Completado - Frontend Pendiente
