import { body, param, query, validationResult } from 'express-validator';

// Validaciones para crear persona temporal
export const createTemporaryWorkerValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios'),

  body('lastName')
    .optional()
    .isLength({ max: 100 })
    .withMessage('El apellido no puede exceder 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
    .withMessage('El apellido solo puede contener letras y espacios'),

  body('identification')
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage('La identificación debe tener entre 6 y 50 caracteres')
    .matches(/^[a-zA-Z0-9.-]+$/)
    .withMessage('La identificación contiene caracteres inválidos'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('El email debe tener un formato válido')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^\d{7,15}$/)
    .withMessage('El teléfono debe contener entre 7 y 15 dígitos'),

  body('birthDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de nacimiento debe tener un formato válido')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 0 || age > 120) {
        throw new Error('La fecha de nacimiento no es válida');
      }
      return true;
    }),

  body('age')
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage('La edad debe ser un número entre 0 y 120'),

  body('address')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres'),

  body('team')
    .optional()
    .isLength({ max: 200 })
    .withMessage('El equipo no puede exceder 200 caracteres'),

  body('category')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La categoría no puede exceder 200 caracteres'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('El estado debe ser Active o Inactive'),

  body('documentTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El tipo de documento debe ser un ID válido'),

  body('personType')
    .notEmpty()
    .withMessage('El tipo de persona es obligatorio')
    .isIn(['Deportista', 'Entrenador', 'Participante'])
    .withMessage('El tipo de persona debe ser Deportista, Entrenador o Participante'),
];

// Validaciones para actualizar persona temporal
export const updateTemporaryWorkerValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  ...createTemporaryWorkerValidation.map(validation => {
    // Hacer todos los campos opcionales para actualización
    if (validation.builder && validation.builder.fields) {
      const field = validation.builder.fields[0];
      if (field !== 'personType') {
        return validation.optional();
      }
    }
    return validation;
  })
];

// Validaciones para obtener por ID
export const getByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
];

// Validaciones para eliminar
export const deleteValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),
];

// Validaciones para consultas
export const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),

  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La búsqueda no puede exceder 100 caracteres'),

  query('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('El estado debe ser Active o Inactive'),

  query('personType')
    .optional()
    .isIn(['Deportista', 'Entrenador', 'Participante'])
    .withMessage('El tipo de persona debe ser Deportista, Entrenador o Participante'),
];

// Validaciones para verificar disponibilidad
export const checkAvailabilityValidation = [
  query('identification')
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage('La identificación debe tener entre 6 y 50 caracteres'),

  query('email')
    .optional()
    .isEmail()
    .withMessage('El email debe tener un formato válido'),

  query('excludeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID a excluir debe ser un número entero positivo'),
];

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};