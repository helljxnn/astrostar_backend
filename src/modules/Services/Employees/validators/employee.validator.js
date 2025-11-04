import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
      value: firstError.value,
      errors: errors.array()
    });
  }
  
  next();
};

/**
 * Validadores para empleados
 */
export const employeeValidators = {
  
  /**
   * Validación para obtener todos los empleados
   */
  getAll: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número entero mayor a 0.')
      .toInt(),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100.')
      .toInt(),
    
    query('search')
      .optional()
      .isLength({ max: 100 })
      .withMessage('La búsqueda no puede exceder 100 caracteres.')
      .trim(),
    
    query('status')
      .optional()
      .isIn(['Active', 'Disabled', 'OnVacation', 'Retired'])
      .withMessage('El estado debe ser: Active, Disabled, OnVacation o Retired.'),
    
    query('employeeTypeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El tipo de empleado debe ser un número entero válido.')
      .toInt()
  ],

  /**
   * Validación para obtener empleado por ID
   */
  getById: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del empleado debe ser un número entero válido.')
      .toInt()
  ],

  /**
   * Validación para crear empleado
   */
  create: [
    // Datos personales básicos
    body('firstName')
      .notEmpty()
      .withMessage('El nombre es obligatorio.')
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El nombre solo puede contener letras y espacios.')
      .trim(),

    body('middleName')
      .optional({ nullable: true })
      .isLength({ max: 100 })
      .withMessage('El segundo nombre no puede exceder 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      .withMessage('El segundo nombre solo puede contener letras y espacios.')
      .trim(),

    body('lastName')
      .notEmpty()
      .withMessage('El apellido es obligatorio.')
      .isLength({ min: 2, max: 100 })
      .withMessage('El apellido debe tener entre 2 y 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El apellido solo puede contener letras y espacios.')
      .trim(),

    body('secondLastName')
      .optional({ nullable: true })
      .isLength({ max: 100 })
      .withMessage('El segundo apellido no puede exceder 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      .withMessage('El segundo apellido solo puede contener letras y espacios.')
      .trim(),

    // Contacto
    body('email')
      .notEmpty()
      .withMessage('El email es obligatorio.')
      .isEmail()
      .withMessage('Debe proporcionar un email válido.')
      .isLength({ max: 150 })
      .withMessage('El email no puede exceder 150 caracteres.')
      .trim()
      .toLowerCase(),

    body('phoneNumber')
      .optional({ nullable: true })
      .isMobilePhone('es-CO')
      .withMessage('Debe proporcionar un número de teléfono colombiano válido.')
      .isLength({ min: 10, max: 20 })
      .withMessage('El teléfono debe tener entre 10 y 20 caracteres.'),

    body('address')
      .optional({ nullable: true })
      .isLength({ max: 200 })
      .withMessage('La dirección no puede exceder 200 caracteres.')
      .trim(),

    // Identificación
    body('identification')
      .notEmpty()
      .withMessage('La identificación es obligatoria.')
      .isLength({ min: 6, max: 50 })
      .withMessage('La identificación debe tener entre 6 y 50 caracteres.')
      .matches(/^[0-9A-Za-z\-]+$/)
      .withMessage('La identificación solo puede contener números, letras y guiones.')
      .trim(),

    body('documentTypeId')
      .notEmpty()
      .withMessage('El tipo de documento es obligatorio.')
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un tipo de documento válido.')
      .toInt(),

    // Fecha de nacimiento
    body('birthDate')
      .notEmpty()
      .withMessage('La fecha de nacimiento es obligatoria.')
      .isISO8601()
      .withMessage('La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD).')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 16) {
          throw new Error('El empleado debe ser mayor de 16 años.');
        }
        
        if (age > 80) {
          throw new Error('La edad no puede ser mayor a 80 años.');
        }
        
        return true;
      }),

    // Datos de empleado
    body('employeeTypeId')
      .notEmpty()
      .withMessage('El tipo de empleado es obligatorio.')
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un tipo de empleado válido.')
      .toInt(),

    body('roleId')
      .notEmpty()
      .withMessage('El rol es obligatorio.')
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un rol válido.')
      .toInt(),

    body('status')
      .optional()
      .isIn(['Active', 'Disabled', 'OnVacation', 'Retired'])
      .withMessage('El estado debe ser: Active, Disabled, OnVacation o Retired.'),

    // Contraseña temporal (opcional)
    body('temporaryPassword')
      .optional()
      .isLength({ min: 6, max: 50 })
      .withMessage('La contraseña temporal debe tener entre 6 y 50 caracteres.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/)
      .withMessage('La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número.')
  ],

  /**
   * Validación para actualizar empleado
   */
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del empleado debe ser un número entero válido.')
      .toInt(),

    // Todos los campos son opcionales en actualización
    body('firstName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('El nombre debe tener entre 2 y 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El nombre solo puede contener letras y espacios.')
      .trim(),

    body('middleName')
      .optional({ nullable: true })
      .isLength({ max: 100 })
      .withMessage('El segundo nombre no puede exceder 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      .withMessage('El segundo nombre solo puede contener letras y espacios.')
      .trim(),

    body('lastName')
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage('El apellido debe tener entre 2 y 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('El apellido solo puede contener letras y espacios.')
      .trim(),

    body('secondLastName')
      .optional({ nullable: true })
      .isLength({ max: 100 })
      .withMessage('El segundo apellido no puede exceder 100 caracteres.')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      .withMessage('El segundo apellido solo puede contener letras y espacios.')
      .trim(),

    body('email')
      .optional()
      .isEmail()
      .withMessage('Debe proporcionar un email válido.')
      .isLength({ max: 150 })
      .withMessage('El email no puede exceder 150 caracteres.')
      .trim()
      .toLowerCase(),

    body('phoneNumber')
      .optional({ nullable: true })
      .isMobilePhone('es-CO')
      .withMessage('Debe proporcionar un número de teléfono colombiano válido.')
      .isLength({ min: 10, max: 20 })
      .withMessage('El teléfono debe tener entre 10 y 20 caracteres.'),

    body('address')
      .optional({ nullable: true })
      .isLength({ max: 200 })
      .withMessage('La dirección no puede exceder 200 caracteres.')
      .trim(),

    body('identification')
      .optional()
      .isLength({ min: 6, max: 50 })
      .withMessage('La identificación debe tener entre 6 y 50 caracteres.')
      .matches(/^[0-9A-Za-z\-]+$/)
      .withMessage('La identificación solo puede contener números, letras y guiones.')
      .trim(),

    body('documentTypeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un tipo de documento válido.')
      .toInt(),

    body('birthDate')
      .optional()
      .isISO8601()
      .withMessage('La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD).')
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 16) {
          throw new Error('El empleado debe ser mayor de 16 años.');
        }
        
        if (age > 80) {
          throw new Error('La edad no puede ser mayor a 80 años.');
        }
        
        return true;
      }),

    body('employeeTypeId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un tipo de empleado válido.')
      .toInt(),

    body('roleId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Debe seleccionar un rol válido.')
      .toInt(),

    body('status')
      .optional()
      .isIn(['Active', 'Disabled', 'OnVacation', 'Retired'])
      .withMessage('El estado debe ser: Active, Disabled, OnVacation o Retired.')
  ],

  /**
   * Validación para eliminar empleado
   */
  delete: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('El ID del empleado debe ser un número entero válido.')
      .toInt()
  ],

  /**
   * Validación para verificar disponibilidad de email
   */
  checkEmail: [
    query('email')
      .notEmpty()
      .withMessage('El email es obligatorio.')
      .isEmail()
      .withMessage('Debe proporcionar un email válido.')
      .trim()
      .toLowerCase(),
    
    query('excludeUserId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID de usuario a excluir debe ser un número entero válido.')
      .toInt()
  ],

  /**
   * Validación para verificar disponibilidad de identificación
   */
  checkIdentification: [
    query('identification')
      .notEmpty()
      .withMessage('La identificación es obligatoria.')
      .isLength({ min: 6, max: 50 })
      .withMessage('La identificación debe tener entre 6 y 50 caracteres.')
      .matches(/^[0-9A-Za-z\-]+$/)
      .withMessage('La identificación solo puede contener números, letras y guiones.')
      .trim(),
    
    query('excludeUserId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('El ID de usuario a excluir debe ser un número entero válido.')
      .toInt()
  ]
};