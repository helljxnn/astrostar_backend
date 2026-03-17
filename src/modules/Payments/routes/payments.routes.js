import { Router } from "express";
import { paymentsController } from "../controllers/payments.controller.js";
import { paymentsValidator } from "../validators/payments.validator.js";
import { 
  requireAthleteOwnership,
  requirePaymentReceiptAccess,
  requirePaymentAdminPermissions,
} from "../middleware/paymentAccess.middleware.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { uploadPaymentReceipt } from "../../../services/shared/middleware/upload.middleware.js";

const router = Router();

// Ruta simple para probar
router.get('/test', (req, res) => {
  res.json({ message: 'Payments routes working - updated' });
});

// ============================================================================
// RUTAS PARA DEPORTISTAS (RESTAURADAS)
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
 * GET /payments/:paymentId/receipt
 * Descargar comprobante de pago
 */
router.get(
  '/:paymentId/receipt',
  authenticateToken,
  paymentsValidator.validatePaymentId,
  requirePaymentReceiptAccess,
  paymentsController.downloadPaymentReceipt
);

/**
 * GET /payments/athletes/:athleteId/access-check
 * Verificar restricciones de acceso
 */
router.get(
  '/athletes/:athleteId/access-check',
  authenticateToken,
  paymentsValidator.validateAthleteId,
  requireAthleteOwnership,
  paymentsController.checkAthleteAccess
);

/**
 * GET /payments/athletes/:athleteId/history
 * Obtener historial completo de pagos de un atleta
 */
router.get(
  '/athletes/:athleteId/history',
  authenticateToken,
  paymentsValidator.validateAthleteId,
  requireAthleteOwnership,
  paymentsController.getAthletePaymentHistory
);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN
// ============================================================================

// Rutas básicas - solo métodos que existen en el controller
router.get('/dashboard/stats', authenticateToken, requirePaymentAdminPermissions, paymentsController.getDashboardStats); // Nuevo endpoint específico para dashboard
router.get('/monthly-summary', authenticateToken, requirePaymentAdminPermissions, paymentsController.getMonthlySummary);
// Historial mensualidades: admin o atleta (solo sus propios datos)
router.get(
  '/athletes/:athleteId/monthly-history',
  authenticateToken,
  paymentsValidator.validateAthleteId,
  requireAthleteOwnership,
  paymentsController.getAthleteMonthlyHistory
);
router.get('/pending/report', authenticateToken, requirePaymentAdminPermissions, paymentsController.getPendingPaymentsForReport); // ANTES de /pending
router.get('/pending', authenticateToken, requirePaymentAdminPermissions, paymentsController.getPendingPayments);
router.get('/history/report', authenticateToken, requirePaymentAdminPermissions, paymentsController.getPaymentHistoryForReport); // ANTES de /all
router.get('/all', authenticateToken, requirePaymentAdminPermissions, paymentsController.getAllPayments);
router.get('/monthly-management', authenticateToken, requirePaymentAdminPermissions, paymentsController.getMonthlyPaymentsManagement);
router.patch('/:paymentId/approve', authenticateToken, requirePaymentAdminPermissions, paymentsController.approvePayment);
router.patch('/:paymentId/reject', authenticateToken, requirePaymentAdminPermissions, paymentsController.rejectPayment);

export default router;
