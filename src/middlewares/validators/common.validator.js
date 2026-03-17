import { param, validationResult } from "express-validator";

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

/**
 * Validador de ID numérico
 */
export const validateId = (paramName = "id") => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} debe ser un número entero positivo`)
    .toInt(),
  handleValidationErrors,
];

/**
 * Validador de UUID
 */
export const validateUUID = (paramName = "id") => [
  param(paramName).isUUID().withMessage(`${paramName} debe ser un UUID válido`),
  handleValidationErrors,
];

