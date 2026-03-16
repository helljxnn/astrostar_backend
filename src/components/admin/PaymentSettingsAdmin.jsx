import React, { useState, useEffect } from 'react';

const PaymentSettingsAdmin = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/payment-settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
        setFormData(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseInt(value) || 0
    }));
  };

  const handleSave = async () => {
    if (!confirm('¿Actualizar configuración de pagos?')) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/payment-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
        alert('✅ Configuración actualizada exitosamente');
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('❌ Error al actualizar configuración');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="payment-settings-loading">
        <p>⏳ Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="payment-settings-admin">
      <div className="settings-header">
        <h1>⚙️ Configuración de Pagos</h1>
        <p>Administra los valores y políticas del sistema de pagos</p>
      </div>

      <div className="settings-form">
        <div className="settings-section">
          <h3>💰 Valores de Pago</h3>
          
          <div className="form-group">
            <label>Mensualidad</label>
            <input
              type="number"
              value={formData.monthlyAmount || ''}
              onChange={(e) => handleInputChange('monthlyAmount', e.target.value)}
              placeholder="Ej: 50000"
              min="1000"
              max="10000000"
            />
            <small>Valor actual: {formatCurrency(settings?.monthlyAmount || 0)}</small>
          </div>

          <div className="form-group">
            <label>Renovación de Matrícula</label>
            <input
              type="number"
              value={formData.enrollmentAmount || ''}
              onChange={(e) => handleInputChange('enrollmentAmount', e.target.value)}
              placeholder="Ej: 100000"
              min="1000"
              max="10000000"
            />
            <small>Valor actual: {formatCurrency(settings?.enrollmentAmount || 0)}</small>
          </div>

          <div className="form-group">
            <label>Mora Diaria</label>
            <input
              type="number"
              value={formData.lateFeeDaily || ''}
              onChange={(e) => handleInputChange('lateFeeDaily', e.target.value)}
              placeholder="Ej: 2000"
              min="0"
              max="50000"
            />
            <small>Valor actual: {formatCurrency(settings?.lateFeeDaily || 0)} por día</small>
          </div>
        </div>

        <div className="settings-section">
          <h3>📅 Políticas de Tiempo</h3>
          
          <div className="form-group">
            <label>Días de Gracia</label>
            <input
              type="number"
              value={formData.graceDays || ''}
              onChange={(e) => handleInputChange('graceDays', e.target.value)}
              placeholder="Ej: 5"
              min="1"
              max="15"
            />
            <small>Días del 1 al {settings?.graceDays || 0} para pagar sin mora</small>
          </div>

          <div className="form-group">
            <label>Días Máximos de Mora</label>
            <input
              type="number"
              value={formData.maxLateDaysMonthly || ''}
              onChange={(e) => handleInputChange('maxLateDaysMonthly', e.target.value)}
              placeholder="Ej: 15"
              min="1"
              max="90"
            />
            <small>Después de {settings?.maxLateDaysMonthly || 0} días se bloquea el acceso</small>
          </div>
        </div>

        <div className="settings-actions">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-save"
          >
            {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
          
          <button 
            onClick={() => setFormData(settings)}
            className="btn-reset"
          >
            🔄 Restablecer
          </button>
        </div>
      </div>

      <div className="settings-info">
        <h4>ℹ️ Información Importante</h4>
        <ul>
          <li>Los cambios afectan solo a nuevas obligaciones</li>
          <li>Las obligaciones existentes mantienen su valor original</li>
          <li>Los cambios se aplican inmediatamente en el sistema</li>
          <li>Se recomienda notificar a los usuarios sobre cambios de precios</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentSettingsAdmin;
