import { Router } from "express";
import { paymentsController } from "../controllers/payments.controller.js";
import { paymentsValidator } from "../validators/payments.validator.js";
import { 
  requirePaymentAdminPermissions, 
  requireAthleteOwnership 
} from "../middleware/paymentAccess.middleware.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { uploadPaymentReceipt } from "../../../services/shared/middleware/upload.middleware.js";
import multer from "multer";

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
  // Middleware de debug temporal
  (req, res, next) => {
    next();
  },
  uploadPaymentReceipt,
  // Middleware de debug después del upload
  (req, res, next) => {
    if (req.file) {
    }
    next();
  },
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
  paymentsController.downloadPaymentReceipt
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
 * GET /payments/all
 * Obtener todos los pagos con filtros
 */
router.get(
  '/all',
  authenticateToken,
  requirePaymentAdminPermissions,
  paymentsValidator.validatePaginationQuery,
  paymentsController.getAllPayments
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

// Manejo de errores específico para Multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('❌ [MULTER ERROR]', error);
    
    if (error.code === 'UNEXPECTED_FIELD') {
      return res.status(400).json({
        success: false,
        message: `Campo de archivo inesperado: "${error.field}". Se esperaba: "receipt"`,
        error: 'UNEXPECTED_FIELD'
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB permitido.',
        error: 'FILE_TOO_LARGE'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: `Error de upload: ${error.message}`,
      error: error.code
    });
  }
  
  next(error);
});

// ============================================================================
// GESTIÓN MENSUAL ADMINISTRATIVA (NUEVA RUTA - NO AFECTA RUTAS EXISTENTES)
// ============================================================================

/**
 * GET /payments/monthly-management
 * Obtener gestión completa de pagos mensuales para administradores
 * Incluye cálculo de mora, estados y filtros avanzados
 */
router.get(
  '/monthly-management',
  authenticateToken,
  requirePaymentAdminPermissions, // Solo administradores
  paymentsController.getMonthlyPaymentsManagement
);

export default router;
