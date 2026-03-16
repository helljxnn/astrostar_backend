import { body, param, query } from "express-validator";

export const paymentsValidator = {
  // ============================================================================
  // VALIDACIONES DE PARÁMETROS
  // ============================================================================

  validateAthleteId: [
    param('athleteId')
      .isInt({ min: 1 })
      .withMessage('El ID del atleta debe ser un número entero positivo')
  ],

  validateObligationId: [
    param('obligationId')
      .isInt({ min: 1 })
      .withMessage('El ID de la obligación debe ser un número entero positivo')
  ],

  validatePaymentId: [
    param('paymentId')
      .isInt({ min: 1 })
      .withMessage('El ID del pago debe ser un número entero positivo')
  ],

  // ============================================================================
  // VALIDACIONES DE CONSULTAS
  // ============================================================================

  validatePaginationQuery: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número entero positivo'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100'),
    
    query('type')
      .optional()
      .isIn(['MONTHLY', 'ENROLLMENT_RENEWAL', 'ENROLLMENT_INITIAL'])
      .withMessage('El tipo debe ser MONTHLY, ENROLLMENT_RENEWAL o ENROLLMENT_INITIAL')
  ],

  // ============================================================================
  // VALIDACIONES DE CUERPO
  // ============================================================================

  validateRejectPayment: [
    body('rejectionReason')
      .notEmpty()
      .withMessage('La razón de rechazo es obligatoria')
      .isLength({ min: 10, max: 500 })
      .withMessage('La razón de rechazo debe tener entre 10 y 500 caracteres')
      .trim()
  ],

  // ============================================================================
  // VALIDACIONES PARA CONFIGURACIÓN DE PAGOS
  // ============================================================================

  validatePaymentSettings: [
    body('monthlyAmount')
      .optional()
      .isInt({ min: 1000, max: 10000000 })
      .withMessage('El valor de la mensualidad debe estar entre $1,000 y $10,000,000'),
    
    body('enrollmentAmount')
      .optional()
      .isInt({ min: 1000, max: 10000000 })
      .withMessage('El valor de la matrícula debe estar entre $1,000 y $10,000,000'),
    
    body('graceDays')
      .optional()
      .isInt({ min: 1, max: 15 })
      .withMessage('Los días de gracia deben estar entre 1 y 15')
  ],

  // ============================================================================
  // VALIDACIONES DE ARCHIVOS
  // ============================================================================

  validateReceiptUpload: (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Debe subir un archivo de comprobante"
      });
    }

    // Validar tipo de archivo
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Solo se permiten archivos de imagen (JPG, PNG, WEBP) o PDF"
      });
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "El archivo no debe superar los 5MB"
      });
    }

    next();
  }
};
