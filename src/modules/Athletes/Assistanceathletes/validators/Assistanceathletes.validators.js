import { body, query, validationResult } from "express-validator";

export const assistanceathletesValidators = {
  getByDate: [
    query("date")
      .notEmpty()
      .withMessage("La fecha es obligatoria.")
      .isISO8601()
      .withMessage("La fecha debe tener formato YYYY-MM-DD."),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString(),
    query("categoria").optional().isString(),
  ],
  saveBulk: [
    body("date")
      .notEmpty()
      .withMessage("La fecha es obligatoria.")
      .isISO8601()
      .withMessage("La fecha debe tener formato YYYY-MM-DD."),
    body("items")
      .isArray({ min: 1 })
      .withMessage("Debe enviar un listado de asistencias."),
    body("items.*.athleteId")
      .isInt({ min: 1 })
      .withMessage("athleteId debe ser un número válido."),
    body("items.*.asistencia")
      .isBoolean()
      .withMessage("asistencia debe ser boolean."),
    body("items.*.observacion")
      .optional({ checkFalsy: true })
      .isString()
      .isLength({ max: 500 })
      .withMessage("La observación no puede superar 500 caracteres."),
  ],
  getHistory: [
    query("athleteId")
      .notEmpty()
      .withMessage("athleteId es obligatorio.")
      .isInt({ min: 1 })
      .withMessage("athleteId debe ser un número válido."),
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
  ],
  getHistorySummary: [
    query("startDate").optional().isISO8601(),
    query("endDate").optional().isISO8601(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("search").optional().isString(),
    query("categoria").optional().isString(),
  ],
};

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
      statusCode: 400,
    });
  }
  next();
};

