import { body, param } from "express-validator";
import { handleValidationErrors } from "./common.validator.js";

/**
 * Validador para creación de matrícula
 */
export const validateCreateEnrollment = [
  body("athleteId")
    .notEmpty()
    .withMessage("El ID del atleta es requerido")
    .isInt({ min: 1 })
    .withMessage("ID de atleta inválido")
    .toInt(),

  body("teamId")
    .notEmpty()
    .withMessage("El ID del equipo es requerido")
    .isInt({ min: 1 })
    .withMessage("ID de equipo inválido")
    .toInt(),

  body("enrollmentDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de matrícula inválida")
    .toDate(),

  body("expirationDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de expiración inválida")
    .toDate(),

  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Expired", "Pending"])
    .withMessage("Estado inválido"),

  handleValidationErrors,
];

/**
 * Validador para actualización de matrícula
 */
export const validateUpdateEnrollment = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido").toInt(),

  body("teamId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("ID de equipo inválido")
    .toInt(),

  body("enrollmentDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de matrícula inválida")
    .toDate(),

  body("expirationDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de expiración inválida")
    .toDate(),

  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Expired", "Pending"])
    .withMessage("Estado inválido"),

  handleValidationErrors,
];

/**
 * Validador de ID de matrícula
 */
export const validateEnrollmentId = [
  param("id").isInt({ min: 1 }).withMessage("ID de matrícula inválido").toInt(),

  handleValidationErrors,
];

// NOTA: El validador validateRenewEnrollment ha sido eliminado
// La renovación se maneja automáticamente a través del sistema de pagos
// No se requiere validación manual para este proceso

