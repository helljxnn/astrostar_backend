import categoriesService from "../services/categories.service.js";

class CategoriesController {
  constructor() {
    this.getAll = this.getAll.bind(this);
    this.getActive = this.getActive.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
    this.delete = this.delete.bind(this);
    this.checkName = this.checkName.bind(this);
    this.getAllForReport = this.getAllForReport.bind(this);
  }

  parsePositiveInt(value, field, defaultValue = null) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return defaultValue;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed < 1) {
      const validationError = new Error(`El campo "${field}" debe ser un entero positivo`);
      validationError.statusCode = 400;
      throw validationError;
    }
    return parsed;
  }

  parseLimit(value, defaultValue = 10) {
    const parsed = this.parsePositiveInt(value, "limit", defaultValue);
    if (parsed > 100) {
      const validationError = new Error('El campo "limit" no puede ser mayor a 100');
      validationError.statusCode = 400;
      throw validationError;
    }
    return parsed;
  }

  handleControllerError(res, error, fallbackMessage) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: fallbackMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }

  /**
   * GET /api/materials/categories
   */
  async getAll(req, res) {
    try {
      const { search = "", estado } = req.query;
      const page = this.parsePositiveInt(req.query.page, "page", 1);
      const limit = this.parseLimit(req.query.limit, 10);

      const result = await categoriesService.getAll({
        page,
        limit,
        search,
        estado,
      });

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al obtener categorias",
      );
    }
  }

  /**
   * GET /api/materials/categories/active
   */
  async getActive(req, res) {
    try {
      const result = await categoriesService.getActiveCategories();
      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  /**
   * GET /api/materials/categories/:id
   */
  async getById(req, res) {
    try {
      const id = this.parsePositiveInt(req.params.id, "id");
      const result = await categoriesService.getById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  /**
   * POST /api/materials/categories
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

      const result = await categoriesService.create(req.body, userId);
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al crear categoria",
      );
    }
  }

  /**
   * PUT /api/materials/categories/:id
   */
  async update(req, res) {
    try {
      const id = this.parsePositiveInt(req.params.id, "id");
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await categoriesService.update(id, req.body, userId);
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al actualizar categoria",
      );
    }
  }

  /**
   * PATCH /api/materials/categories/:id/status
   */
  async toggleStatus(req, res) {
    try {
      const id = this.parsePositiveInt(req.params.id, "id");
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await categoriesService.toggleStatus(id, userId);
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  /**
   * DELETE /api/materials/categories/:id
   */
  async delete(req, res) {
    try {
      const id = this.parsePositiveInt(req.params.id, "id");
      const result = await categoriesService.delete(id);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al eliminar categoria",
      );
    }
  }

  /**
   * GET /api/materials/categories/check-name
   */
  async checkName(req, res) {
    try {
      const { nombre } = req.query;
      if (!nombre || !String(nombre).trim()) {
        return res.status(400).json({
          success: false,
          message: "El nombre es requerido",
        });
      }

      const excludeId =
        req.query.excludeId !== undefined
          ? this.parsePositiveInt(req.query.excludeId, "excludeId")
          : null;

      const result = await categoriesService.checkNameAvailability(
        nombre,
        excludeId,
      );
      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  /**
   * GET /api/materials/categories/report
   */
  async getAllForReport(req, res) {
    try {
      const { search = "", estado } = req.query;
      const result = await categoriesService.getAllForReport({ search, estado });

      return res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} categorias para el reporte.`,
      });
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al obtener categorias para reporte",
      );
    }
  }
}

export default new CategoriesController();
