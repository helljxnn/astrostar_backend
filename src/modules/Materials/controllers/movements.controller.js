import movementsService from "../services/movements.service.js";

class MovementsController {
  constructor() {
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.getStatistics = this.getStatistics.bind(this);
    this.getRecent = this.getRecent.bind(this);
    this.getByDateRange = this.getByDateRange.bind(this);
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
      const validationError = new Error(
        `El campo "${field}" debe ser un entero positivo`,
      );
      validationError.statusCode = 400;
      throw validationError;
    }

    return parsed;
  }

  parseDate(value, field) {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return null;
    }

    const raw = String(value).trim();
    let parsedDate = null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      parsedDate = new Date(`${raw}T00:00:00.000Z`);
    } else {
      const generic = new Date(raw);
      if (!Number.isNaN(generic.getTime())) {
        parsedDate = generic;
      }
    }

    if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
      const validationError = new Error(
        `El campo "${field}" debe ser una fecha valida`,
      );
      validationError.statusCode = 400;
      throw validationError;
    }

    return raw;
  }

  validateDateRange(startDate, endDate, startField, endField) {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      const validationError = new Error(
        `El campo "${startField}" no puede ser mayor que "${endField}"`,
      );
      validationError.statusCode = 400;
      throw validationError;
    }
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

  async getAll(req, res) {
    try {
      const {
        tipo,
        origen,
        search = "",
        dateFrom,
        dateTo,
        date_from,
        date_to,
        inventarioDestino,
        tipoSalida,
      } = req.query;

      const page = this.parsePositiveInt(req.query.page, "page", 1);
      const limit = this.parsePositiveInt(req.query.limit, "limit", 10);
      const materialId = this.parsePositiveInt(
        req.query.materialId ?? req.query.material_id,
        "materialId",
        null,
      );
      const normalizedDateFrom = this.parseDate(
        dateFrom || date_from,
        "dateFrom",
      );
      const normalizedDateTo = this.parseDate(dateTo || date_to, "dateTo");

      this.validateDateRange(
        normalizedDateFrom,
        normalizedDateTo,
        "dateFrom",
        "dateTo",
      );

      const result = await movementsService.getAll({
        page,
        limit,
        materialId,
        tipo,
        origen,
        search,
        dateFrom: normalizedDateFrom,
        dateTo: normalizedDateTo,
        inventarioDestino: inventarioDestino || null,
        tipoSalida: tipoSalida || null,
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al obtener movimientos",
      );
    }
  }

  async getById(req, res) {
    try {
      const id = this.parsePositiveInt(req.params.id, "id");
      const result = await movementsService.getById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  async create(req, res) {
    try {
      const userId = req.user?.id;
      const userName = req.user
        ? `${req.user.firstName} ${req.user.lastName}`
        : null;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await movementsService.registerMovement(
        req.body,
        userId,
        userName,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al registrar movimiento",
      );
    }
  }

  async update(req, res) {
    try {
      const id = this.parsePositiveInt(req.params.id, "id");
      const userId = req.user?.id;
      const userName = req.user
        ? `${req.user.firstName} ${req.user.lastName}`
        : null;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await movementsService.updateMovement(
        id,
        req.body,
        userId,
        userName,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al actualizar movimiento",
      );
    }
  }

  async delete(req, res) {
    try {
      const id = this.parsePositiveInt(req.params.id, "id");
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await movementsService.deleteMovement(id);
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al eliminar movimiento",
      );
    }
  }

  async getHistory(req, res) {
    try {
      const materialId = this.parsePositiveInt(req.params.materialId, "materialId");
      const limit = this.parsePositiveInt(req.query.limit, "limit", 10);

      const result = await movementsService.getMaterialHistory(materialId, limit);
      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  async getStatistics(req, res) {
    try {
      const materialId = this.parsePositiveInt(req.query.materialId, "materialId", null);
      const startDate = this.parseDate(req.query.startDate, "startDate");
      const endDate = this.parseDate(req.query.endDate, "endDate");

      this.validateDateRange(startDate, endDate, "startDate", "endDate");

      const result = await movementsService.getStatistics(
        materialId,
        startDate,
        endDate,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  async getRecent(req, res) {
    try {
      const limit = this.parsePositiveInt(req.query.limit, "limit", 5);
      const result = await movementsService.getRecentMovements(limit);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  async getByDateRange(req, res) {
    try {
      const { startDate, endDate, tipo, origen } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Las fechas de inicio y fin son requeridas",
        });
      }

      const normalizedStartDate = this.parseDate(startDate, "startDate");
      const normalizedEndDate = this.parseDate(endDate, "endDate");
      this.validateDateRange(
        normalizedStartDate,
        normalizedEndDate,
        "startDate",
        "endDate",
      );

      const filters = {};
      const parsedMaterialId = this.parsePositiveInt(
        req.query.materialId,
        "materialId",
        null,
      );
      if (parsedMaterialId) {
        filters.materialId = parsedMaterialId;
      }
      if (tipo) filters.tipoMovimiento = tipo;
      if (origen) filters.origen = origen;

      const result = await movementsService.getByDateRange(
        normalizedStartDate,
        normalizedEndDate,
        filters,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(res, error, "Error interno del servidor");
    }
  }

  async getAllForReport(req, res) {
    try {
      const {
        search = "",
        tipoMovimiento,
        tipo,
        inventarioDestino,
        tipoSalida,
      } = req.query;

      const materialId = this.parsePositiveInt(req.query.materialId, "materialId", null);
      const startDate = this.parseDate(
        req.query.startDate || req.query.dateFrom,
        "startDate",
      );
      const endDate = this.parseDate(
        req.query.endDate || req.query.dateTo,
        "endDate",
      );

      this.validateDateRange(startDate, endDate, "startDate", "endDate");

      const result = await movementsService.getAllForReport({
        search,
        materialId,
        tipoMovimiento: tipoMovimiento || tipo,
        startDate,
        endDate,
        inventarioDestino,
        tipoSalida,
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.json(result);
    } catch (error) {
      return this.handleControllerError(
        res,
        error,
        "Error interno del servidor al obtener movimientos para reporte",
      );
    }
  }
}

export default new MovementsController();
