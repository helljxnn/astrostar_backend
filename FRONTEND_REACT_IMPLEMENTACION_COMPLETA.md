# 🖥️ FRONTEND REACT - IMPLEMENTACIÓN COMPLETA

## 🎯 OBJETIVO SIMPLE

Implementar 3 cosas en React:
1. **Login con restricciones** → Redirige según deuda
2. **Protección de rutas** → Bloquea acceso si debe dinero
3. **Vista Gestión de Pagos** → Para deportistas y admin

---

## 🔧 PASO 1: MODIFICAR LOGIN

### LoginComponent.jsx
```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        // Guardar datos de sesión
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('restricted', data.restricted ? 'true' : 'false');

        // LÓGICA SIMPLE DE REDIRECCIÓN
        if (data.restricted) {
          navigate('/gestion-pagos', { 
            state: { 
              reason: data.reason,
              message: data.message 
            }
          });
        } else {
          navigate('/dashboard');
        }
      } else {
        alert(data.message || 'Error en login');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={credentials.email}
        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
};

export default Login;
```

---

## 🔒 PASO 2: PROTECCIÓN DE RUTAS

### ProtectedRoute.jsx
```jsx
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isRestricted = localStorage.getItem('restricted') === 'true';
  const location = useLocation();
  
  // Si está restringido y no está en gestión de pagos
  if (isRestricted && !location.pathname.includes('/gestion-pagos')) {
    return <Navigate to="/gestion-pagos" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
```

### App.jsx - Configuración de Rutas
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import GestionPagos from './components/GestionPagos';
import AdminPagos from './components/AdminPagos';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/gestion-pagos" element={<GestionPagos />} />
        <Route path="/admin/pagos" element={<AdminPagos />} />
        
        {/* Rutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/perfil" element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```---


## 💳 PASO 3: VISTA DEPORTISTA - GESTIÓN DE PAGOS

### GestionPagos.jsx
```jsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GestionPagos = () => {
  const [financialStatus, setFinancialStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem('user'));
  const isRestricted = localStorage.getItem('restricted') === 'true';

  useEffect(() => {
    if (user?.athlete?.id) {
      fetchFinancialStatus();
    }
  }, []);

  const fetchFinancialStatus = async () => {
    try {
      const response = await fetch(`/api/payments/athletes/${user.athlete.id}/financial-status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setFinancialStatus(data.data);
    } catch (error) {
      console.error('Error fetching financial status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async (obligationId, file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await fetch(`/api/payments/obligations/${obligationId}/receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      if (response.ok) {
        alert('Comprobante subido exitosamente. Será revisado por administración.');
        fetchFinancialStatus(); // Refresh data
      } else {
        alert('Error subiendo comprobante');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': '🟡 En revisión',
      'APPROVED': '🟢 Aprobado',
      'REJECTED': '🔴 Rechazado',
      null: '⚪ No enviado'
    };
    return badges[status] || badges[null];
  };

  if (loading) return <div>Cargando información financiera...</div>;

  return (
    <div className="gestion-pagos">
      <h1>💳 Gestión de Pagos</h1>

      {/* Alerta de restricción */}
      {isRestricted && (
        <div className="alert alert-warning">
          🚫 <strong>Acceso Restringido:</strong> {location.state?.message || 'Tienes pagos pendientes.'}
          <br />Solo puedes acceder a esta sección hasta regularizar tu situación.
        </div>
      )}

      {/* Mensualidad Actual */}
      {financialStatus?.currentMonth && (
        <div className="card">
          <h3>📅 Mensualidad {financialStatus.currentMonth.period}</h3>
          
          <div className="payment-details">
            <p><strong>Valor base:</strong> ${financialStatus.currentMonth.baseAmount.toLocaleString()}</p>
            
            {financialStatus.currentMonth.daysLate > 0 && (
              <div className="mora-info">
                <p className="text-danger">
                  <strong>⚠️ Días de mora:</strong> {financialStatus.currentMonth.daysLate} días
                </p>
                <p className="text-danger">
                  <strong>Multa acumulada:</strong> ${financialStatus.currentMonth.lateFee.toLocaleString()}
                </p>
              </div>
            )}
            
            <p className="total">
              <strong>Total a pagar:</strong> ${financialStatus.currentMonth.totalToPay.toLocaleString()}
            </p>
            
            <p><strong>Estado del pago:</strong> {getStatusBadge(financialStatus.currentMonth.paymentStatus)}</p>
          </div>

          {financialStatus.currentMonth.paymentStatus !== 'APPROVED' && (
            <FileUpload 
              onUpload={(file) => handleUploadReceipt(financialStatus.currentMonth.obligation.id, file)}
              uploading={uploading}
              label="Subir comprobante de mensualidad"
            />
          )}
        </div>
      )}

      {/* Renovación de Matrícula */}
      {financialStatus?.enrollment?.needsRenewal && (
        <div className="card">
          <h3>🎓 Renovación de Matrícula</h3>
          <div className="alert alert-danger">
            <strong>Tu matrícula ha vencido y necesita renovación.</strong>
            <br />No podrás acceder al sistema hasta completar la renovación.
          </div>
          <p><strong>Valor de renovación:</strong> ${financialStatus.enrollment.amount.toLocaleString()}</p>
          
          <FileUpload 
            onUpload={(file) => handleUploadReceipt(financialStatus.enrollment.obligationId, file)}
            uploading={uploading}
            label="Subir comprobante de renovación"
          />
        </div>
      )}

      {/* Botón para volver (solo si no está restringido) */}
      {!isRestricted && (
        <button onClick={() => window.history.back()}>
          ← Volver al sistema
        </button>
      )}
    </div>
  );
};

