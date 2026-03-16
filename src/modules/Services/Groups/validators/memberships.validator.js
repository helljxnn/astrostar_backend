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

export const membershipValidators = {
  // Validación para agregar miembro
  addMember: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del grupo debe ser un número entero válido."),
    body("athleteId")
      .notEmpty()
      .withMessage("El ID de la deportista es obligatorio.")
      .isInt({ min: 1 })
      .withMessage("El ID de la deportista debe ser un número entero válido."),
    body("startDate")
      .optional()
      .isISO8601()
      .withMessage(
        "La fecha de inicio debe ser una fecha válida (YYYY-MM-DD).",
      ),
  ],

  // Validación para actualizar membresía
  updateMembership: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID de la membresía debe ser un número entero válido."),
    body("status")
      .optional()
      .isIn(["ACTIVE", "INACTIVE"])
      .withMessage("El estado debe ser ACTIVE o INACTIVE."),
    body("endDate")
      .optional()
      .isISO8601()
      .withMessage("La fecha de fin debe ser una fecha válida (YYYY-MM-DD)."),
  ],

  // Validación para eliminar membresía
  deleteMembership: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID de la membresía debe ser un número entero válido."),
  ],

  // Validación para obtener miembros de un grupo
  getGroupMembers: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del grupo debe ser un número entero válido."),
    query("status")
      .optional()
      .isIn(["ACTIVE", "INACTIVE"])
      .withMessage("El estado debe ser ACTIVE o INACTIVE."),
  ],

  // Validación para obtener grupos de una deportista
  getAthleteGroups: [
    param("athleteId")
      .isInt({ min: 1 })
      .withMessage("El ID de la deportista debe ser un número entero válido."),
  ],
};

