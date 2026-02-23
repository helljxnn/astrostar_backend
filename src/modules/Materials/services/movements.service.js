import movementsRepository from '../repository/movements.repository.js';
import materialsRepository from '../repository/materials.repository.js';

class MovementsService {
  /**
   * Obtener todos los movimientos con paginación
   */
  async getAll({ page = 1, limit = 10, materialId = null, tipo = null, origen = null, search = '' }) {
    try {
      const result = await movementsRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        materialId,
        tipo,
        origen,
        search: search.toString().trim(),
      });

      return {
        success: true,
        data: result.movements,
        total: result.total,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      };
    } catch (error) {
      console.error('Service error - getAll:', error);
      throw error;
    }
  }

  /**
   * Obtener movimiento por ID
   */
  async getById(id) {
    try {
      const movement = await movementsRepository.findById(id);

      if (!movement) {
        return {
          success: false,
          statusCode: 404,
          message: 'Movimiento no encontrado',
        };
      }

      return {
        success: true,
        data: movement,
      };
    } catch (error) {
      console.error('Service error - getById:', error);
      throw error;
    }
  }

  /**
   * Registrar movimiento (TRANSACCIÓN ATÓMICA)
   * Este es el método principal para registrar entradas y salidas
   */
  async registerMovement(data, userId, userName) {
    try {
      console.log('🔄 Iniciando registro de movimiento...');

      // 1. Validar datos
      this.validateMovementData(data);

      // 2. Obtener material para validaciones
      const material = await materialsRepository.findById(data.material_id);
      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: 'Material no encontrado',
        };
      }

      if (material.estado !== 'Activo') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se pueden registrar movimientos en materiales inactivos',
        };
      }

      // 3. Preparar datos del movimiento
      const movementData = {
        material_id: data.material_id,
        material_nombre: material.nombre,
        categoria: material.categoria,
        tipo_movimiento: data.tipo_movimiento,
        cantidad: parseInt(data.cantidad),
        destino: data.destino || null,
        destino_stock: data.destinoStock || null,  // NUEVO: Destino del ingreso
        evento_id: data.evento_id || null,
        observaciones: data.observaciones || null,
        reference_id: data.reference_id || null,
        reference_type: data.reference_type || null,
        created_by_name: userName || null,
        // Nuevos campos para Ingresos
        fecha_ingreso: data.fechaIngreso || null,
        proveedor_id: data.proveedor_id ? parseInt(data.proveedor_id) : null,
      };

      // 4. Registrar movimiento con transacción (calcula y valida stock automáticamente)
      const movement = await movementsRepository.registerMovement(movementData, userId);

      console.log('✅ Movimiento registrado exitosamente');

      return {
        success: true,
        data: movement,
        message: `Movimiento de ${data.tipo_movimiento.toLowerCase()} registrado exitosamente`,
      };
    } catch (error) {
      console.error('❌ Error al registrar movimiento:', error.message);

      // Errores específicos
      if (error.message.includes('Stock insuficiente')) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }

      if (error.message.includes('Material no encontrado')) {
        return {
          success: false,
          statusCode: 404,
          message: error.message,
        };
      }

      throw error;
    }
  }

  /**
   * Actualizar movimiento existente
   */
  async updateMovement(id, data, userId, userName) {
    try {
      console.log('🔄 Iniciando actualización de movimiento...');

      // 1. Verificar que el movimiento existe
      const existingMovement = await movementsRepository.findById(id);
      if (!existingMovement) {
        return {
          success: false,
          statusCode: 404,
          message: 'Movimiento no encontrado',
        };
      }

      // 2. ❌ BLOQUEAR edición de bajas y salidas
      if (existingMovement.tipoMovimiento === 'Salida' || existingMovement.tipoMovimiento === 'Baja') {
        return {
          success: false,
          statusCode: 403,
          message: 'No se pueden editar las bajas de material. Solo se pueden editar ingresos.',
        };
      }

      // 3. Validar datos de actualización
      this.validateUpdateData(data);

      // 4. Preparar datos del movimiento (solo campos editables)
      const movementData = {
        observaciones: data.observaciones || null,
        fecha_ingreso: data.fechaIngreso || null,
        proveedor_id: data.proveedor_id ? parseInt(data.proveedor_id) : null,
      };

      // 5. Actualizar movimiento
      const movement = await movementsRepository.updateMovement(id, movementData);

      console.log('✅ Movimiento actualizado exitosamente');

      return {
        success: true,
        data: movement,
        message: 'Movimiento actualizado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error al actualizar movimiento:', error.message);
      throw error;
    }
  }

  /**
   * Eliminar movimiento (solo permitido para Entradas)
   */
  async deleteMovement(id) {
    try {
      console.log('🔄 Iniciando eliminación de movimiento...');

      // 1. Verificar que el movimiento existe
      const existingMovement = await movementsRepository.findById(id);
      if (!existingMovement) {
        return {
          success: false,
          statusCode: 404,
          message: 'Movimiento no encontrado',
        };
      }

      // 2. ❌ BLOQUEAR eliminación de bajas y salidas
      if (existingMovement.tipoMovimiento === 'Salida' || existingMovement.tipoMovimiento === 'Baja') {
        return {
          success: false,
          statusCode: 403,
          message: 'No se pueden eliminar las bajas de material. Solo se pueden eliminar ingresos.',
        };
      }

      // 3. Eliminar movimiento (esto debería revertir el stock también)
      await movementsRepository.deleteMovement(id);

      console.log('✅ Movimiento eliminado exitosamente');

      return {
        success: true,
        message: 'Movimiento eliminado exitosamente',
      };
    } catch (error) {
      console.error('❌ Error al eliminar movimiento:', error.message);
      throw error;
    }
  }

  /**
   * Obtener historial de movimientos de un material
   */
  async getMaterialHistory(materialId, limit = 10) {
    try {
      const movements = await movementsRepository.getHistoryByMaterial(materialId, limit);

      return {
        success: true,
        data: movements,
      };
    } catch (error) {
      console.error('Service error - getMaterialHistory:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de movimientos
   */
  async getStatistics(materialId = null, startDate = null, endDate = null) {
    try {
      const stats = await movementsRepository.getStatistics(materialId, startDate, endDate);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Service error - getStatistics:', error);
      throw error;
    }
  }

  /**
   * Obtener movimientos por rango de fechas
   */
  async getByDateRange(startDate, endDate, filters = {}) {
    try {
      const movements = await movementsRepository.findByDateRange(startDate, endDate, filters);

      return {
        success: true,
        data: movements,
      };
    } catch (error) {
      console.error('Service error - getByDateRange:', error);
      throw error;
    }
  }

  /**
   * Obtener últimos movimientos (para dashboard)
   */
  async getRecentMovements(limit = 5) {
    try {
      const movements = await movementsRepository.getRecentMovements(limit);

      return {
        success: true,
        data: movements,
      };
    } catch (error) {
      console.error('Service error - getRecentMovements:', error);
      throw error;
    }
  }

  /**
   * Validar datos del movimiento
   */
  validateMovementData(data) {
    // Material
    if (!data.material_id) {
      throw new Error('El material es obligatorio');
    }

    // Tipo de movimiento
    if (!data.tipo_movimiento) {
      throw new Error('El tipo de movimiento es obligatorio');
    }

    if (!['Entrada', 'Salida'].includes(data.tipo_movimiento)) {
      throw new Error('El tipo de movimiento debe ser "Entrada" o "Salida"');
    }

    // Cantidad
    if (!data.cantidad) {
      throw new Error('La cantidad es obligatoria');
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error('La cantidad debe ser un número positivo');
    }

    // Validaciones específicas para ENTRADA
    if (data.tipo_movimiento === 'Entrada') {
      // Destino del stock obligatorio
      if (!data.destinoStock) {
        throw new Error('El destino del ingreso es obligatorio');
      }

      if (!['USO_INTERNO', 'EVENTOS'].includes(data.destinoStock)) {
        throw new Error('El destino debe ser USO_INTERNO o EVENTOS');
      }

      // Fecha de ingreso obligatoria
      if (!data.fechaIngreso) {
        throw new Error('La fecha de ingreso es obligatoria');
      }

      // Validar que la fecha no sea futura
      const fechaIngreso = new Date(data.fechaIngreso);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaIngreso.setHours(0, 0, 0, 0);

      if (fechaIngreso > hoy) {
        throw new Error('La fecha de ingreso no puede ser futura');
      }

      // proveedor_id es opcional, pero si se envía debe ser válido
      if (data.proveedor_id && isNaN(parseInt(data.proveedor_id))) {
        throw new Error('El ID del proveedor debe ser un número válido');
      }
    }

    // Destino (solo para salidas)
    if (data.tipo_movimiento === 'Salida' && data.destino) {
      const destinosValidos = ['Evento', 'ConsumoInterno', 'Dano', 'Perdida', 'Entrega'];

      if (!destinosValidos.includes(data.destino)) {
        throw new Error(`Destino inválido. Debe ser uno de: ${destinosValidos.join(', ')}`);
      }

      // Si el destino es Evento, el evento_id es obligatorio
      if (data.destino === 'Evento' && !data.evento_id) {
        throw new Error('El ID del evento es obligatorio cuando el destino es "Evento"');
      }
    }

    // Observaciones
    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error('Las observaciones no pueden exceder 1000 caracteres');
    }
  }

  /**
   * Validar datos de actualización de movimiento
   */
  validateUpdateData(data) {
    // Fecha de ingreso (si se envía)
    if (data.fechaIngreso) {
      const fechaIngreso = new Date(data.fechaIngreso);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaIngreso.setHours(0, 0, 0, 0);

      if (fechaIngreso > hoy) {
        throw new Error('La fecha de ingreso no puede ser futura');
      }
    }

    // proveedor_id es opcional, pero si se envía debe ser válido
    if (data.proveedor_id && isNaN(parseInt(data.proveedor_id))) {
      throw new Error('El ID del proveedor debe ser un número válido');
    }

    // Observaciones
    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error('Las observaciones no pueden exceder 1000 caracteres');
    }
  }
}

export default new MovementsService();
