# 🎯 CONTEXTO PARA IMPLEMENTACIÓN FRONTEND - MÓDULO DE PAGOS

## 📋 RESUMEN EJECUTIVO

Vas a implementar el frontend React para el módulo de gestión de pagos de una escuela deportiva. El backend está 100% completado y funcional con 10 endpoints, base de datos optimizada, y lógica de negocio robusta.

---

## 🏗️ ARQUITECTURA BACKEND DISPONIBLE

### Endpoints Listos para Consumir

```javascript
// ATLETAS - Estado financiero y comprobantes
GET    /api/payments/athletes/:athleteId/financial-status
POST   /api/payments/obligations/:obligationId/receipt
GET    /api/payments/athletes/:athleteId/access-check

// ADMIN - Gestión de pagos
GET    /api/payments/pending?page=1&limit=20&type=MONTHLY
PATCH  /api/payments/:paymentId/approve
PATCH  /api/payments/:paymentId/reject
POST   /api/payments/generate-monthly
POST   /api/payments/athletes/:athleteId/enrollment-renewal

// CONFIGURACIÓN - Solo admin
GET    /api/payment-settings
PATCH  /api/payment-settings
```

### Estructura de Datos Principal

```typescript
// Estado financiero del atleta
interface FinancialStatus {
  currentMonth: {
    period: string;           // "2026-03"
    baseAmount: number;       // 50000
    daysLate: number;         // 8
    lateFee: number;          // 16000
    totalToPay: number;       // 66000
    paymentStatus: "PENDING" | "APPROVED" | "REJECTED" | null;
  };
  allMonthlyDebts: Array<{
    period: string;
    baseAmount: number;
    daysLate: number;
    lateFee: number;
    totalToPay: number;
    paymentStatus: string;
  }>;
  totalDebt: {
    monthlyAmount: number;    // Total sin mora
    lateFeeAmount: number;    // Total mora acumulada
    totalAmount: number;      // Gran total
    maxDaysLate: number;      // Días mora máximos
    obligationsCount: number; // Cantidad obligaciones
  };
  enrollment: {
    needsRenewal: boolean;
  };
}

// Pago pendiente (admin)
interface PendingPayment {
  id: number;
  receiptUrl: string;
  receiptName: string;
  uploadedAt: string;
  athlete: {
    user: {
      firstName: string;
      lastName: string;
      identification: string;
    };
  };
  obligation: {
    type: "MONTHLY" | "ENROLLMENT_RENEWAL";
    period: string | null;
    baseAmount: number;
  };
}

// Configuración de pagos
interface PaymentSettings {
  monthlyAmount: number;      // Configurable
  enrollmentAmount: number;   // Configurable
  graceDays: number;         // Configurable
}
```

---

## 🎨 ESTRUCTURA DE NAVEGACIÓN REQUERIDA

### Ubicación en Sidebar
```
Deportistas/
├── Categoría Deportiva
├── Gestión de Deportistas  
├── Gestión de Matrículas
├── 🆕 Gestión de Pagos     ← IMPLEMENTAR AQUÍ
└── Asistencia Deportistas
```

### Rutas a Implementar
```javascript
// Admin
/admin/gestion-pagos              // Lista pagos pendientes
/admin/configuracion-pagos        // Configurar valores

// Atleta  
/atleta/mis-pagos                 // Estado financiero y subir comprobantes
```

---

## 🔧 COMPONENTES A DESARROLLAR

### 1. Vista Admin: Gestión de Pagos Pendientes

