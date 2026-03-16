# GUÍA COMPLETA DEL MÓDULO DE GESTIÓN DE PAGOS

## 📋 ÍNDICE

1. [Arquitectura General](#arquitectura-general)
2. [Tipos de Obligaciones](#tipos-de-obligaciones)
3. [Sistema de Restricciones](#sistema-de-restricciones)
4. [Flujos de Usuario](#flujos-de-usuario)
5. [Endpoints Completos](#endpoints-completos)
6. [Cálculo de Mora](#cálculo-de-mora)
7. [Estados y Transiciones](#estados-y-transiciones)
8. [Filtros y Búsquedas](#filtros-y-búsquedas)
9. [Integración Frontend-Backend](#integración-frontend-backend)
10. [Casos de Uso Específicos](#casos-de-uso-específicos)

---

## 🏗️ ARQUITECTURA GENERAL

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    MÓDULO DE PAGOS                          │
├─────────────────────────────────────────────────────────────┤
│  Controllers  │  Services  │  Repository  │  Middleware     │
│  ├─payments   │  ├─payments│  ├─payments  │  ├─restrictions │
│  └─settings   │  └─settings│  └─settings  │  └─access      │
├─────────────────────────────────────────────────────────────┤
│                    BASE DE DATOS                            │
│  ┌─PaymentObligation─┐  ┌─Payment─┐  ┌─Enrollment─┐        │
│  │ id, athleteId     │  │ id      │  │ id, estado │        │
│  │ type, period      │  │ status  │  │ fechas     │        │
│  │ baseAmount        │  │ receipt │  └────────────┘        │
│  │ dueStart, dueEnd  │  └─────────┘                        │
│  └───────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

### Constantes del Negocio

```javascript
const BUSINESS_CONSTANTS = {
  LATE_FEE_DAILY: 2000,        // Mora diaria: $2,000 pesos
  MAX_LATE_DAYS_MONTHLY: 15,   // Días máximos antes de restricción
  GRACE_DAYS: 5,               // Días de gracia (1-5 del mes)
  MAX_LATE_DAYS_CAP: 90,       // Límite máximo para cálculo de mora
};
```

---

## 💰 TIPOS DE OBLIGACIONES

### 1. ENROLLMENT_INITIAL (Matrícula Inicial)
- **Cuándo se crea**: Al registrar un nuevo atleta
- **Monto**: Variable (configuración admin)
- **Estado inicial matrícula**: `Pending_Payment`
- **Al aprobar pago**: Matrícula → `Vigente`

### 2. ENROLLMENT_RENEWAL (Renovación de Matrícula)
- **Cuándo se crea**: Cuando matrícula vence
- **Monto**: Variable (configuración admin)
- **Al aprobar pago**: Crea nueva matrícula por 1 año

### 3. MONTHLY (Mensualidad)
- **Cuándo se crea**: Automático día 1 de cada mes (CRON)
- **Monto**: Variable (configuración admin)
- **Vencimiento**: Día 5 del mes (días de gracia)
- **Al aprobar pago**: Solo marca como pagado

---

## 🚫 SISTEMA DE RESTRICCIONES

### Prioridades de Bloqueo (menor número = mayor prioridad)

```javascript
const BLOCKING_PRIORITIES = {
  ENROLLMENT_INITIAL_PENDING: 1,  // Prioridad más alta
  MATRICULA_VENCIDA: 2,
  ENROLLMENT_RENEWAL_PENDING: 2,  // Misma prioridad que matrícula vencida
  MORA_MENSUALIDAD: 3              // Prioridad más baja
};
```

### Condiciones de Restricción

1. **ENROLLMENT_INITIAL_PENDING**: Tiene obligación inicial sin pagar
2. **MATRICULA_VENCIDA**: No tiene matrícula vigente
3. **ENROLLMENT_RENEWAL_PENDING**: Matrícula necesita renovación
4. **MORA_MENSUALIDAD**: Mensualidad con más de 15 días de mora

### Middleware de Restricciones

- **Archivo**: `src/middlewares/paymentRestrictions.js`
- **Función**: `checkPaymentRestrictions()`
- **Aplicación**: Automática en login y rutas protegidas

---

## 👤 FLUJOS DE USUARIO

### Atleta con Matrícula Inicial Pendiente

```
┌─ INICIO SESIÓN ─┐
│                 │
├─ Verificación ──┤ → ¿Tiene matrícula vigente?
│                 │
└─ NO ────────────┘
         │
         ▼
┌─ VISTA RESTRINGIDA ─┐
│ "Matrícula Inicial  │
│  Requerida"         │
│                     │
│ [Pagar Matrícula]   │ → Sube comprobante
│ [Cerrar Sesión]     │
└─────────────────────┘
```

**Frontend debe mostrar**:
- Mensaje: "Completa el pago de tu matrícula inicial"
- Botón para subir comprobante
- Monto a pagar
- Solo acceso a "Mis Pagos"

### Atleta con Mensualidad Vencida (>15 días)

```
┌─ INICIO SESIÓN ─┐
│                 │
├─ Verificación ──┤ → ¿Mora > 15 días?
│                 │
└─ SÍ ────────────┘
         │
         ▼
┌─ VISTA RESTRINGIDA ─┐
│ "Cuenta Bloqueada   │
│  por Mora"          │
│                     │
│ Días mora: XX       │
│ Deuda: $XX,XXX      │
│                     │
│ [Pagar Deudas]      │ → Lista de obligaciones
│ [Cerrar Sesión]     │
└─────────────────────┘
```

**Frontend debe mostrar**:
- Mensaje: "Tu cuenta está bloqueada por mora"
- Días de mora acumulados
- Deuda total con mora
- Lista de obligaciones pendientes
- Solo acceso a "Mis Pagos"

### Atleta con Acceso Normal

```
┌─ INICIO SESIÓN ─┐
│                 │
├─ Verificación ──┤ → ¿Sin restricciones?
│                 │
└─ SÍ ────────────┘
         │
         ▼
┌─ DASHBOARD COMPLETO ─┐
│ ├─ Perfil            │
│ ├─ Citas             │
│ ├─ Eventos           │
│ ├─ Mis Pagos ────────┤ → Estado financiero
│ └─ Otros módulos     │
└──────────────────────┘
```

**Frontend debe mostrar**:
- Dashboard completo
- En "Mis Pagos": estado financiero actual
- Obligaciones pendientes (si las hay)
- Historial de pagos

---

## 🔗 ENDPOINTS COMPLETOS

### Para Deportistas

#### 1. Estado Financiero
```http
GET /api/payments/athletes/:athleteId/financial-status
Authorization: Bearer {token}
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "currentMonth": {
      "id": 123,
      "period": "2026-03",
      "baseAmount": 30000,
      "daysLate": 11,
      "lateFee": 22000,
      "totalToPay": 52000,
      "paymentStatus": null,
      "dueStart": "2026-03-01T00:00:00.000Z",
      "dueEnd": "2026-03-05T00:00:00.000Z"
    },
    "allMonthlyDebts": [
      {
        "id": 123,
        "period": "2026-03",
        "baseAmount": 30000,
        "daysLate": 11,
        "lateFee": 22000,
        "totalToPay": 52000
      }
    ],
    "totalDebt": {
      "monthlyAmount": 30000,
      "lateFeeAmount": 22000,
      "totalAmount": 52000,
      "maxDaysLate": 11,
      "obligationsCount": 1
    },
    "enrollment": {
      "needsRenewal": false,
      "isInitial": false,
      "type": null,
      "amount": null,
      "estado": "Vigente",
      "fechaInicio": "2024-09-15T14:14:22.000Z",
      "fechaVencimiento": "2027-03-15T15:04:20.000Z"
    }
  }
}
```

#### 2. Subir Comprobante
```http
POST /api/payments/obligations/:obligationId/receipt
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- receipt: [archivo]
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Comprobante subido exitosamente",
  "data": {
    "id": 456,
    "obligationId": 123,
    "receiptUrl": "https://cloudinary.com/...",
    "status": "PENDING",
    "uploadedAt": "2026-03-15T20:30:00.000Z"
  }
}
```

#### 3. Verificar Restricciones
```http
GET /api/payments/athletes/:athleteId/access-check
Authorization: Bearer {token}
```

**Respuesta (Sin restricciones)**:
```json
{
  "success": true,
  "data": {
    "restricted": false
  }
}
```

**Respuesta (Con restricciones)**:
```json
{
  "success": true,
  "data": {
    "restricted": true,
    "reason": "MORA_MENSUALIDAD",
    "message": "Tu cuenta está bloqueada por mora. Días de retraso: 16",
    "lateDays": 16
  }
}
```

### Para Administradores

#### 1. Pagos Pendientes (Con filtros)
```http
GET /api/payments/pending?page=1&limit=20&type=MONTHLY&search=Juan
Authorization: Bearer {token}
```

**Parámetros de consulta**:
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 20)
- `type`: Tipo de obligación (`MONTHLY`, `ENROLLMENT_INITIAL`, `ENROLLMENT_RENEWAL`)
- `search`: Búsqueda por nombre o documento

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "payments": [
      {
        "id": 456,
        "athleteId": 118,
        "receiptUrl": "https://cloudinary.com/...",
        "receiptName": "comprobante.jpg",
        "status": "PENDING",
        "uploadedAt": "2026-03-15T20:30:00.000Z",
        "athlete": {
          "user": {
            "firstName": "Juan",
            "lastName": "Pérez",
            "identification": "12345678",
            "email": "juan@email.com"
          }
        },
        "obligation": {
          "id": 123,
          "type": "MONTHLY",
          "period": "2026-03",
          "baseAmount": 30000,
          "dueStart": "2026-03-01T00:00:00.000Z",
          "dueEnd": "2026-03-05T00:00:00.000Z",
          "daysLate": 11,
          "lateFeeAmount": 22000,
          "totalAmount": 52000
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

#### 2. Historial de Pagos
```http
GET /api/payments/all?page=1&limit=20&status=APPROVED&excludeStatus=PENDING
Authorization: Bearer {token}
```

**Parámetros de consulta**:
- `page`, `limit`: Paginación
- `status`: Filtrar por estado específico
- `excludeStatus`: Excluir estado específico
- `type`: Tipo de obligación
- `dateFrom`, `dateTo`: Rango de fechas
- `search`: Búsqueda por nombre o documento

#### 3. Gestión Mensual (Reporte especial)
```http
GET /api/payments/monthly-management?page=1&limit=20
Authorization: Bearer {token}
```

**Respuesta**: Lista de atletas con sus estados de pago mensual, incluyendo cálculos de mora actualizados.

#### 4. Aprobar Pago
```http
PATCH /api/payments/:paymentId/approve
Authorization: Bearer {token}
```

**Respuesta**:
```json
{
  "success": true,
  "message": "Pago aprobado exitosamente",
  "data": {
    "id": 456,
    "status": "APPROVED",
    "reviewedAt": "2026-03-15T21:00:00.000Z",
    "reviewedBy": 1
  }
}
```

#### 5. Rechazar Pago
```http
PATCH /api/payments/:paymentId/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "rejectionReason": "Comprobante ilegible"
}
```

---

## 📊 CÁLCULO DE MORA

### Fórmula Base
```javascript
const calculateLateFee = (lateDays, lateFeeDailyAmount, athlete, enrollment) => {
  if (lateDays <= 0) return 0;
  
  // ✅ REGLA CRÍTICA: No calcular mora si atleta inactivo
  if (athlete && athlete.status !== 'Active') {
    return 0;
  }
  
  // ✅ REGLA CRÍTICA: No calcular mora si matrícula vencida
  if (enrollment && enrollment.estado !== 'Vigente') {
    return 0;
  }
  
  // Aplicar límite máximo de días para mora
  const cappedLateDays = Math.min(lateDays, MAX_LATE_DAYS_CAP);
  
  return cappedLateDays * lateFeeDailyAmount;
};
```

### Casos Especiales
1. **Atleta inactivo**: Mora = $0
2. **Matrícula vencida**: Mora = $0
3. **Más de 90 días**: Mora máxima = 90 × $2,000 = $180,000

### Ejemplo de Cálculo
```
Obligación: Mensualidad marzo 2026
Vencimiento: 5 de marzo 2026
Fecha actual: 16 de marzo 2026
Días de mora: 11 días
Mora diaria: $2,000
Mora total: 11 × $2,000 = $22,000
Total a pagar: $30,000 + $22,000 = $52,000
```

---

## 🔄 ESTADOS Y TRANSICIONES

### Estados de PaymentObligation
- **Creada**: Automáticamente al generar obligación
- **Pendiente**: Esperando pago del atleta
- **Pagada**: Cuando se aprueba un comprobante

### Estados de Payment
- **PENDING**: Comprobante subido, esperando revisión
- **APPROVED**: Comprobante aprobado por admin
- **REJECTED**: Comprobante rechazado por admin

### Estados de Enrollment
- **Pending_Payment**: Esperando pago inicial
- **Vigente**: Matrícula activa
- **Vencida**: Matrícula expirada (automático)

### Flujo de Transiciones

```
NUEVA OBLIGACIÓN
       │
       ▼
┌─ PENDIENTE ─┐
│             │
│ Atleta sube │ → PAYMENT (PENDING)
│ comprobante │
└─────────────┘
       │
       ▼
┌─ REVISIÓN ──┐
│             │
│ Admin       │ → APPROVED ──┐
│ revisa      │              │
│             │ → REJECTED   │
└─────────────┘              │
                             ▼
                    ┌─ OBLIGACIÓN ─┐
                    │   PAGADA     │
                    └──────────────┘
```

---

## 🔍 FILTROS Y BÚSQUEDAS

### Filtros Disponibles

#### En Pagos Pendientes
```javascript
const filters = {
  page: 1,                    // Paginación
  limit: 20,                  // Elementos por página
  type: 'MONTHLY',            // Tipo de obligación
  search: 'Juan Pérez',       // Nombre o documento
  sortBy: 'uploadedAt',       // Campo de ordenamiento
  sortOrder: 'desc'           // Orden (asc/desc)
};
```

#### En Historial de Pagos
```javascript
const filters = {
  page: 1,
  limit: 20,
  status: 'APPROVED',         // Estado específico
  excludeStatus: 'PENDING',   // Excluir estado
  type: 'MONTHLY',            // Tipo de obligación
  dateFrom: '2026-01-01',     // Fecha desde
  dateTo: '2026-03-31',       // Fecha hasta
  search: 'María González'    // Búsqueda por texto
};
```

### Implementación de Búsqueda

```javascript
// En el repository
const whereClause = {};

// Filtro por búsqueda (nombre o documento)
if (search) {
  whereClause.athlete = {
    user: {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { identification: { contains: search, mode: 'insensitive' } }
      ]
    }
  };
}

// Filtro por tipo
if (type) {
  whereClause.obligation = {
    type: type
  };
}

// Filtro por fecha
if (dateFrom || dateTo) {
  whereClause.uploadedAt = {};
  if (dateFrom) whereClause.uploadedAt.gte = new Date(dateFrom);
  if (dateTo) whereClause.uploadedAt.lte = new Date(dateTo);
}
```

---

## 🔗 INTEGRACIÓN FRONTEND-BACKEND

### Flujo de Autenticación con Restricciones

```javascript
// 1. Login del atleta
POST /api/auth/login
{
  "email": "atleta@email.com",
  "password": "password"
}

// 2. Respuesta con información de restricciones
{
  "success": true,
  "token": "jwt_token",
  "user": { ... },
  "restricted": true,
  "reason": "ENROLLMENT_INITIAL_PENDING",
  "message": "Tu matrícula está pendiente de pago inicial"
}

// 3. Frontend decide qué mostrar
if (response.restricted) {
  switch (response.reason) {
    case 'ENROLLMENT_INITIAL_PENDING':
      showEnrollmentInitialView();
      break;
    case 'MORA_MENSUALIDAD':
      showOverduePaymentsView();
      break;
    case 'MATRICULA_VENCIDA':
      showEnrollmentRenewalView();
      break;
  }
} else {
  showFullDashboard();
}
```

### Manejo de Estados en Frontend

```javascript
// Hook para manejar estado financiero
const useFinancialStatus = (athleteId) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get(`/payments/athletes/${athleteId}/financial-status`);
        setStatus(response.data.data);
      } catch (error) {
        console.error('Error fetching financial status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (athleteId) {
      fetchStatus();
    }
  }, [athleteId]);

  return { status, loading, refetch: fetchStatus };
};
```

### Componente de Vista Restringida

```jsx
const RestrictedAthleteView = ({ restriction, financialStatus }) => {
  const renderContent = () => {
    switch (restriction.reason) {
      case 'ENROLLMENT_INITIAL_PENDING':
        return (
          <EnrollmentInitialRequired 
            obligation={financialStatus.enrollment}
          />
        );
      
      case 'MORA_MENSUALIDAD':
        return (
          <OverduePaymentsView 
            debts={financialStatus.allMonthlyDebts}
            totalDebt={financialStatus.totalDebt}
          />
        );
      
      case 'MATRICULA_VENCIDA':
        return (
          <EnrollmentRenewalRequired 
            enrollment={financialStatus.enrollment}
          />
        );
      
      default:
        return <div>Error: Restricción desconocida</div>;
    }
  };

  return (
    <div className="restricted-view">
      <div className="restriction-header">
        <h2>Acceso Restringido</h2>
        <p>{restriction.message}</p>
      </div>
      {renderContent()}
    </div>
  );
};
```

---

## 📝 CASOS DE USO ESPECÍFICOS

### Caso 1: Atleta Nuevo (Matrícula Initial)

**Flujo Backend**:
1. Admin crea atleta → Matrícula en `Pending_Payment`
2. Se crea obligación `ENROLLMENT_INITIAL`
3. Atleta intenta login → Detecta restricción
4. Atleta sube comprobante → Estado `PENDING`
5. Admin aprueba → Matrícula cambia a `Vigente`

**Frontend debe mostrar**:
```jsx
<div className="enrollment-initial-view">
  <h2>Matrícula Inicial Requerida</h2>
  <p>Completa el pago de tu matrícula inicial para acceder completamente al sistema.</p>
  
  <div className="payment-info">
    <h3>Matrícula Inicial</h3>
    <p>Pago único de inscripción</p>
    <div className="amount">${obligation.baseAmount.toLocaleString()}</div>
  </div>
  
  <UploadReceiptForm obligationId={obligation.id} />
</div>
```

### Caso 2: Atleta con Mora Excesiva (>15 días)

**Flujo Backend**:
1. Mensualidad vence (día 5)
2. Pasan 15+ días sin pago
3. Atleta intenta login → Detecta restricción `MORA_MENSUALIDAD`
4. Solo puede acceder a "Mis Pagos"

**Frontend debe mostrar**:
```jsx
<div className="overdue-payments-view">
  <h2>Cuenta Bloqueada por Mora</h2>
  <p>Tu cuenta está bloqueada por pagos vencidos.</p>
  
  <div className="debt-summary">
    <div className="total-debt">${totalDebt.totalAmount.toLocaleString()}</div>
    <div className="debt-breakdown">
      <span>Mensualidades: ${totalDebt.monthlyAmount.toLocaleString()}</span>
      <span>Mora acumulada: ${totalDebt.lateFeeAmount.toLocaleString()}</span>
    </div>
    <div className="max-days">Mora máxima: {totalDebt.maxDaysLate} días</div>
  </div>
  
  <DebtsList debts={allMonthlyDebts} />
</div>
```

### Caso 3: Atleta con Acceso Normal

**Flujo Backend**:
1. Atleta login → Sin restricciones
2. Acceso completo al dashboard
3. En "Mis Pagos" → Estado financiero actual

**Frontend debe mostrar**:
```jsx
<div className="normal-payments-view">
  <h2>Mis Pagos</h2>
  
  {totalDebt.totalAmount > 0 ? (
    <div className="with-debt">
      <div className="debt-status">Con Deuda</div>
      <FinancialSummary 
        totalDebt={totalDebt}
        currentMonth={currentMonth}
      />
      <PaymentHistory debts={allMonthlyDebts} />
    </div>
  ) : (
    <div className="no-debt">
      <div className="debt-status">Al Día</div>
      <p>No tienes pagos pendientes</p>
      <PaymentHistory />
    </div>
  )}
</div>
```

---

## ⚙️ CONFIGURACIÓN Y MANTENIMIENTO

### Variables de Configuración

```javascript
// En PaymentSettings (base de datos)
{
  monthlyAmount: 30000,        // Mensualidad
  enrollmentAmount: 30000,     // Matrícula
  lateFeeDailyAmount: 2000,    // Mora diaria
  // Otros campos configurables...
}

// Constantes fijas (código)
const BUSINESS_CONSTANTS = {
  MAX_LATE_DAYS_MONTHLY: 15,   // No configurable
  GRACE_DAYS: 5,               // No configurable
  MAX_LATE_DAYS_CAP: 90,       // No configurable
};
```

### CRON Jobs

```javascript
// Generación automática de mensualidades (día 1 de cada mes)
// Archivo: src/jobs/generateMonthlyPayments.js
cron.schedule('0 0 1 * *', async () => {
  await paymentsService.generateMonthlyObligations();
});
```

### Logs y Monitoreo

```javascript
// Logs importantes a monitorear
console.log('🔄 [PAYMENTS] Generando mensualidades para periodo:', period);
console.log('📊 [PAYMENTS] Encontrados X atletas activos');
console.log('✅ [PAYMENTS] Mensualidades generadas: X, omitidas: Y, errores: Z');
console.log('⚠️ [RESTRICTIONS] Atleta restringido:', reason);
```

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### 1. "useEffect is not defined" (Frontend)
**Problema**: Falta import en componente React
**Solución**: 
```javascript
import React, { useState, useEffect } from 'react';
```

### 2. Atleta ve "Matrícula Inicial Requerida" teniendo matrícula vigente
**Problema**: Obligación `ENROLLMENT_INITIAL` incorrecta
**Solución**: Eliminar obligación inicial si matrícula está vigente

### 3. Cálculos de mora inconsistentes
**Problema**: Frontend calcula diferente al backend
**Solución**: Frontend debe usar datos del backend, no calcular localmente

### 4. Filtros no funcionan
**Problema**: Parámetros incorrectos en query string
**Solución**: Verificar nombres exactos de parámetros en endpoints

### 5. Restricciones no se aplican
**Problema**: Middleware no configurado correctamente
**Solución**: Verificar orden de middlewares en rutas

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Endpoints de pagos funcionando
- [ ] Middleware de restricciones activo
- [ ] Cálculo de mora correcto
- [ ] CRON job de mensualidades
- [ ] Filtros y búsquedas implementados
- [ ] Validaciones de permisos

### Frontend
- [ ] Imports de React completos
- [ ] Manejo de estados de restricción
- [ ] Componentes para cada tipo de vista
- [ ] Integración con endpoints
- [ ] Filtros y paginación
- [ ] Subida de archivos
- [ ] Manejo de errores

### Integración
- [ ] Autenticación con restricciones
- [ ] Redirecciones automáticas
- [ ] Sincronización de estados
- [ ] Validación de permisos
- [ ] Logs y monitoreo

---

## 📞 CONTACTO Y SOPORTE

Para dudas sobre implementación:
1. Revisar logs del backend
2. Verificar respuestas de endpoints
3. Comprobar middlewares activos
4. Validar estados en base de datos

**Archivos clave para debugging**:
- `src/modules/Payments/services/payments.service.js`
- `src/middlewares/paymentRestrictions.js`
- `src/modules/Payments/routes/payments.routes.js`
- `src/modules/Payments/controllers/payments.controller.js`