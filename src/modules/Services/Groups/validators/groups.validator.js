import { body, param, query, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
      value: firstError.value,
    });
  }
  next();
};

export const groupValidators = {
  // Validación para obtener todos los grupos
  getAll: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La página debe ser un número entero mayor a 0."),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("El límite debe estar entre 1 y 100."),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("La búsqueda no puede exceder 100 caracteres."),
    query("status")
      .optional()
      .isIn(["ACTIVE", "ARCHIVED"])
      .withMessage("El estado debe ser ACTIVE o ARCHIVED."),
    query("level")
      .optional()
      .isIn(["A1", "A2", "B1", "B2", "C1", "C2"])
      .withMessage("El nivel debe ser A1, A2, B1, B2, C1 o C2."),
  ],

  // Validación para obtener grupo por ID
  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del grupo debe ser un número entero válido."),
  ],

  // Validación para crear grupo
  create: [
    body("name")
      .notEmpty()
      .withMessage("El nombre del grupo es obligatorio.")
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres."),
    body("level")
      .notEmpty()
      .withMessage("El nivel es obligatorio.")
      .isIn(["A1", "A2", "B1", "B2", "C1", "C2"])
      .withMessage("El nivel debe ser A1, A2, B1, B2, C1 o C2."),
    body("teacherId")
      .notEmpty()
      .withMessage("El ID del profesor es obligatorio.")
      .isInt({ min: 1 })
      .withMessage("El ID del profesor debe ser un número entero válido."),
    body("maxCapacity")
      .notEmpty()
      .withMessage("El cupo máximo es obligatorio.")
      .isInt({ min: 1, max: 100 })
      .withMessage("El cupo máximo debe estar entre 1 y 100."),
    body("status")
      .optional()
      .isIn(["ACTIVE", "ARCHIVED"])
      .withMessage("El estado debe ser ACTIVE o ARCHIVED."),
  ],

  // Validación para actualizar grupo
  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del grupo debe ser un número entero válido."),
    body("name")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres."),
    body("level")
      .optional()
      .isIn(["A1", "A2", "B1", "B2", "C1", "C2"])
      .withMessage("El nivel debe ser A1, A2, B1, B2, C1 o C2."),
    body("teacherId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID del profesor debe ser un número entero válido."),
    body("maxCapacity")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("El cupo máximo debe estar entre 1 y 100."),
    body("status")
      .optional()
      .isIn(["ACTIVE", "ARCHIVED"])
      .withMessage("El estado debe ser ACTIVE o ARCHIVED."),
  ],

  // Validación para actualizar estado
  updateStatus: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del grupo debe ser un número entero válido."),
    body("status")
      .notEmpty()
      .withMessage("El estado es obligatorio.")
      .isIn(["ACTIVE", "ARCHIVED"])
      .withMessage("El estado debe ser ACTIVE o ARCHIVED."),
  ],

  // Validación para eliminar grupo
  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del grupo debe ser un número entero válido."),
  ],
};

