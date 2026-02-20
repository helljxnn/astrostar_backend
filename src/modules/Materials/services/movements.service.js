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
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.pages,
        },
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
        origen: data.origen,
        destino: data.destino || null,
        evento_id: data.evento_id || null,
        observaciones: data.observaciones || null,
        reference_id: data.reference_id || null,
        reference_type: data.reference_type || null,
        created_by_name: userName || null,
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

    // Origen
    if (!data.origen) {
      throw new Error('El origen es obligatorio');
    }

    const origenesValidos = [
      'Compra',
      'Donacion',
      'AjustePositivo',
      'AjusteNegativo',
      'UsoEvento',
      'Dano',
      'Perdida',
      'Entrega',
      'ConsumoInterno',
    ];

    if (!origenesValidos.includes(data.origen)) {
      throw new Error(`Origen inválido. Debe ser uno de: ${origenesValidos.join(', ')}`);
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
}

export default new MovementsService();
