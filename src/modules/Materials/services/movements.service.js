import movementsRepository from "../repository/movements.repository.js";
import materialsRepository from "../repository/materials.repository.js";

class MovementsService {
  createValidationError(message) {
    const validationError = new Error(message);
    validationError.statusCode = 400;
    return validationError;
  }

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
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
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
      if (error?.statusCode) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
        };
      }
      throw error;
    }
  }

  async getById(id) {
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
  }

  async registerMovement(data, userId, userName) {
    try {
      this.validateMovementData(data);

      const material = await materialsRepository.findById(data.material_id);
      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: "Material no encontrado",
        };
      }

      if (material.estado !== "Activo") {
        return {
          success: false,
          statusCode: 400,
          message: "No se pueden registrar movimientos para materiales inactivos",
        };
      }

      const inventoryDestination = data.inventario_destino || "FUNDACION";

      const movementData = {
        material_id: data.material_id,
        material_nombre: material.nombre,
        categoria: material.categoria,
        tipo_movimiento: data.tipo_movimiento,
        cantidad: parseInt(data.cantidad, 10),
        inventario_destino: inventoryDestination,
        evento_id: data.evento_id || null,
        observaciones: data.observaciones || null,
        reference_id: data.reference_id || null,
        reference_type: data.reference_type || null,
        created_by_name: userName || null,
        fecha_ingreso: data.fecha_ingreso || null,
        proveedor_id: data.proveedor_id ? parseInt(data.proveedor_id, 10) : null,
        donacion_id: data.donacion_id ? parseInt(data.donacion_id, 10) : null,
      };

      const movement = await movementsRepository.registerMovement(
        movementData,
        userId,
      );

      return {
        success: true,
        data: movement,
        message: `Movimiento ${data.tipo_movimiento} registrado correctamente`,
      };
    } catch (error) {
      if (error?.statusCode) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
        };
      }

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

  async updateMovement(id, data) {
    try {
      const existingMovement = await movementsRepository.findById(id);
      if (!existingMovement) {
        return {
          success: false,
          statusCode: 404,
          message: "Movimiento no encontrado",
        };
      }

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

      this.validateUpdateData(data);

      const movementData = {
        observaciones: data.observaciones || null,
        fecha_ingreso: data.fechaIngreso || null,
        proveedor_id: data.proveedor_id ? parseInt(data.proveedor_id, 10) : null,
      };

      const movement = await movementsRepository.updateMovement(id, movementData);

      return {
        success: true,
        data: movement,
        message: "Movimiento actualizado exitosamente",
      };
    } catch (error) {
      if (error?.statusCode) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
        };
      }
      throw error;
    }
  }

  async deleteMovement(id) {
    try {
      const existingMovement = await movementsRepository.findById(id);
      if (!existingMovement) {
        return {
          success: false,
          statusCode: 404,
          message: "Movimiento no encontrado",
        };
      }

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

      await movementsRepository.deleteMovement(id);

      return {
        success: true,
        message: "Movimiento eliminado exitosamente",
      };
    } catch (error) {
      if (
        error.message.includes("Cannot delete movement because it would leave stock negative")
      ) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }
      throw error;
    }
  }

  async getMaterialHistory(materialId, limit = 10) {
    const movements = await movementsRepository.getHistoryByMaterial(
      materialId,
      limit,
    );

    return {
      success: true,
      data: movements,
    };
  }

  async getStatistics(materialId = null, startDate = null, endDate = null) {
    const stats = await movementsRepository.getStatistics(
      materialId,
      startDate,
      endDate,
    );

    return {
      success: true,
      data: stats,
    };
  }

  async getByDateRange(startDate, endDate, filters = {}) {
    const movements = await movementsRepository.findByDateRange(
      startDate,
      endDate,
      filters,
    );

    return {
      success: true,
      data: movements,
    };
  }

  async getRecentMovements(limit = 5) {
    const movements = await movementsRepository.getRecentMovements(limit);

    return {
      success: true,
      data: movements,
    };
  }

  validateMovementData(data) {
    if (!data || typeof data !== "object") {
      throw this.createValidationError("Datos inválidos del movimiento");
    }

    if (!data.material_id || Number.isNaN(parseInt(data.material_id, 10))) {
      throw this.createValidationError("El material es obligatorio");
    }

    if (!data.tipo_movimiento) {
      throw this.createValidationError("El tipo de movimiento es obligatorio");
    }

    if (!["Entrada", "Salida"].includes(data.tipo_movimiento)) {
      throw this.createValidationError(
        'El tipo de movimiento debe ser "Entrada" o "Salida"',
      );
    }

    if (data.cantidad === undefined || data.cantidad === null || data.cantidad === "") {
      throw this.createValidationError("La cantidad es obligatoria");
    }

    const cantidad = parseInt(data.cantidad, 10);
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      throw this.createValidationError("La cantidad debe ser un número positivo");
    }

    if (data.tipo_movimiento === "Entrada") {
      if (!data.inventario_destino) {
        throw this.createValidationError("El destino de inventario es obligatorio");
      }

      if (!["FUNDACION", "EVENTOS"].includes(data.inventario_destino)) {
        throw this.createValidationError(
          "El destino debe ser FUNDACION o EVENTOS",
        );
      }

      if (data.fecha_ingreso) {
        const fechaIngreso = new Date(data.fecha_ingreso);
        if (Number.isNaN(fechaIngreso.getTime())) {
          throw this.createValidationError("La fecha de ingreso no es válida");
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        fechaIngreso.setHours(0, 0, 0, 0);

        if (fechaIngreso > hoy) {
          throw this.createValidationError("La fecha de ingreso no puede ser futura");
        }
      }

      if (
        data.proveedor_id !== undefined &&
        data.proveedor_id !== null &&
        data.proveedor_id !== "" &&
        Number.isNaN(parseInt(data.proveedor_id, 10))
      ) {
        throw this.createValidationError(
          "El ID del proveedor debe ser un número válido",
        );
      }
    }

    if (
      data.observaciones &&
      typeof data.observaciones === "string" &&
      data.observaciones.length > 1000
    ) {
      throw this.createValidationError(
        "Las observaciones no pueden exceder 1000 caracteres",
      );
    }
  }

  validateUpdateData(data) {
    if (!data || typeof data !== "object") {
      throw this.createValidationError("Datos inválidos para actualizar");
    }

    if (data.fechaIngreso) {
      const fechaIngreso = new Date(data.fechaIngreso);
      if (Number.isNaN(fechaIngreso.getTime())) {
        throw this.createValidationError("La fecha de ingreso no es válida");
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaIngreso.setHours(0, 0, 0, 0);

      if (fechaIngreso > hoy) {
        throw this.createValidationError("La fecha de ingreso no puede ser futura");
      }
    }

    if (
      data.proveedor_id !== undefined &&
      data.proveedor_id !== null &&
      data.proveedor_id !== "" &&
      Number.isNaN(parseInt(data.proveedor_id, 10))
    ) {
      throw this.createValidationError(
        "El ID del proveedor debe ser un número válido",
      );
    }

    if (
      data.observaciones &&
      typeof data.observaciones === "string" &&
      data.observaciones.length > 1000
    ) {
      throw this.createValidationError(
        "Las observaciones no pueden exceder 1000 caracteres",
      );
    }
  }

  async getAllForReport({
    search = "",
    materialId,
    tipoMovimiento,
    startDate,
    endDate,
    inventarioDestino,
    tipoSalida,
  }) {
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
  }
}

export default new MovementsService();
