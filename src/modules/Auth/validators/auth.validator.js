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
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres.')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('La nueva contraseña debe contener al menos: 1 minúscula, 1 mayúscula y 1 número.')
  ]
};