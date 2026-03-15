import materialsService from "../services/materials.service.js";

class MaterialsController {
  /**
   * GET /api/materials/materials
   * Listar todos los materiales con paginación
   */
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        estado,
        categoriaId,
        stockType,
      } = req.query;

      const result = await materialsService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        estado,
        categoriaId: categoriaId ? parseInt(categoriaId) : null,
        stockType,
      });

      return res.json(result);
    } catch (error) {
      console.error("Controller error - getAll:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener materiales",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/materials/:id
   * Obtener material por ID
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }

      const result = await materialsService.getById(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Controller error - getById:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/materials/materials
   * Crear nuevo material
   */
  async create(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await materialsService.create(req.body, userId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error("Controller error - create:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear material",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * PUT /api/materials/materials/:id
   * Actualizar material
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await materialsService.update(
        parseInt(id),
        req.body,
        userId,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Controller error - update:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar material",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * PATCH /api/materials/materials/:id/status
   * Cambiar estado de material
   */
  async toggleStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await materialsService.toggleStatus(parseInt(id), userId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Controller error - toggleStatus:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * DELETE /api/materials/materials/:id
   * Eliminar material (solo si no tiene movimientos)
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }

      const result = await materialsService.delete(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      console.error("Controller error - delete:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar material",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/materials/:id/history
   * Obtener historial de movimientos de un material
   */
  async getHistory(req, res) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }

      const result = await materialsService.getMovementHistory(
        parseInt(id),
        parseInt(limit),
      );

      return res.json(result);
    } catch (error) {
      console.error("Controller error - getHistory:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/materials/check-name
   * Verificar disponibilidad de nombre en categoría
   */
  async checkName(req, res) {
    try {
      const { nombre, categoriaId, excludeId } = req.query;

      if (!nombre) {
        return res.status(400).json({
          success: false,
          message: "El nombre es requerido",
        });
      }

      if (!categoriaId) {
        return res.status(400).json({
          success: false,
          message: "La categoría es requerida",
        });
      }

      const result = await materialsService.checkNameAvailability(
        nombre,
        parseInt(categoriaId),
        excludeId ? parseInt(excludeId) : null,
      );

      return res.json(result);
    } catch (error) {
      console.error("Controller error - checkName:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * POST /api/materials/materials/:id/discharge
   * Registrar baja de material
   */
  async registerDischarge(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userName = req.user
        ? `${req.user.firstName} ${req.user.lastName}`
        : null;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await materialsService.registerDischarge(
        parseInt(id),
        req.body,
        userId,
        userName,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error("Controller error - registerDischarge:", error);

      // Si el error es de validación de negocio, devolver el mensaje específico
      if (error.message && error.message.includes("planificado en")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al registrar baja",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/materials/:id/future-assignments
   * Verificar si un material tiene asignaciones futuras
   */
  async checkFutureAssignments(req, res) {
    try {
      const { id } = req.params;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID inválido",
        });
      }

      const result = await materialsService.checkFutureAssignments(
        parseInt(id),
      );

      return res.json(result);
    } catch (error) {
      console.error("Controller error - checkFutureAssignments:", error);
      return res.status(500).json({
        success: false,
        message: "Error al verificar asignaciones",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }

  /**
   * GET /api/materials/materials/report
   * Obtener todos los materiales para reporte (SIN PAGINACIÓN)
   */
  async getAllForReport(req, res) {
    try {
      const { search = "", status, categoriaId, stockMin, stockMax } = req.query;

      const result = await materialsService.getAllForReport({
        search,
        status,
        categoriaId: categoriaId ? parseInt(categoriaId) : undefined,
        stockMin: stockMin ? parseInt(stockMin) : undefined,
        stockMax: stockMax ? parseInt(stockMax) : undefined,
      });

      return res.json(result);
    } catch (error) {
      console.error("Controller error - getAllForReport:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener materiales para reporte",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

export default new MaterialsController();
