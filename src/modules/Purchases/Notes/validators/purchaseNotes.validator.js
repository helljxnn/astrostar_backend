import { body, param, validationResult } from "express-validator";

export const purchaseNotesValidators = {
  getNotes: [
    param("purchaseId")
      .isInt({ min: 1 })
      .withMessage("El ID de la compra debe ser un número entero positivo"),
  ],

  createNote: [
    param("purchaseId")
      .isInt({ min: 1 })
      .withMessage("El ID de la compra debe ser un número entero positivo"),
    body("note")
      .trim()
      .notEmpty()
      .withMessage("El texto de la nota es requerido")
      .isLength({ min: 5, max: 2000 })
      .withMessage("La nota debe tener entre 5 y 2000 caracteres"),
  ],
};

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};
