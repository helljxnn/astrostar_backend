import { Router } from "express";
import { paymentSettingsController } from "../controllers/paymentSettings.controller.js";
import { paymentsValidator } from "../validators/payments.validator.js";
import { requirePaymentAdminPermissions } from "../middleware/paymentAccess.middleware.js";
import { authenticateToken } from "../../../middlewares/auth.js";

const router = Router();

/**
 * GET /payment-settings
 * Obtener configuración actual de pagos (solo admin)
 */
router.get(
  '/',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentSettingsController.getSettings
);

/**
 * PATCH /payment-settings
 * Actualizar configuración de pagos (solo admin)
 */
router.patch(
  '/',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentsValidator.validatePaymentSettings,
  paymentSettingsController.updateSettings
);

export default router;