```jsx
// Componente principal
<AdminPaymentsManagement>
  <PaymentsHeader>
    <Title>🧾 Gestión de Pagos - Administrador</Title>
    <Filters>
      <StatusFilter />      // PENDING, APPROVED, REJECTED
      <TypeFilter />        // MONTHLY, ENROLLMENT_RENEWAL
      <SearchInput />       // Por nombre/identificación
    </Filters>
  </PaymentsHeader>

  <PaymentsTable>
    <PaymentRow key={payment.id}>
      <AthleteColumn>
        <AthleteName />
        <AthleteId />
      </AthleteColumn>
      <TypeColumn>
        <PaymentTypeBadge />  // 📅 Mensualidad / 🎓 Matrícula
      </TypeColumn>
      <PeriodColumn />        // "2026-03" o "Renovación"
      <AmountColumn />        // $50,000
      <DateColumn />          // Fecha subida
      <ActionsColumn>
        <ViewReceiptButton />  // Abrir en nueva pestaña
        <ApproveButton />      // ✅ Aprobar
        <RejectButton />       // ❌ Rechazar (con modal)
      </ActionsColumn>
    </PaymentRow>
  </PaymentsTable>

  <Pagination />
</AdminPaymentsManagement>
```

**Funcionalidades Clave:**
- ✅ Paginación (20 items por página)
- ✅ Filtros por estado y tipo
- ✅ Búsqueda por atleta
- ✅ Modal de rechazo con motivo obligatorio
- ✅ Confirmación antes de aprobar
- ✅ Refresh automático después de acciones

### 2. Vista Admin: Configuración de Pagos

```jsx
<PaymentSettingsAdmin>
  <SettingsHeader>
    <Title>⚙️ Configuración de Pagos</Title>
    <Description>Administra los valores y políticas del sistema</Description>
  </SettingsHeader>

  <SettingsForm>
    <ValuesSection>
      <Title>💰 Valores de Pago</Title>
      <MonthlyAmountInput />      // Mensualidad
      <EnrollmentAmountInput />   // Renovación matrícula
    </ValuesSection>

    <PoliciesSection>
      <Title>📅 Políticas de Tiempo</Title>
      <GraceDaysInput />          // Días de gracia
    </PoliciesSection>

    <FixedValuesInfo>
      <Title>📋 Valores Fijos del Negocio</Title>
      <InfoItem>Mora diaria: $2,000</InfoItem>
      <InfoItem>Días máximos mora: 15</InfoItem>
    </FixedValuesInfo>

    <Actions>
      <SaveButton />
      <ResetButton />
    </Actions>
  </SettingsForm>

  <ImportantNotes>
    <Note>Los cambios afectan solo a nuevas obligaciones</Note>
    <Note>Las obligaciones existentes mantienen su valor original</Note>
  </ImportantNotes>
</PaymentSettingsAdmin>
```

### 3. Vista Atleta: Mis Pagos

```jsx
<AthletePaymentsView>
  <FinancialSummary>
    <DebtCard>
      <TotalDebt>💰 Deuda Total: $216,000</TotalDebt>
      <Breakdown>
        <Item>Mensualidades: $150,000</Item>
        <Item>Mora acumulada: $66,000</Item>
        <Item>Obligaciones pendientes: 3</Item>
      </Breakdown>
    </DebtCard>
  </FinancialSummary>

  <ObligationsList>
    <ObligationCard key={obligation.id}>
      <Header>
        <Type>📅 Mensualidad {obligation.period}</Type>
        <Status>
          <StatusBadge status={obligation.paymentStatus} />
        </Status>
      </Header>

      <AmountDetails>
        <BaseAmount>Valor base: $50,000</BaseAmount>
        <LateFee>Mora ({obligation.daysLate} días): $16,000</LateFee>
        <Total>Total a pagar: $66,000</Total>
      </AmountDetails>

      <PaymentActions>
        {obligation.paymentStatus === null && (
          <UploadReceiptButton obligationId={obligation.id} />
        )}
        {obligation.paymentStatus === "PENDING" && (
          <PendingMessage>⏳ En revisión por administración</PendingMessage>
        )}
        {obligation.paymentStatus === "REJECTED" && (
          <RejectedInfo>
            <Message>❌ Rechazado: {rejectionReason}</Message>
            <UploadReceiptButton obligationId={obligation.id} />
          </RejectedInfo>
        )}
        {obligation.paymentStatus === "APPROVED" && (
          <ApprovedMessage>✅ Pago aprobado</ApprovedMessage>
        )}
      </PaymentActions>
    </ObligationCard>
  </ObligationsList>

  <PaymentHistory>
    <Title>📋 Historial de Pagos</Title>
    <HistoryList />
  </PaymentHistory>
</AthletePaymentsView>
```

