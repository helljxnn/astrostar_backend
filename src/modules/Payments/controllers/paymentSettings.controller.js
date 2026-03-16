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
  console.error('❌ [PAYMENT SETTINGS CONTROLLER]', error);
  
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
        graceDays
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

      if (graceDays && (graceDays < 1 || graceDays > 15)) {
        return res.status(400).json({
          success: false,
          message: "Los días de gracia deben estar entre 1 y 15"
        });
      }

      const updatedSettings = await paymentsService.updatePaymentSettings({
        ...(monthlyAmount && { monthlyAmount }),
        ...(enrollmentAmount && { enrollmentAmount }),
        ...(graceDays && { graceDays })
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
