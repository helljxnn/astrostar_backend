# 🎨 Plan de Implementación Frontend - Sistema de Inventario Dual

## 📋 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

---

## FASE 1: ACTUALIZAR SERVICIOS (30 min)

### 1.1 Actualizar `materialsService.js`

**Agregar método de transferencia:**

```javascript
/**
 * Transfer stock between inventories
 */
export const transferStock = async (materialId, data) => {
  try {
    const response = await api.post(`/materials/${materialId}/transfer`, {
      from: data.from,
      to: data.to,
      cantidad: data.cantidad,
      observaciones: data.observaciones
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 1.2 Actualizar `movementsService.js`

**Modificar método de registro de entrada:**

```javascript
/**
 * Register entry movement
 */
export const registerEntry = async (data) => {
  try {
    const response = await api.post('/movements', {
      material_id: data.materialId,
      tipo_movimiento: 'Entrada',
      cantidad: data.cantidad,
      inventario_destino: data.inventarioDestino,  // FUNDACION o EVENTOS
      fecha_ingreso: data.fechaIngreso,
      proveedor_id: data.proveedorId,
      observaciones: data.observaciones
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
```

### 1.3 Crear `eventMaterialsService.js` ✨ NUEVO

```javascript
import api from './api';

/**
 * Get materials assigned to an event
 */
export const getEventMaterials = async (eventoId) => {
  try {
    const response = await api.get(`/events/${eventoId}/materials`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Assign material to event
 */
export const assignMaterial = async (eventoId, data) => {
  try {
    const response = await api.post(`/events/${eventoId}/materials`, {
      material_id: data.materialId,
      cantidad: data.cantidad,
      observaciones: data.observaciones
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Remove material assignment
 */
export const removeAssignment = async (eventoId, assignmentId) => {
  try {
    const response = await api.delete(`/events/${eventoId}/materials/${assignmentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export default {
  getEventMaterials,
  assignMaterial,
  removeAssignment
};
```

---

## FASE 2: ACTUALIZAR COMPONENTES EXISTENTES (1 hora)

### 2.1 Actualizar `MaterialsCatalog.jsx`

**Cambios en la tabla:**

```jsx
// ANTES
<th>Stock Disponible</th>
<th>Stock Eventos</th>
<th>Total</th>

// AHORA
<th>Fundación</th>
<th>Eventos</th>
<th>Total</th>
```

**Cambios en las filas:**

```jsx
// ANTES
<td>{material.stockDisponible}</td>
<td>{material.stockEventos}</td>
<td>{material.stockTotal}</td>

// AHORA
<td>{material.stockFundacion}</td>
<td>{material.stockEventos}</td>
<td>{material.stockTotal}</td>
```

**Agregar botón de transferencia:**

```jsx
<IconButton
  icon="swap"
  tooltip="Transferir stock"
  onClick={() => openTransferModal(material)}
/>
```

### 2.2 Actualizar `MaterialModal.jsx` (Ingreso)

**Agregar selector de inventario destino:**

```jsx
<FormControl fullWidth required>
  <InputLabel>Destino del Ingreso</InputLabel>
  <Select
    name="inventarioDestino"
    value={formData.inventarioDestino}
    onChange={handleChange}
  >
    <MenuItem value="">Seleccionar...</MenuItem>
    <MenuItem value="FUNDACION">Inventario Fundación</MenuItem>
    <MenuItem value="EVENTOS">Inventario Eventos</MenuItem>
  </Select>
  <FormHelperText>
    Fundación: Uso interno diario | Eventos: Material para eventos
  </FormHelperText>
</FormControl>
```

**Eliminar:**
- ❌ Campo `destinoStock`
- ❌ Selector de evento (ya no se auto-asigna)

---

## FASE 3: CREAR NUEVOS COMPONENTES (1.5 horas)

### 3.1 Crear `TransferModal.jsx` ✨ NUEVO

```jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert
} from '@mui/material';
import { transferStock } from '../../services/materialsService';

const TransferModal = ({ open, onClose, material, onSuccess }) => {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    cantidad: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stockOrigen = formData.from === 'FUNDACION' 
    ? material?.stockFundacion 
    : material?.stockEventos;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await transferStock(material.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al transferir stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transferir Stock - {material?.nombre}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>Desde</InputLabel>
            <Select
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value, to: '' })}
            >
              <MenuItem value="FUNDACION">Inventario Fundación</MenuItem>
              <MenuItem value="EVENTOS">Inventario Eventos</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth required sx={{ mb: 2 }} disabled={!formData.from}>
            <InputLabel>Hacia</InputLabel>
            <Select
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            >
              <MenuItem value="FUNDACION" disabled={formData.from === 'FUNDACION'}>
                Inventario Fundación
              </MenuItem>
              <MenuItem value="EVENTOS" disabled={formData.from === 'EVENTOS'}>
                Inventario Eventos
              </MenuItem>
            </Select>
          </FormControl>

          {formData.from && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Stock disponible en {formData.from}: {stockOrigen}
            </Alert>
          )}

          <TextField
            fullWidth
            required
            type="number"
            label="Cantidad"
            value={formData.cantidad}
            onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
            inputProps={{ min: 1, max: stockOrigen }}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !formData.from || !formData.to}
          >
            {loading ? 'Transfiriendo...' : 'Transferir'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TransferModal;
```

### 3.2 Crear `AssignMaterialModal.jsx` ✨ NUEVO

```jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert
} from '@mui/material';
import { getMaterials } from '../../services/materialsService';
import { assignMaterial } from '../../services/eventMaterialsService';

const AssignMaterialModal = ({ open, onClose, eventoId, onSuccess }) => {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [formData, setFormData] = useState({
    materialId: '',
    cantidad: '',
    observaciones: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      loadMaterials();
    }
  }, [open]);

  const loadMaterials = async () => {
    try {
      const response = await getMaterials({ estado: 'Activo' });
      // Filter only materials with stock in EVENTOS
      const materialsWithStock = response.data.filter(m => m.stockEventos > 0);
      setMaterials(materialsWithStock);
    } catch (err) {
      setError('Error al cargar materiales');
    }
  };

  const handleMaterialChange = (e) => {
    const materialId = e.target.value;
    const material = materials.find(m => m.id === materialId);
    setSelectedMaterial(material);
    setFormData({ ...formData, materialId, cantidad: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await assignMaterial(eventoId, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al asignar material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar Material al Evento</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel>Material</InputLabel>
            <Select
              value={formData.materialId}
              onChange={handleMaterialChange}
            >
              {materials.map(material => (
                <MenuItem key={material.id} value={material.id}>
                  {material.nombre} (Disponible: {material.stockEventos})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedMaterial && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Stock disponible en eventos: {selectedMaterial.stockEventos}
            </Alert>
          )}

          <TextField
            fullWidth
            required
            type="number"
            label="Cantidad"
            value={formData.cantidad}
            onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
            inputProps={{ 
              min: 1, 
              max: selectedMaterial?.stockEventos || 0 
            }}
            disabled={!selectedMaterial}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Observaciones (opcional)"
            value={formData.observaciones}
            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !formData.materialId}
          >
            {loading ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AssignMaterialModal;
```

### 3.3 Crear `EventMaterialsSection.jsx` ✨ NUEVO

```jsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { getEventMaterials, removeAssignment } from '../../services/eventMaterialsService';
import AssignMaterialModal from './AssignMaterialModal';

const EventMaterialsSection = ({ eventoId, eventoEstado }) => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, [eventoId]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const response = await getEventMaterials(eventoId);
      setMaterials(response.data);
    } catch (err) {
      setError('Error al cargar materiales');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (assignmentId) => {
    if (!confirm('¿Está seguro de eliminar esta asignación? El stock será devuelto.')) {
      return;
    }

    try {
      await removeAssignment(eventoId, assignmentId);
      loadMaterials();
    } catch (err) {
      alert('Error al eliminar asignación');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Materiales del Evento
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Button
          variant="contained"
          onClick={() => setAssignModalOpen(true)}
          disabled={eventoEstado === 'FINALIZADO'}
          sx={{ mb: 2 }}
        >
          + Asignar Material
        </Button>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Material</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Fecha Asignación</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay materiales asignados
                </TableCell>
              </TableRow>
            ) : (
              materials.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.material.nombre}</TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell>{new Date(item.fechaAsignacion).toLocaleDateString()}</TableCell>
                  <TableCell>{item.createdByName || 'N/A'}</TableCell>
                  <TableCell>
                    {eventoEstado !== 'FINALIZADO' && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemove(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <AssignMaterialModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        eventoId={eventoId}
        onSuccess={loadMaterials}
      />
    </Card>
  );
};

export default EventMaterialsSection;
```

---

## FASE 4: INTEGRAR EN VISTAS EXISTENTES (30 min)

### 4.1 Actualizar `EventDetail.jsx`

**Agregar sección de materiales:**

```jsx
import EventMaterialsSection from '../components/EventMaterialsSection';

// Dentro del componente, después de la información del evento:
<EventMaterialsSection 
  eventoId={evento.id} 
  eventoEstado={evento.estado}
/>
```

### 4.2 Actualizar `MaterialsCatalog.jsx`

**Agregar estado y modal de transferencia:**

```jsx
import TransferModal from '../components/TransferModal';

const [transferModalOpen, setTransferModalOpen] = useState(false);
const [selectedMaterial, setSelectedMaterial] = useState(null);

const openTransferModal = (material) => {
  setSelectedMaterial(material);
  setTransferModalOpen(true);
};

// En el render:
<TransferModal
  open={transferModalOpen}
  onClose={() => setTransferModalOpen(false)}
  material={selectedMaterial}
  onSuccess={loadMaterials}
/>
```

---

## FASE 5: PRUEBAS (1 hora)

### Checklist de Pruebas:

- [ ] Listar materiales muestra stockFundacion y stockEventos
- [ ] Ingresar material a FUNDACION aumenta stockFundacion
- [ ] Ingresar material a EVENTOS aumenta stockEventos
- [ ] Transferir de EVENTOS a FUNDACION funciona correctamente
- [ ] Transferir de FUNDACION a EVENTOS funciona correctamente
- [ ] Validación de stock insuficiente en transferencias
- [ ] Asignar material a evento descuenta de stockEventos
- [ ] Solo se pueden asignar materiales con stockEventos > 0
- [ ] Eliminar asignación devuelve stock a stockEventos
- [ ] No se puede asignar a evento finalizado
- [ ] Mensajes de error claros y útiles

---

## 📊 TIEMPO ESTIMADO TOTAL: 4-5 horas

- Fase 1: 30 min
- Fase 2: 1 hora
- Fase 3: 1.5 horas
- Fase 4: 30 min
- Fase 5: 1 hora
- Buffer: 30 min

---

## 🚨 PUNTOS CRÍTICOS A VERIFICAR

1. **Cambio de nombres de campos:**
   - `destinoStock` → `inventario_destino`
   - `stockDisponible` → `stockFundacion`
   - Valores: `USO_INTERNO` → `FUNDACION`

2. **Validaciones:**
   - Stock suficiente antes de transferir
   - Stock suficiente antes de asignar
   - Inventarios diferentes en transferencias

3. **Mensajes de error:**
   - Mostrar mensajes claros del backend
   - Manejar errores de red
   - Feedback visual al usuario

4. **Estados de carga:**
   - Deshabilitar botones durante operaciones
   - Mostrar spinners/loaders
   - Actualizar datos después de operaciones

---

## 📝 NOTAS FINALES

- Todos los endpoints están documentados en `API_ENDPOINTS_DUAL_INVENTORY.md`
- El backend está 100% funcional y probado
- Usa las validaciones del backend (no duplicar en frontend)
- Mantén la UI simple y clara
- Prioriza la experiencia del usuario

---

**Creado:** 23 de Febrero de 2026  
**Versión:** 1.0.0  
**Estado:** Listo para implementar
