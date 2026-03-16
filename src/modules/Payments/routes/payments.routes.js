import { Router } from "express";
import { paymentsController } from "../controllers/payments.controller.js";
import { paymentsValidator } from "../validators/payments.validator.js";
import { 
  requireAthleteOwnership,
  requirePaymentReceiptAccess,
} from "../middleware/paymentAccess.middleware.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";
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

// ============================================================================
// RUTAS DE ADMINISTRACIÓN
// ============================================================================

// Rutas básicas - solo métodos que existen en el controller
router.get('/pending/report', authenticateToken, checkPermissions("paymentsManagement", "Ver"), paymentsController.getPendingPaymentsForReport); // ANTES de /pending
router.get('/pending', authenticateToken, checkPermissions("paymentsManagement", "Ver"), paymentsController.getPendingPayments);
router.get('/history/report', authenticateToken, checkPermissions("paymentsManagement", "Ver"), paymentsController.getPaymentHistoryForReport); // ANTES de /all
router.get('/all', authenticateToken, checkPermissions("paymentsManagement", "Ver"), paymentsController.getAllPayments);
router.get('/monthly-management', authenticateToken, checkPermissions("paymentsManagement", "Ver"), paymentsController.getMonthlyPaymentsManagement);
router.patch('/:paymentId/approve', authenticateToken, checkPermissions("paymentsManagement", "Aprobar"), paymentsController.approvePayment);
router.patch('/:paymentId/reject', authenticateToken, checkPermissions("paymentsManagement", "Rechazar"), paymentsController.rejectPayment);

export default router;

