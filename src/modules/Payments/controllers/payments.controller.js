  import { paymentsService } from "../services/payments.service.js";
import { validationResult } from "express-validator";

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
  return res.status(500).json({
    success: false,
    message: error.message || defaultMessage
  });
};

export const paymentsController = {
  // ============================================================================
  // MÉTODOS PARA DEPORTISTAS
  // ============================================================================

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
        url: req.file.path,
        originalName: req.file.originalname
      };

      const payment = await paymentsService.uploadPaymentReceipt(
        parseInt(obligationId),
        athleteId,
        receiptData
      );

      return res.status(201).json({
        success: true,
        message: "Comprobante subido exitosamente.",
        data: payment
      });
    } catch (error) {
      return handleError(res, error, "Error al subir comprobante");
    }
  },

  async downloadPaymentReceipt(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentsService.getPaymentById(parseInt(paymentId));

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Comprobante no encontrado"
        });
      }

      if (!payment.receiptUrl) {
        return res.status(404).json({
          success: false,
          message: "Este pago no tiene comprobante adjunto"
        });
      }

      return res.redirect(payment.receiptUrl);
    } catch (error) {
      return handleError(res, error, "Error al descargar comprobante");
    }
  },

  async checkAthleteAccess(req, res) {
    try {
      const { athleteId } = req.params;
      const accessCheck = await paymentsService.checkAthleteAccessRestrictions(parseInt(athleteId));

      return res.status(200).json({
        success: true,
        data: accessCheck
      });
    } catch (error) {
      return handleError(res, error, "Error al verificar acceso");
    }
  },

  // ============================================================================
  // MÉTODOS PARA ADMINISTRADORES
  // ============================================================================

  async getPendingPayments(req, res) {
    try {
      const { page = 1, limit = 20, type, search } = req.query;
      const filters = { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        ...(type && { type }),
        ...(search && { search })
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

  async getAllPayments(req, res) {
    try {
      const { page = 1, limit = 20, status, type, dateFrom, dateTo, excludeStatus, search } = req.query;
      const filters = { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        status, 
        type, 
        dateFrom, 
        dateTo,
        excludeStatus,
        search
      };
      const result = await paymentsService.getAllPayments(filters);
      return res.status(200).json({
        success: true,
        message: 'Pagos obtenidos exitosamente',
        data: result.payments,
        pagination: result.pagination
      });
    } catch (error) {
      return handleError(res, error, 'Error al obtener pagos');
    }
  },

  async approvePayment(req, res) {
    try {
      const { paymentId } = req.params;
      const reviewedBy = req.user.id;
      const payment = await paymentsService.approvePayment(parseInt(paymentId), reviewedBy);
      return res.status(200).json({
        success: true,
        message: "Pago aprobado exitosamente",
        data: payment
      });
    } catch (error) {
      return handleError(res, error, "Error al aprobar pago");
    }
  },

  async rejectPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { rejectionReason } = req.body;
      const reviewedBy = req.user.id;
      if (!rejectionReason) {
        return res.status(400).json({
          success: false,
          message: "La razón de rechazo es obligatoria"
        });
      }
      const payment = await paymentsService.rejectPayment(parseInt(paymentId), reviewedBy, rejectionReason);
      return res.status(200).json({
        success: true,
        message: "Pago rechazado exitosamente",
        data: payment
      });
    } catch (error) {
      return handleError(res, error, "Error al rechazar pago");
    }
  },

  async getMonthlyPaymentsManagement(req, res) {
    try {
      const { page = 1, limit = 20, status, search, dateFrom, dateTo } = req.query;
      const result = await paymentsService.getMonthlyPaymentsManagement({
        page: parseInt(page), limit: parseInt(limit), status, search, dateFrom, dateTo
      });
      return res.status(200).json({
        success: true,
        data: result,
        message: 'Gestión mensual obtenida correctamente'
      });
    } catch (error) {
      console.error('❌ [PAYMENTS] Error en gestión mensual:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener gestión de pagos mensuales'
      });
    }
  },

  /**
   * GET /api/payments/pending/report
   * Obtener todos los pagos pendientes para reporte (SIN PAGINACIÓN)
   */
  async getPendingPaymentsForReport(req, res) {
    try {
      const { type } = req.query;
      const result = await paymentsService.getPendingPaymentsForReport({ type });
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error, "Error al obtener pagos pendientes para reporte");
    }
  },

  /**
   * GET /api/payments/history/report
   * Obtener historial completo de pagos para reporte (SIN PAGINACIÓN)
   */
  async getPaymentHistoryForReport(req, res) {
    try {
      const { athleteId, status, type, startDate, endDate } = req.query;
      const result = await paymentsService.getPaymentHistoryForReport({
        athleteId: athleteId ? parseInt(athleteId) : undefined,
        status,
        type,
        startDate,
        endDate,
      });
      return res.status(200).json(result);
    } catch (error) {
      return handleError(res, error, "Error al obtener historial de pagos para reporte");
    }
  },
};