---

## 🔧 HOOKS Y SERVICIOS REQUERIDOS

### Custom Hooks

```javascript
// Estado financiero del atleta
const useFinancialStatus = (athleteId) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fetchStatus = async () => {
    const response = await api.get(`/payments/athletes/${athleteId}/financial-status`);
    setStatus(response.data);
  };
  
  return { status, loading, refetch: fetchStatus };
};

// Pagos pendientes (admin)
const usePendingPayments = (filters = {}) => {
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({});
  
  const fetchPayments = async () => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/payments/pending?${params}`);
    setPayments(response.data.payments);
    setPagination(response.data.pagination);
  };
  
  return { payments, pagination, refetch: fetchPayments };
};

// Configuración de pagos
const usePaymentSettings = () => {
  const [settings, setSettings] = useState(null);
  
  const fetchSettings = async () => {
    const response = await api.get('/payment-settings');
    setSettings(response.data);
  };
  
  const updateSettings = async (newSettings) => {
    await api.patch('/payment-settings', newSettings);
    await fetchSettings();
  };
  
  return { settings, fetchSettings, updateSettings };
};

// Subir comprobante
const useUploadReceipt = () => {
  const [uploading, setUploading] = useState(false);
  
  const uploadReceipt = async (obligationId, file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post(`/payments/obligations/${obligationId}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response.data.message };
    } finally {
      setUploading(false);
    }
  };
  
  return { uploadReceipt, uploading };
};

// Aprobar/Rechazar pagos (admin)
const usePaymentActions = () => {
  const approvePayment = async (paymentId) => {
    await api.patch(`/payments/${paymentId}/approve`);
  };
  
  const rejectPayment = async (paymentId, reason) => {
    await api.patch(`/payments/${paymentId}/reject`, {
      rejectionReason: reason
    });
  };
  
  return { approvePayment, rejectPayment };
};
```

### Servicios API

```javascript
// api/paymentsService.js
export const paymentsAPI = {
  // Atletas
  getFinancialStatus: (athleteId) => 
    api.get(`/payments/athletes/${athleteId}/financial-status`),
  
  uploadReceipt: (obligationId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/payments/obligations/${obligationId}/receipt`, formData);
  },
  
  // Admin
  getPendingPayments: (filters) => 
    api.get('/payments/pending', { params: filters }),
  
  approvePayment: (paymentId) => 
    api.patch(`/payments/${paymentId}/approve`),
  
  rejectPayment: (paymentId, reason) => 
    api.patch(`/payments/${paymentId}/reject`, { rejectionReason: reason }),
  
  // Configuración
  getSettings: () => 
    api.get('/payment-settings'),
  
  updateSettings: (settings) => 
    api.patch('/payment-settings', settings)
};
```

---

## 🎨 COMPONENTES REUTILIZABLES

### StatusBadge
```jsx
const StatusBadge = ({ status }) => {
  const config = {
    PENDING: { color: 'orange', icon: '⏳', text: 'Pendiente' },
    APPROVED: { color: 'green', icon: '✅', text: 'Aprobado' },
    REJECTED: { color: 'red', icon: '❌', text: 'Rechazado' }
  };
  
  const { color, icon, text } = config[status] || { color: 'gray', icon: '❓', text: 'Sin estado' };
  
  return (
    <span className={`badge badge-${color}`}>
      {icon} {text}
    </span>
  );
};
```

### FileUpload
```jsx
const FileUpload = ({ onUpload, accept = "image/*,.pdf", maxSize = 5 * 1024 * 1024 }) => {
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validaciones
    if (file.size > maxSize) {
      alert('El archivo no debe superar los 5MB');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF');
      return;
    }
    
    onUpload(file);
  };
  
  return (
    <div className="file-upload">
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        id="file-input"
      />
      <label htmlFor="file-input" className="upload-button">
        📤 Subir Comprobante
      </label>
    </div>
  );
};
```

### CurrencyFormatter
```jsx
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

