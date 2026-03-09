import { Router } from "express";
import { paymentsController } from "../controllers/payments.controller.js";
import { paymentsValidator } from "../validators/payments.validator.js";
import { 
  requirePaymentAdminPermissions, 
  requireAthleteOwnership 
} from "../middleware/paymentAccess.middleware.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { uploadPaymentReceipt } from "../../../services/shared/middleware/upload.middleware.js";

const router = Router();

// ============================================================================
// RUTAS PÚBLICAS (requieren autenticación básica)
// ============================================================================

/**
 * GET /payments/athletes/:athleteId/financial-status
 * Obtener estado financiero de un atleta
 */
router.get(
  '/athletes/:athleteId/financial-status',
  authenticateToken,
  paymentsValidator.validateAthleteId,
  requireAthleteOwnership,
  paymentsController.getAthleteFinancialStatus
);

/**
 * POST /payments/obligations/:obligationId/receipt
 * Subir comprobante de pago
 */
router.post(
  '/obligations/:obligationId/receipt',
  authenticateToken,
  paymentsValidator.validateObligationId,
  uploadPaymentReceipt,
  paymentsValidator.validateReceiptUpload,
  paymentsController.uploadPaymentReceipt
);

/**
 * GET /payments/athletes/:athleteId/access-check
 * Verificar restricciones de acceso (usado internamente)
 */
router.get(
  '/athletes/:athleteId/access-check',
  authenticateToken,
  paymentsValidator.validateAthleteId,
  requireAthleteOwnership,
  paymentsController.checkAthleteAccess
);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN (requieren permisos especiales)
// ============================================================================

/**
 * GET /payments/pending
 * Obtener pagos pendientes de revisión
 */
router.get(
  '/pending',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentsValidator.validatePaginationQuery,
  paymentsController.getPendingPayments
);

/**
 * PATCH /payments/:paymentId/approve
 * Aprobar un pago
 */
router.patch(
  '/:paymentId/approve',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentsValidator.validatePaymentId,
  paymentsController.approvePayment
);

/**
 * PATCH /payments/:paymentId/reject
 * Rechazar un pago
 */
router.patch(
  '/:paymentId/reject',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentsValidator.validatePaymentId,
  paymentsValidator.validateRejectPayment,
  paymentsController.rejectPayment
);

/**
 * POST /payments/generate-monthly
 * Generar mensualidades automáticamente (CRON job)
 */
router.post(
  '/generate-monthly',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentsController.generateMonthlyObligations
);

/**
 * POST /payments/athletes/:athleteId/enrollment-renewal
 * Generar obligación de renovación de matrícula
 */
router.post(
  '/athletes/:athleteId/enrollment-renewal',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentsValidator.validateAthleteId,
  paymentsController.generateEnrollmentRenewal
);

/**
 * POST /payments/athletes/:athleteId/enrollment-initial
 * Generar obligación de pago inicial de matrícula (fallback manual para admin)
 */
router.post(
  '/athletes/:athleteId/enrollment-initial',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentsValidator.validateAthleteId,
  paymentsController.generateInitialEnrollmentObligation
);

export default router;