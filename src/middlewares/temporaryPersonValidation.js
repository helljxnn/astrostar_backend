/**
 * Middleware de validación para Personas Temporales
 * Valida todos los campos de entrada para operaciones CRUD
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Errores de validación en los datos enviados.',
      errors: errorMessages
    });
  }
  next();
};

/**
 * Validaciones para crear persona temporal
 */
export const validateCreateTemporaryPerson = [
  // Nombre - Requerido
  body('firstName')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios')
    .trim(),

  // Apellido - Requerido
  body('lastName')
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios')
    .trim(),

  // Tipo de persona - Requerido
  body('personType')
    .notEmpty()
    .withMessage('El tipo de persona es requerido')
    .isIn(['Deportista', 'Entrenador', 'Participante'])
    .withMessage('El tipo de persona debe ser: Deportista, Entrenador o Participante'),

  // Identificación - Opcional pero con validaciones si se proporciona
  body('identification')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 6, max: 50 })
    .withMessage('La identificación debe tener entre 6 y 50 caracteres')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('La identificación solo puede contener letras, números y guiones')
    .trim(),

  // Email - Opcional pero con validaciones si se proporciona
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail()
    .withMessage('El formato del email no es válido')
    .isLength({ max: 150 })
    .withMessage('El email no puede exceder 150 caracteres')
    .normalizeEmail(),

  // Teléfono - Opcional pero con validaciones si se proporciona
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^[0-9\s\-\+\(\)]+$/)
    .withMessage('El teléfono solo puede contener números, espacios, guiones, paréntesis y el signo +')
    .isLength({ min: 7, max: 20 })
    .withMessage('El teléfono debe tener entre 7 y 20 caracteres')
    .trim(),

  // Fecha de nacimiento - Opcional pero con validaciones si se proporciona
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

  // Edad - Opcional, se calcula automáticamente
  body('age')
    .optional({ nullable: true })
    .isInt({ min: 5, max: 120 })
    .withMessage('La edad debe estar entre 5 y 120 años'),

  // Dirección - Opcional
  body('address')
    .optional({ nullable: true, checkFalsy: true })
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

  handleValidationErrors
];

/**
 * Validaciones para actualizar persona temporal
 */
export const validateUpdateTemporaryPerson = [
  // ID en parámetros
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  // Mismo conjunto de validaciones que crear, pero todos opcionales
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El nombre solo puede contener letras y espacios')
    .trim(),

  body('lastName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('El apellido solo puede contener letras y espacios')
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

  handleValidationErrors
];

/**
 * Validaciones para obtener persona temporal por ID
 */
export const validateGetTemporaryPersonById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  handleValidationErrors
];

/**
 * Validaciones para eliminar persona temporal
 */
export const validateDeleteTemporaryPerson = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  handleValidationErrors
];

/**
 * Validaciones para parámetros de consulta (filtros y paginación)
 */
export const validateQueryParams = [
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
    .withMessage('El término de búsqueda no puede exceder 100 caracteres')
    .trim(),

  query('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('El estado debe ser Active o Inactive'),

  query('personType')
    .optional()
    .isIn(['Deportista', 'Entrenador', 'Participante'])
    .withMessage('El tipo de persona debe ser: Deportista, Entrenador o Participante'),

  handleValidationErrors
];

/**
 * Validaciones para verificar disponibilidad de identificación
 */
export const validateCheckIdentification = [
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

  handleValidationErrors
];

/**
 * Validaciones para verificar disponibilidad de email
 */
export const validateCheckEmail = [
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

  handleValidationErrors
];

/**
 * Validación personalizada para verificar que los campos requeridos estén presentes
 */
export const validateRequiredFields = (req, res, next) => {
  const { firstName, lastName, personType } = req.body;

  const missingFields = [];
  if (!firstName || !firstName.trim()) missingFields.push('firstName (nombre)');
  if (!lastName || !lastName.trim()) missingFields.push('lastName (apellido)');
  if (!personType) missingFields.push('personType (tipo de persona)');

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Los siguientes campos son requeridos: ${missingFields.join(', ')}`,
      missingFields
    });
  }

  next();
};

/**
 * Validación de lógica de negocio específica
 */
export const validateBusinessLogic = (req, res, next) => {
  const { personType, team, category, birthDate, age } = req.body;

  // Validar que deportistas y entrenadores tengan equipo y categoría si se proporcionan
  if (personType === 'Deportista' || personType === 'Entrenador') {
    // No es obligatorio, pero si se proporciona debe ser válido
    if (team && team.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Si se especifica un equipo, no puede estar vacío'
      });
    }
    
    if (category && category.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Si se especifica una categoría, no puede estar vacía'
      });
    }
  }

  // Validar coherencia entre fecha de nacimiento y edad
  if (birthDate && age) {
    const calculatedAge = calculateAge(birthDate);
    if (Math.abs(calculatedAge - parseInt(age)) > 1) {
      return res.status(400).json({
        success: false,
        message: 'La edad proporcionada no coincide con la fecha de nacimiento'
      });
    }
  }

  next();
};

/**
 * Función auxiliar para calcular edad
 */
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 ? age : 0;
}