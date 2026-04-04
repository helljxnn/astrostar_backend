import { body, validationResult } from 'express-validator';

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
 * Validadores para autenticación
 */
export const authValidators = {
  passwordPolicy: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/,
    message:
      "La contraseña debe tener al menos 8 caracteres e incluir: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial.",
  },

  /**
   * Validación para login
   */
  login: [
    body('email')
      .notEmpty()
      .withMessage('El email es obligatorio.')
      .isEmail()
      .withMessage('Debe proporcionar un email válido.')
      .trim()
      .toLowerCase(),

    body('password')
      .notEmpty()
      .withMessage('La contraseña es obligatoria.')
      .isLength({ min: 1 })
      .withMessage('La contraseña no puede estar vacía.')
  ],

  /**
   * Validación para cambio de contraseña
   */
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('La contraseña actual es obligatoria.')
      .isLength({ min: 1 })
      .withMessage('La contraseña actual no puede estar vacía.'),

    body('newPassword')
      .notEmpty()
      .withMessage('La nueva contraseña es obligatoria.')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
      .withMessage('La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial.')
  ],

  /**
   * Validación para solicitar recuperación de contraseña
   */
  forgotPassword: [
    body('email')
      .notEmpty()
      .withMessage('El email es obligatorio.')
      .isEmail()
      .withMessage('Debe proporcionar un email válido.')
      .trim()
      .toLowerCase()
  ],

  /**
   * Validación para verificar token de recuperación
   */
  verifyResetToken: [
    body('token')
      .notEmpty()
      .withMessage('El código es obligatorio.')
      .isLength({ min: 6, max: 6 })
      .withMessage('El código debe tener 6 dígitos.')
      .isNumeric()
      .withMessage('El código debe contener solo números.')
  ],

  /**
   * Validación para restablecer contraseña
   */
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('El código es obligatorio.')
      .isLength({ min: 6, max: 6 })
      .withMessage('El código debe tener 6 dígitos.')
      .isNumeric()
      .withMessage('El código debe contener solo números.'),

    body('newPassword')
      .notEmpty()
      .withMessage('La nueva contraseña es obligatoria.')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
      .withMessage('La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial.')
  ],

  requestEmailChange: [
    body('newEmail')
      .notEmpty()
      .withMessage('El nuevo correo es obligatorio.')
      .isEmail()
      .withMessage('Debe proporcionar un correo válido.')
      .trim()
      .toLowerCase(),
  ],

  verifyEmailChange: [
    body('token')
      .notEmpty()
      .withMessage('El código es obligatorio.')
      .isLength({ min: 6, max: 6 })
      .withMessage('El código debe tener 6 dígitos.')
      .isNumeric()
      .withMessage('El código debe contener solo números.'),
  ],

  updateProfile: [
    body('phoneNumber')
      .optional({ nullable: true })
      .isString()
      .withMessage('El teléfono debe ser texto.')
      .trim()
      .matches(/^\d{7,15}$/)
      .withMessage('El teléfono debe tener entre 7 y 15 dígitos.'),

    body('address')
      .optional({ nullable: true })
      .isString()
      .withMessage('La dirección debe ser texto.')
      .trim()
      .isLength({ max: 250 })
      .withMessage('La dirección no puede superar 250 caracteres.'),

    body('avatarColorIndex')
      .optional({ nullable: true })
      .isInt({ min: 0, max: 5 })
      .withMessage('El índice de color debe estar entre 0 y 5.'),
  ],
};
