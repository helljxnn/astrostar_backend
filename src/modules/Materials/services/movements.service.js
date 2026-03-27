import movementsRepository from "../repository/movements.repository.js";
import materialsRepository from "../repository/materials.repository.js";

class MovementsService {
  /**
   * Obtener todos los movimientos con paginación
   */
  async getAll({
    page = 1,
    limit = 10,
    materialId = null,
    tipo = null,
    origen = null,
    search = "",
    dateFrom = null,
    dateTo = null,
    inventarioDestino = null,
    tipoSalida = null,
  }) {
    try {
      const result = await movementsRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        materialId,
        tipo,
        origen,
        search: search.toString().trim(),
        dateFrom,
        dateTo,
        inventarioDestino,
        tipoSalida,
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
          message: "Movimiento no encontrado",
        };
      }

      return {
        success: true,
        data: movement,
      };
    } catch (error) {
throw error;
    }
  }

  /**
   * Register movement (ATOMIC TRANSACTION)
   * Main method for registering entries and exits
   */
  async registerMovement(data, userId, userName) {
    try {
      // 1. Validate data
      this.validateMovementData(data);

      // 2. Get material for validations
      const material = await materialsRepository.findById(data.material_id);
      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: "Material not found",
        };
      }

      if (material.estado !== "Activo") {
        return {
          success: false,
          statusCode: 400,
          message: "Cannot register movements on inactive materials",
        };
      }

      // 3. Determine inventory destination
      const inventoryDestination = data.inventario_destino || "FUNDACION";

      // 4. Prepare movement data
      const movementData = {
        material_id: data.material_id,
        material_nombre: material.nombre,
        categoria: material.categoria,
        tipo_movimiento: data.tipo_movimiento,
        cantidad: parseInt(data.cantidad),
        inventario_destino: inventoryDestination,
        evento_id: data.evento_id || null,
        observaciones: data.observaciones || null,
        reference_id: data.reference_id || null,
        reference_type: data.reference_type || null,
        created_by_name: userName || null,
        fecha_ingreso: data.fecha_ingreso || null,
        proveedor_id: data.proveedor_id ? parseInt(data.proveedor_id) : null,
        donacion_id: data.donacion_id ? parseInt(data.donacion_id) : null,
      };

      // 5. Register movement with transaction (automatically calculates and validates stock)
      const movement = await movementsRepository.registerMovement(
        movementData,
        userId,
      );

      return {
        success: true,
        data: movement,
        message: `${data.tipo_movimiento} movement registered successfully`,
      };
    } catch (error) {
// Specific errors
      if (
        error.message.includes("Insufficient stock") ||
        error.message.includes("Stock insuficiente")
      ) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }

      if (
        error.message.includes("not found") ||
        error.message.includes("no encontrado")
      ) {
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
      // 1. Verificar que el movimiento existe
      const existingMovement = await movementsRepository.findById(id);
      if (!existingMovement) {
        return {
          success: false,
          statusCode: 404,
          message: "Movimiento no encontrado",
        };
      }

      // 2. ❌ BLOQUEAR edición de movimientos automáticos del sistema
      const systemMovements = [
        "Salida",
        "Baja",
        "ASIGNACION_EVENTO",
        "REVERSION_ASIGNACION",
        "TRANSFERENCIA",
      ];

      if (systemMovements.includes(existingMovement.tipoMovimiento)) {
        return {
          success: false,
          statusCode: 403,
          message:
            "No se pueden editar movimientos automáticos del sistema. Solo se pueden editar ingresos manuales.",
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
      const movement = await movementsRepository.updateMovement(
        id,
        movementData,
      );

      return {
        success: true,
        data: movement,
        message: "Movimiento actualizado exitosamente",
      };
    } catch (error) {
throw error;
    }
  }

  /**
   * Eliminar movimiento (solo permitido para Entradas)
   */
  async deleteMovement(id) {
    try {
      // 1. Verificar que el movimiento existe
      const existingMovement = await movementsRepository.findById(id);
      if (!existingMovement) {
        return {
          success: false,
          statusCode: 404,
          message: "Movimiento no encontrado",
        };
      }

      // 2. ❌ BLOQUEAR eliminación de movimientos automáticos del sistema
      const systemMovements = [
        "Salida",
        "Baja",
        "ASIGNACION_EVENTO",
        "REVERSION_ASIGNACION",
        "TRANSFERENCIA",
      ];

      if (systemMovements.includes(existingMovement.tipoMovimiento)) {
        return {
          success: false,
          statusCode: 403,
          message:
            "No se pueden eliminar movimientos automáticos del sistema. Solo se pueden eliminar ingresos manuales.",
        };
      }

      // 3. Eliminar movimiento (esto debería revertir el stock también)
      await movementsRepository.deleteMovement(id);

      return {
        success: true,
        message: "Movimiento eliminado exitosamente",
      };
    } catch (error) {
throw error;
    }
  }

  /**
   * Obtener historial de movimientos de un material
   */
  async getMaterialHistory(materialId, limit = 10) {
    try {
      const movements = await movementsRepository.getHistoryByMaterial(
        materialId,
        limit,
      );

      return {
        success: true,
        data: movements,
      };
    } catch (error) {
throw error;
    }
  }

  /**
   * Obtener estadísticas de movimientos
   */
  async getStatistics(materialId = null, startDate = null, endDate = null) {
    try {
      const stats = await movementsRepository.getStatistics(
        materialId,
        startDate,
        endDate,
      );

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
throw error;
    }
  }

  /**
   * Obtener movimientos por rango de fechas
   */
  async getByDateRange(startDate, endDate, filters = {}) {
    try {
      const movements = await movementsRepository.findByDateRange(
        startDate,
        endDate,
        filters,
      );

      return {
        success: true,
        data: movements,
      };
    } catch (error) {
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
throw error;
    }
  }

  /**
   * Validate movement data
   */
  validateMovementData(data) {
    // Material
    if (!data.material_id) {
      throw new Error("Material is required");
    }

    // Movement type
    if (!data.tipo_movimiento) {
      throw new Error("Movement type is required");
    }

    if (!["Entrada", "Salida"].includes(data.tipo_movimiento)) {
      throw new Error('Movement type must be "Entrada" or "Salida"');
    }

    // Quantity
    if (!data.cantidad) {
      throw new Error("Quantity is required");
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error("Quantity must be a positive number");
    }

    // Specific validations for ENTRY
    if (data.tipo_movimiento === "Entrada") {
      // Inventory destination required
      if (!data.inventario_destino) {
        throw new Error("Inventory destination is required");
      }

      if (!["FUNDACION", "EVENTOS"].includes(data.inventario_destino)) {
        throw new Error("Destination must be FUNDACION or EVENTOS");
      }

      // Entry date optional but if provided must be valid
      if (data.fecha_ingreso) {
        const fechaIngreso = new Date(data.fecha_ingreso);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaIngreso.setHours(0, 0, 0, 0);

        if (fechaIngreso > hoy) {
          throw new Error("Entry date cannot be in the future");
        }
      }

      // proveedor_id is optional, but if sent must be valid
      if (data.proveedor_id && isNaN(parseInt(data.proveedor_id))) {
        throw new Error("Provider ID must be a valid number");
      }
    }

    // Observations
    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error("Observations cannot exceed 1000 characters");
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
        throw new Error("La fecha de ingreso no puede ser futura");
      }
    }

    // proveedor_id es opcional, pero si se envía debe ser válido
    if (data.proveedor_id && isNaN(parseInt(data.proveedor_id))) {
      throw new Error("El ID del proveedor debe ser un número válido");
    }

    // Observaciones
    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error("Las observaciones no pueden exceder 1000 caracteres");
    }
  }

  /**
   * Obtener todos los movimientos para reporte (SIN PAGINACIÓN)
   */
  async getAllForReport({
    search = "",
    materialId,
    tipoMovimiento,
    startDate,
    endDate,
    inventarioDestino,
    tipoSalida,
  }) {
    try {
      const movements = await movementsRepository.findAllForReport({
        search,
        materialId,
        tipoMovimiento,
        startDate,
        endDate,
        inventarioDestino,
        tipoSalida,
      });

      return {
        success: true,
        data: movements,
        message: `Se encontraron ${movements.length} movimientos para el reporte.`,
      };
    } catch (error) {
throw error;
    }
  }
}

export default new MovementsService();

