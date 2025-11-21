import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validadores para inscripciones
 */
export const registrationsValidators = {
  /**
   * Validar inscripción de equipo
   */
  registerTeam: [
    body('serviceId')
      .notEmpty()
      .withMessage('El ID del evento es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID del evento debe ser un número entero positivo'),
    body('teamId')
      .notEmpty()
      .withMessage('El ID del equipo es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID del equipo debe ser un número entero positivo'),
    body('sportsCategoryId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID de categoría deportiva debe ser un número entero positivo'),
    body('notes')
      .optional()
      .isString()
      .withMessage('Las notas deben ser texto')
      .isLength({ max: 500 })
      .withMessage('Las notas no pueden exceder 500 caracteres'),
  ],

  /**
   * Validar obtención de inscripciones por evento
   */
  getByEvent: [
    param('serviceId')
      .notEmpty()
      .withMessage('El ID del evento es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID del evento debe ser un número entero positivo'),
    query('status')
      .optional()
      .isIn(['Registered', 'Confirmed', 'Cancelled', 'Attended'])
      .withMessage('Estado inválido'),
  ],

  /**
   * Validar obtención de inscripciones por equipo
   */
  getByTeam: [
    param('teamId')
      .notEmpty()
      .withMessage('El ID del equipo es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID del equipo debe ser un número entero positivo'),
    query('status')
      .optional()
      .isIn(['Registered', 'Confirmed', 'Cancelled', 'Attended'])
      .withMessage('Estado inválido'),
  ],

  /**
   * Validar obtención por ID
   */
  getById: [
    param('id')
      .notEmpty()
      .withMessage('El ID de la inscripción es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID debe ser un número entero positivo'),
  ],

  /**
   * Validar actualización de estado
   */
  updateStatus: [
    param('id')
      .notEmpty()
      .withMessage('El ID de la inscripción es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID debe ser un número entero positivo'),
    body('status')
      .notEmpty()
      .withMessage('El estado es requerido')
      .isIn(['Registered', 'Confirmed', 'Cancelled', 'Attended'])
      .withMessage('Estado inválido. Valores permitidos: Registered, Confirmed, Cancelled, Attended'),
    body('notes')
      .optional()
      .isString()
      .withMessage('Las notas deben ser texto')
      .isLength({ max: 500 })
      .withMessage('Las notas no pueden exceder 500 caracteres'),
  ],

  /**
   * Validar cancelación
   */
  cancel: [
    param('id')
      .notEmpty()
      .withMessage('El ID de la inscripción es requerido')
      .isInt({ min: 1 })
      .withMessage('El ID debe ser un número entero positivo'),
  ],
};
