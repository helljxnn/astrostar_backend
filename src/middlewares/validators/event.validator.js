import { body, param, query } from "express-validator";
import { validateRequest } from "./common.validator.js";

/**
 * Validación para crear evento
 */
export const validateCreateEvent = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("El título es requerido")
    .isLength({ min: 3, max: 200 })
    .withMessage("El título debe tener entre 3 y 200 caracteres")
    .escape(),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción es requerida")
    .isLength({ min: 10, max: 2000 })
    .withMessage("La descripción debe tener entre 10 y 2000 caracteres"),

  body("date")
    .notEmpty()
    .withMessage("La fecha es requerida")
    .isISO8601()
    .withMessage("Formato de fecha inválido")
    .custom((value) => {
      const eventDate = new Date(value);
      const now = new Date();
      if (eventDate < now) {
        throw new Error("La fecha del evento no puede ser en el pasado");
      }
      return true;
    }),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("La ubicación es requerida")
    .isLength({ min: 3, max: 300 })
    .withMessage("La ubicación debe tener entre 3 y 300 caracteres")
    .escape(),

  body("capacity")
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage("La capacidad debe ser un número entre 1 y 100000"),

  body("status")
    .optional()
    .isIn(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"])
    .withMessage("Estado inválido"),

  body("requiresRSVP")
    .optional()
    .isBoolean()
    .withMessage("requiresRSVP debe ser booleano"),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic debe ser booleano"),

  body("imageUrl")
    .optional()
    .trim()
    .isURL({ protocols: ["http", "https"] })
    .withMessage("URL de imagen inválida"),

  validateRequest,
];

/**
 * Validación para actualizar evento
 */
export const validateUpdateEvent = [
  param("id").isUUID().withMessage("ID de evento inválido"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("El título debe tener entre 3 y 200 caracteres")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("La descripción debe tener entre 10 y 2000 caracteres"),

  body("date").optional().isISO8601().withMessage("Formato de fecha inválido"),

  body("location")
    .optional()
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage("La ubicación debe tener entre 3 y 300 caracteres")
    .escape(),

  body("capacity")
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage("La capacidad debe ser un número entre 1 y 100000"),

  body("status")
    .optional()
    .isIn(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"])
    .withMessage("Estado inválido"),

  body("requiresRSVP")
    .optional()
    .isBoolean()
    .withMessage("requiresRSVP debe ser booleano"),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic debe ser booleano"),

  body("imageUrl")
    .optional()
    .trim()
    .isURL({ protocols: ["http", "https"] })
    .withMessage("URL de imagen inválida"),

  validateRequest,
];

/**
 * Validación para RSVP
 */
export const validateRSVP = [
  param("id").isUUID().withMessage("ID de evento inválido"),

  body("status")
    .notEmpty()
    .withMessage("El estado es requerido")
    .isIn(["CONFIRMED", "DECLINED", "MAYBE"])
    .withMessage("Estado inválido"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Las notas no pueden exceder 500 caracteres"),

  validateRequest,
];

/**
 * Validación para invitaciones
 */
export const validateInvitation = [
  param("id").isUUID().withMessage("ID de evento inválido"),

  body("userIds")
    .isArray({ min: 1 })
    .withMessage("Debe proporcionar al menos un usuario"),

  body("userIds.*").isUUID().withMessage("ID de usuario inválido"),

  validateRequest,
];

/**
 * Validación para consultas de eventos
 */
export const validateEventQuery = [
  query("status")
    .optional()
    .isIn(["DRAFT", "PUBLISHED", "CANCELLED", "COMPLETED"])
    .withMessage("Estado inválido"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha inicial inválido"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha final inválido"),

  query("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic debe ser booleano"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La página debe ser un número mayor a 0"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El límite debe estar entre 1 y 100"),

  validateRequest,
];