const CurrencyDisplay = ({ amount, className = "" }) => (
  <span className={`currency ${className}`}>
    {formatCurrency(amount)}
  </span>
);
```

---

## 🚨 VALIDACIONES Y MANEJO DE ERRORES

### Validaciones Frontend
```javascript
// Validar archivo antes de subir
const validateFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('Debe seleccionar un archivo');
  }
  
  if (file && file.size > 5 * 1024 * 1024) {
    errors.push('El archivo no debe superar los 5MB');
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (file && !allowedTypes.includes(file.type)) {
    errors.push('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF');
  }
  
  return errors;
};

// Validar configuración de pagos
const validatePaymentSettings = (settings) => {
  const errors = {};
  
  if (settings.monthlyAmount < 1000) {
    errors.monthlyAmount = 'Debe ser mayor a $1,000';
  }
  
  if (settings.enrollmentAmount < 1000) {
    errors.enrollmentAmount = 'Debe ser mayor a $1,000';
  }
  
  if (settings.graceDays < 1 || settings.graceDays > 15) {
    errors.graceDays = 'Debe estar entre 1 y 15 días';
  }
  
  return errors;
};
```

### Manejo de Errores
```javascript
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (error) => {
      console.error('Payment module error:', error);
      setHasError(true);
    };
    
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="error-fallback">
        <h3>❌ Error en el módulo de pagos</h3>
        <p>Por favor, recarga la página o contacta al administrador.</p>
        <button onClick={() => setHasError(false)}>
          Reintentar
        </button>
      </div>
    );
  }
  
  return children;
};
```

---

## 🎯 CONSIDERACIONES UX/UI

### Estados de Carga
- ✅ Skeleton loaders para tablas
- ✅ Spinners para acciones (aprobar/rechazar)
- ✅ Progress bars para uploads
- ✅ Mensajes de estado claros

### Feedback Visual
- ✅ Toasts para acciones exitosas
- ✅ Modales de confirmación para acciones críticas
- ✅ Badges de estado con colores consistentes
- ✅ Iconos descriptivos para cada tipo

### Responsive Design
- ✅ Tablas colapsables en móvil
- ✅ Cards apilables para obligaciones
- ✅ Navegación adaptativa
- ✅ Formularios optimizados para touch

### Accesibilidad
- ✅ Labels descriptivos
- ✅ Contraste adecuado
- ✅ Navegación por teclado
- ✅ Screen reader friendly

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Componentes Base (1-2 días)
1. ✅ Configurar rutas y navegación
2. ✅ Crear hooks de API
3. ✅ Implementar componentes reutilizables
4. ✅ Configurar manejo de errores

### Fase 2: Vista Admin (2-3 días)
1. ✅ Lista de pagos pendientes
2. ✅ Filtros y búsqueda
3. ✅ Acciones de aprobar/rechazar
4. ✅ Configuración de pagos

### Fase 3: Vista Atleta (2-3 días)
1. ✅ Estado financiero
2. ✅ Lista de obligaciones
3. ✅ Subida de comprobantes
4. ✅ Historial de pagos

### Fase 4: Pulimiento (1 día)
1. ✅ Estilos finales
2. ✅ Testing de flujos
3. ✅ Optimizaciones
4. ✅ Documentación

---

## 🎯 OBJETIVOS DE CALIDAD

### Performance
- ⚡ < 2s carga inicial
- ⚡ < 500ms navegación entre vistas
- ⚡ Lazy loading de componentes pesados
- ⚡ Optimización de re-renders

### Usabilidad
- 😊 Flujo intuitivo para atletas
- 😊 Interfaz eficiente para admins
- 😊 Feedback claro en todas las acciones
- 😊 Manejo graceful de errores

### Mantenibilidad
- 🔧 Código modular y reutilizable
- 🔧 Hooks bien estructurados
- 🔧 Componentes documentados
- 🔧 Patrones consistentes

**🚀 ¡El backend está listo y esperando! Ahora es momento de crear una interfaz que haga justicia a toda la robustez técnica implementada.**