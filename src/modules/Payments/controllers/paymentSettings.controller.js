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

export const paymentSettingsController = {
  /**
   * GET /api/payment-settings
   * Obtener configuración actual de pagos (solo admin)
   */
  async getSettings(req, res) {
    try {
      const settings = await paymentsService.getPaymentSettings();

      return res.status(200).json({
        success: true,
        message: "Configuración de pagos obtenida exitosamente",
        data: settings
      });
    } catch (error) {
      return handleError(res, error, "Error al obtener configuración de pagos");
    }
  },

  /**
   * PATCH /api/payment-settings
   * Actualizar configuración de pagos (solo admin)
   */
  async updateSettings(req, res) {
    try {
      const validationError = handleValidationErrors(req, res);
      if (validationError) return validationError;

      const {
        monthlyAmount,
        enrollmentAmount,
        lateFeeDailyAmount
      } = req.body;

      // Validaciones de negocio
      if (monthlyAmount && monthlyAmount < 1000) {
        return res.status(400).json({
          success: false,
          message: "El valor de la mensualidad debe ser mayor a $1,000"
        });
      }

      if (enrollmentAmount && enrollmentAmount < 1000) {
        return res.status(400).json({
          success: false,
          message: "El valor de la matrícula debe ser mayor a $1,000"
        });
      }

      if (lateFeeDailyAmount !== undefined && (lateFeeDailyAmount < 0 || lateFeeDailyAmount > 100000)) {
        return res.status(400).json({
          success: false,
          message: "El valor de mora diaria debe estar entre $0 y $100,000"
        });
      }

      const updatedSettings = await paymentsService.updatePaymentSettings({
        ...(monthlyAmount && { monthlyAmount }),
        ...(enrollmentAmount && { enrollmentAmount }),
        ...(lateFeeDailyAmount !== undefined && { lateFeeDailyAmount })
      });

      return res.status(200).json({
        success: true,
        message: "Configuración de pagos actualizada exitosamente",
        data: updatedSettings
      });
    } catch (error) {
      return handleError(res, error, "Error al actualizar configuración de pagos");
    }
  }
};