// Componente auxiliar para subir archivos
const FileUpload = ({ onUpload, uploading, label }) => {
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (file) {
      onUpload(file);
      setFile(null);
    }
  };

  return (
    <div className="upload-section">
      <form onSubmit={handleSubmit} className="upload-form">
        <label>{label}:</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button type="submit" disabled={!file || uploading}>
          {uploading ? 'Subiendo...' : '📤 Subir Comprobante'}
        </button>
      </form>
      <small>Formatos aceptados: JPG, PNG, PDF (máx. 5MB)</small>
    </div>
  );
};

export default GestionPagos;
```---


## 👩‍💼 PASO 4: VISTA ADMIN - GESTIÓN DE PAGOS

### AdminPagos.jsx
```jsx
import { useState, useEffect } from 'react';

const AdminPagos = () => {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await fetch('/api/payments/pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setPendingPayments(data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    if (!confirm('¿Aprobar este pago?')) return;
    
    setProcessing(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}/approve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        alert('Pago aprobado exitosamente');
        fetchPendingPayments(); // Refresh
      } else {
        alert('Error aprobando pago');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId) => {
    const reason = prompt('Motivo del rechazo:');
    if (!reason) return;

    setProcessing(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}/reject`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        alert('Pago rechazado');
        fetchPendingPayments(); // Refresh
      } else {
        alert('Error rechazando pago');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return <div>Cargando pagos pendientes...</div>;

  return (
    <div className="admin-pagos">
      <h1>🧾 Gestión de Pagos - Administrador</h1>

      {pendingPayments.length === 0 ? (
        <div className="no-payments">
          <p>✅ No hay pagos pendientes de revisión.</p>
        </div>
      ) : (
        <div className="payments-table-container">
          <p>📋 <strong>{pendingPayments.length}</strong> pagos pendientes de revisión</p>
          
          <table className="payments-table">
            <thead>
              <tr>
                <th>Deportista</th>
                <th>Tipo de Pago</th>
                <th>Periodo</th>
                <th>Valor</th>
                <th>Subido el</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.map(payment => (
                <tr key={payment.id}>
                  <td>
                    <div>
                      <strong>{payment.athlete.user.firstName} {payment.athlete.user.lastName}</strong>
                      <br />
                      <small>ID: {payment.athlete.user.identification}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${payment.obligation.type.toLowerCase()}`}>
                      {payment.obligation.type === 'MONTHLY' ? '📅 Mensualidad' : '🎓 Matrícula'}
                    </span>
                  </td>
                  <td>
                    {payment.obligation.period || 'Renovación'}
                  </td>
                  <td>
                    <strong>${payment.obligation.baseAmount.toLocaleString()}</strong>
                  </td>
                  <td>
                    {new Date(payment.uploadedAt).toLocaleDateString('es-CO')}
                    <br />
                    <small>{new Date(payment.uploadedAt).toLocaleTimeString('es-CO')}</small>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        onClick={() => window.open(payment.receiptUrl, '_blank')}
                        className="btn-view"
                        title="Ver comprobante"
                      >
                        👁️ Ver
                      </button>
                      <button 
                        onClick={() => handleApprove(payment.id)}
                        className="btn-approve"
                        disabled={processing === payment.id}
                        title="Aprobar pago"
                      >
                        {processing === payment.id ? '⏳' : '✅'} Aprobar
                      </button>
                      <button 
                        onClick={() => handleReject(payment.id)}
                        className="btn-reject"
                        disabled={processing === payment.id}
                        title="Rechazar pago"
                      >
                        {processing === payment.id ? '⏳' : '❌'} Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPagos;
```

---

## 🎨 PASO 5: ESTILOS CSS BÁSICOS

### styles.css
```css
/* Gestión de Pagos */
.gestion-pagos {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.alert {
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 5px;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.payment-details p {
  margin: 10px 0;
}

.total {
  font-size: 1.2em;
  color: #2d3748;
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.mora-info {
  background: #fed7d7;
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
}

.text-danger {
  color: #e53e3e;
}

/* Upload */
.upload-section {
  margin-top: 15px;
  padding: 15px;
  background: #f7fafc;
  border-radius: 5px;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-form input[type="file"] {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.upload-form button {
  padding: 10px 20px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-form button:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

/* Admin Table */
.payments-table-container {
  overflow-x: auto;
}

.payments-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.payments-table th,
.payments-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.payments-table th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.badge.monthly {
  background: #e6fffa;
  color: #234e52;
}

.badge.enrollment_renewal {
  background: #fef5e7;
  color: #744210;
}

.action-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.action-buttons button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-view {
  background: #e2e8f0;
  color: #2d3748;
}

.btn-approve {
  background: #c6f6d5;
  color: #22543d;
}

.btn-reject {
  background: #fed7d7;
  color: #742a2a;
}

.action-buttons button:hover {
  opacity: 0.8;
}

.action-buttons button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## ✅ RESUMEN DE IMPLEMENTACIÓN

### Lo que tienes que hacer:

1. **Modificar tu componente Login** → Agregar lógica de restricciones
2. **Crear ProtectedRoute** → Bloquear rutas si está restringido  
3. **Crear GestionPagos** → Vista para deportistas
4. **Crear AdminPagos** → Vista para administradores
5. **Agregar estilos CSS** → Para que se vea bien

### Flujo final:
```
Login → ¿Restringido? → Sí: /gestion-pagos
                     → No: /dashboard

Rutas protegidas → Si restringido → Redirige a /gestion-pagos
```

### Backend necesario:
- ✅ Ya implementado
- Solo falta agregar middleware a tu ruta de login

¡Con esto tienes el sistema completo funcionando!