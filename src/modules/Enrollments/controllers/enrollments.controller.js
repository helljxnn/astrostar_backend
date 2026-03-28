import { enrollmentsService } from "../services/enrollments.service.js";
import { legacyEnrollmentImportService } from "../services/legacyEnrollmentImport.service.js";
import { enrollmentSchemas } from "../validators/enrollments.validator.js";

export const enrollmentsController = {
  async create(req, res) {
    try {
      
      const { error, value } = enrollmentSchemas.create.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      
      const result = await enrollmentsService.create(value);

      return res.status(201).json({
        success: true,
        message: "Deportista matriculada exitosamente. Credenciales enviadas por email.",
        data: result,
        emailSent: result.emailSent,
        temporaryPassword: result.temporaryPassword
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async previewLegacyImport(req, res) {
    try {
      const { error, value } = enrollmentSchemas.legacyImport.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await legacyEnrollmentImportService.preview(value, {
        performedBy: req.user?.id ?? null,
      });

      return res.json({
        success: true,
        message: "Preview de importacion legacy generado correctamente.",
        data: result.plan,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async createLegacyImport(req, res) {
    try {
      const { error, value } = enrollmentSchemas.legacyImport.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await legacyEnrollmentImportService.create(value, {
        performedBy: req.user?.id ?? null,
      });

      return res.status(201).json({
        success: true,
        message:
          "Deportista importada correctamente como saldo inicial sin cobro automatico de matricula.",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async previewLegacyImportBatch(req, res) {
    try {
      const { error, value } = enrollmentSchemas.legacyImportBatch.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await legacyEnrollmentImportService.previewBatch(value, {
        performedBy: req.user?.id ?? null,
      });

      return res.json({
        success: true,
        message:
          result.summary.invalidRows > 0
            ? "Preview generado. Corrige las filas marcadas antes de importar."
            : "Preview de importacion masiva generado correctamente.",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async createLegacyImportBatch(req, res) {
    try {
      const { error, value } = enrollmentSchemas.legacyImportBatch.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await legacyEnrollmentImportService.createBatch(value, {
        performedBy: req.user?.id ?? null,
      });

      return res.status(201).json({
        success: true,
        message: "Importacion masiva completada correctamente.",
        data: result,
      });
    } catch (error) {
      if (error?.preview) {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: error.preview,
          errors: error.preview.rows
            .filter((row) => row.status === "error")
            .map((row) => ({
              rowNumber: row.rowNumber,
              errors: row.errors,
            })),
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findAll(req, res) {
    try {
      const { estado, athleteId, search, page, limit, sortBy, sortOrder, dateFrom, dateTo, vencimiento } = req.query;
const result = await enrollmentsService.findAll({
        estado,
        athleteId,
        search: search?.trim() || undefined,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 7, // Usar 7 como default (igual que otros módulos)
        sortBy: sortBy || 'createdAt',
        sortOrder: sortOrder || 'desc',
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        vencimiento: vencimiento || undefined
      });


      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findById(req, res) {
    try {
      const { id } = req.params;
      const enrollment = await enrollmentsService.findById(id);

      return res.json({
        success: true,
        data: enrollment,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findByAthleteId(req, res) {
    try {
      const { athleteId } = req.params;
      const enrollments = await enrollmentsService.findByAthleteId(athleteId);

      return res.json({
        success: true,
        data: enrollments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = enrollmentSchemas.update.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const enrollment = await enrollmentsService.update(id, value);

      return res.json({
        success: true,
        message: "Matrícula actualizada",
        data: enrollment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // ELIMINADO: Las matrículas NO deben poder eliminarse
  // Solo pueden cambiar de estado (Vigente, Vencida, Pending_Payment)
  async delete(req, res) {
    return res.status(403).json({
      success: false,
      message: "Las matrículas no pueden ser eliminadas. Solo pueden cambiar de estado (Vigente, Vencida, Pending_Payment).",
    });
  },

  /**
   * Procesar matrículas vencidas manualmente
   * POST /api/enrollments/process-expired
   */
  async processExpired(req, res) {
    try {
      const result = await enrollmentsService.processExpiredEnrollments();

      return res.json({
        success: true,
        message: `Procesadas ${result.processed} matrículas vencidas`,
        data: result,
      });
    } catch (error) {
return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // NOTA: La renovación de matrículas se maneja automáticamente a través del sistema de pagos
  // 1. CRON detecta vencimiento → marca matrícula como 'Vencida'
  // 2. CRON genera obligación ENROLLMENT_RENEWAL
  // 3. Deportista paga → Admin aprueba → Sistema crea nueva matrícula
  // Endpoint manual para generar obligación: POST /api/payments/athletes/:athleteId/enrollment-renewal

  /**
   * GET /api/enrollments/report
   * Obtener todas las matrículas para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport(req, res) {
    try {
      const { estado, athleteId, search, dateFrom, dateTo, vencimiento } = req.query;
      const result = await enrollmentsService.findAllForReport({
        estado,
        athleteId,
        search: search?.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        vencimiento: vencimiento || undefined,
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
  /**
   * GET /api/enrollments/athlete/:athleteId/history
   * Obtener historial completo de matrículas de un deportista específico
   */
  async getAthleteHistory(req, res) {
    try {
      const { athleteId } = req.params;


      if (!athleteId || isNaN(parseInt(athleteId))) {
        return res.status(400).json({
          success: false,
          message: 'ID de deportista inválido'
        });
      }

      const result = await enrollmentsService.getAthleteEnrollmentHistory(parseInt(athleteId));

      return res.json(result);
    } catch (error) {
return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};


