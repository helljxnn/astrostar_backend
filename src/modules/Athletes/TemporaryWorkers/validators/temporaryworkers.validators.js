import { body, param, query, validationResult } from 'express-validator';

// Validaciones para crear persona temporal
export const createTemporaryWorkerValidation = [
  // Primer Nombre - Requerido
  body('firstName')
    .notEmpty()
    .withMessage('El primer nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El primer nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El primer nombre solo puede contener letras y espacios')
    .trim(),

  // Segundo Nombre - Opcional
  body('middleName')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 100 })
    .withMessage('El segundo nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El segundo nombre solo puede contener letras y espacios')
    .trim(),

  // Primer Apellido - Requerido
  body('lastName')
    .notEmpty()
    .withMessage('El primer apellido es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El primer apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El primer apellido solo puede contener letras y espacios')
    .trim(),

  // Segundo Apellido - Opcional
  body('secondLastName')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 100 })
    .withMessage('El segundo apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El segundo apellido solo puede contener letras y espacios')
    .trim(),

  // Tipo de persona - Requerido
  body('personType')
    .notEmpty()
    .withMessage('El tipo de persona es requerido')
    .isIn(['Deportista', 'Entrenador', 'Participante'])
    .withMessage('El tipo de persona debe ser: Deportista, Entrenador o Participante'),

  // Identificación - Requerido
  body('identification')
    .notEmpty()
    .withMessage('La identificación es requerida')
    .isLength({ min: 6, max: 50 })
    .withMessage('La identificación debe tener entre 6 y 50 caracteres')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('La identificación solo puede contener letras, números y guiones')
    .trim(),

  // Email - Requerido
  body('email')
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('El formato del email no es válido')
    .isLength({ max: 150 })
    .withMessage('El email no puede exceder 150 caracteres')
    .normalizeEmail(),

  // Teléfono - Requerido
  body('phone')
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .matches(/^[0-9\s\-\+\(\)]+$/)
    .withMessage('El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +')
    .isLength({ min: 7, max: 20 })
    .withMessage('El teléfono debe tener entre 7 y 20 caracteres')
    .trim(),

  // Fecha de nacimiento - Requerido
  body('birthDate')
    .notEmpty()
    .withMessage('La fecha de nacimiento es requerida')
    .isISO8601()
    .withMessage('La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());

      if (birthDate < minDate) {
        throw new Error('La fecha de nacimiento no puede ser anterior a 120 años');
      }
      if (birthDate > maxDate) {
        throw new Error('La persona debe tener al menos 5 años de edad');
      }
      return true;
    }),

  // Edad - Opcional, se calcula automáticamente
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 5, max: 120 })
    .withMessage('La edad debe estar entre 5 y 120 años'),

  // Dirección - Requerido
  body('address')
    .notEmpty()
    .withMessage('La dirección es requerida')
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres')
    .trim(),

  // Equipo - Opcional
  body('team')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('El nombre del equipo no puede exceder 100 caracteres')
    .trim(),

  // Categoría - Opcional
  body('category')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('La categoría no puede exceder 100 caracteres')
    .trim(),

  // Tipo de documento - Opcional
  body('documentTypeId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('El tipo de documento debe ser un número válido'),

  // Estado - Opcional, por defecto Active
  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('El estado debe ser Active o Inactive'),
];

// Validaciones para actualizar persona temporal
export const updateTemporaryWorkerValidation = [
  // ID en parámetros
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  // Mismo conjunto de validaciones que crear, pero todos opcionales
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El primer nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El primer nombre solo puede contener letras y espacios')
    .trim(),

  body('middleName')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 100 })
    .withMessage('El segundo nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El segundo nombre solo puede contener letras y espacios')
    .trim(),

  body('lastName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El primer apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El primer apellido solo puede contener letras y espacios')
    .trim(),

  body('secondLastName')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 2, max: 100 })
    .withMessage('El segundo apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El segundo apellido solo puede contener letras y espacios')
    .trim(),

  body('personType')
    .optional()
    .isIn(['Deportista', 'Entrenador', 'Participante'])
    .withMessage('El tipo de persona debe ser: Deportista, Entrenador o Participante'),

  body('identification')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 6, max: 50 })
    .withMessage('La identificación debe tener entre 6 y 50 caracteres')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('La identificación solo puede contener letras, números y guiones')
    .trim(),

  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('El formato del email no es válido')
    .isLength({ max: 150 })
    .withMessage('El email no puede exceder 150 caracteres')
    .normalizeEmail(),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[0-9\s\-\+\(\)]+$/)
    .withMessage('El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +')
    .isLength({ min: 7, max: 20 })
    .withMessage('El teléfono debe tener entre 7 y 20 caracteres')
    .trim(),

  body('birthDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate());

      if (birthDate < minDate) {
        throw new Error('La fecha de nacimiento no puede ser anterior a 120 años');
      }
      if (birthDate > maxDate) {
        throw new Error('La persona debe tener al menos 5 años de edad');
      }
      return true;
    }),

  body('age')
    .optional({ nullable: true })
    .isInt({ min: 5, max: 120 })
    .withMessage('La edad debe estar entre 5 y 120 años'),

  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 })
    .withMessage('La dirección no puede exceder 200 caracteres')
    .trim(),

  body('team')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('El nombre del equipo no puede exceder 100 caracteres')
    .trim(),

  body('category')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 })
    .withMessage('La categoría no puede exceder 100 caracteres')
    .trim(),

  body('documentTypeId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('El tipo de documento debe ser un número válido'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('El estado debe ser Active o Inactive'),
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

// Validaciones para verificar disponibilidad de identificación
export const checkIdentificationValidation = [
  query('identification')
    .notEmpty()
    .withMessage('La identificación es requerida')
    .isLength({ min: 6, max: 50 })
    .withMessage('La identificación debe tener entre 6 y 50 caracteres')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('La identificación solo puede contener letras, números y guiones')
    .trim(),

  query('excludeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID a excluir debe ser un número entero positivo'),
];

// Validaciones para verificar disponibilidad de email
export const checkEmailValidation = [
  query('email')
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('El formato del email no es válido')
    .isLength({ max: 150 })
    .withMessage('El email no puede exceder 150 caracteres')
    .normalizeEmail(),

  query('excludeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El ID a excluir debe ser un número entero positivo'),
];

// Validaciones generales para verificar disponibilidad (compatibilidad)
export const checkAvailabilityValidation = [
  query('identification')
    .optional()
    .isLength({ min: 6, max: 50 })
    .withMessage('La identificación debe tener entre 6 y 50 caracteres')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('La identificación solo puede contener letras, números y guiones')
    .trim(),

  query('email')
    .optional()
    .isEmail()
    .withMessage('El email debe tener un formato válido')
    .isLength({ max: 150 })
    .withMessage('El email no puede exceder 150 caracteres')
    .normalizeEmail(),

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