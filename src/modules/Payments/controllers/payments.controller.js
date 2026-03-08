import { paymentsService } from "../services/payments.service.js";
import { validationResult } from "express-validator";

// ============================================================================
// UTILIDADES
// ============================================================================

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array()
    });
  }
  return null;
};

const handleError = (res, error, defaultMessage = "Error interno del servidor") => {
  console.error('❌ [PAYMENTS CONTROLLER]', error);
  
  const statusCode = error.message.includes('no encontrado') ? 404 :
                    error.message.includes('ya existe') ? 409 :
                    error.message.includes('obligatorio') ? 400 : 500;

  return res.status(statusCode).json({
    success: false,
    message: error.message || defaultMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// ============================================================================
// CONTROLADORES
// ============================================================================

export const paymentsController = {
  // ============================================================================
  // ESTADO FINANCIERO
  // ============================================================================

  /**
   * GET /payments/athletes/:athleteId/financial-status
   * Obtener estado financiero de un atleta
   */
  async getAthleteFinancialStatus(req, res) {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { athleteId } = req.params;
      const financialStatus = await paymentsService.getAthleteFinancialStatus(parseInt(athleteId));

      return res.status(200).json({
        success: true,
        message: "Estado financiero obtenido exitosamente",
        data: financialStatus
      });
    } catch (error) {
      return handleError(res, error, "Error al obtener estado financiero");
    }
  },

  // ============================================================================
  // COMPROBANTES DE PAGO
  // ============================================================================

  /**
   * POST /payments/obligations/:obligationId/receipt
   * Subir comprobante de pago
   */
  async uploadPaymentReceipt(req, res) {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { obligationId } = req.params;
      const athleteId = req.user.athlete?.id;

      if (!athleteId) {
        return res.status(403).json({
          success: false,
          message: "Solo los atletas pueden subir comprobantes de pago"
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Debe subir un archivo de comprobante"
        });
      }

      const receiptData = {
        url: req.file.path, // Cloudinary URL
        originalName: req.file.originalname
      };

      const payment = await paymentsService.uploadPaymentReceipt(
        parseInt(obligationId),
        athleteId,
        receiptData
      );

      return res.status(201).json({
        success: true,
        message: "Comprobante subido exitosamente. Será revisado por administración.",
        data: payment
      });
    } catch (error) {
      return handleError(res, error, "Error al subir comprobante");
    }
  },

  /**
   * GET /payments/pending
   * Obtener pagos pendientes (solo admin)
   */
  async getPendingPayments(req, res) {
    try {
      const { page = 1, limit = 20, type } = req.query;
      
      const filters = {
        page: parseInt(page),
        limit: parseInt(limit),
        ...(type && { type })
      };

      const result = await paymentsService.getPendingPayments(filters);

      return res.status(200).json({
        success: true,
        message: "Pagos pendientes obtenidos exitosamente",
        data: result.payments,
        pagination: result.pagination
      });
    } catch (error) {
      return handleError(res, error, "Error al obtener pagos pendientes");
    }
  },

  /**
   * PATCH /payments/:paymentId/approve
   * Aprobar pago (solo admin)
   */
  async approvePayment(req, res) {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { paymentId } = req.params;
      const reviewedBy = req.user.id;

      const payment = await paymentsService.approvePayment(
        parseInt(paymentId),
        reviewedBy
      );

      return res.status(200).json({
        success: true,
        message: "Pago aprobado exitosamente",
        data: payment
      });
    } catch (error) {
      return handleError(res, error, "Error al aprobar pago");
    }
  },

  /**
   * PATCH /payments/:paymentId/reject
   * Rechazar pago (solo admin)
   */
  async rejectPayment(req, res) {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { paymentId } = req.params;
      const { rejectionReason } = req.body;
      const reviewedBy = req.user.id;

      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: "La razón de rechazo es obligatoria"
        });
      }

      const payment = await paymentsService.rejectPayment(
        parseInt(paymentId),
        reviewedBy,
        rejectionReason
      );

      return res.status(200).json({
        success: true,
        message: "Pago rechazado exitosamente",
        data: payment
      });
    } catch (error) {
      return handleError(res, error, "Error al rechazar pago");
    }
  },

  // ============================================================================
  // ADMINISTRACIÓN
  // ============================================================================

  /**
   * POST /payments/generate-monthly
   * Generar mensualidades (CRON job - solo admin)
   */
  async generateMonthlyObligations(req, res) {
    try {
      const result = await paymentsService.generateMonthlyObligations();

      return res.status(200).json({
        success: true,
        message: `Mensualidades generadas: ${result.created}, omitidas: ${result.skipped}`,
        data: result
      });
    } catch (error) {
      return handleError(res, error, "Error al generar mensualidades");
    }
  },

  /**
   * POST /payments/athletes/:athleteId/enrollment-renewal
   * Generar obligación de renovación de matrícula (solo admin)
   */
  async generateEnrollmentRenewal(req, res) {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const { athleteId } = req.params;
      
      const obligation = await paymentsService.generateEnrollmentRenewalObligation(
        parseInt(athleteId)
      );

      return res.status(201).json({
        success: true,
        message: "Obligación de renovación de matrícula creada exitosamente",
        data: obligation
      });
    } catch (error) {
      return handleError(res, error, "Error al generar obligación de renovación");
    }
  },

  // ============================================================================
  // VALIDACIÓN DE ACCESO
  // ============================================================================

  /**
   * GET /payments/athletes/:athleteId/access-check
   * Verificar restricciones de acceso (usado por middleware de login)
   */
  async checkAthleteAccess(req, res) {
    try {
      const { athleteId } = req.params;
      
      const accessCheck = await paymentsService.checkAthleteAccessRestrictions(
        parseInt(athleteId)
      );

      return res.status(200).json({
        success: true,
        data: accessCheck
      });
    } catch (error) {
      return handleError(res, error, "Error al verificar acceso");
    }
  }
};