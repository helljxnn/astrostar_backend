import { body, param, query } from "express-validator";
import { validateRequest } from "./common.validator.js";

/**
 * Validación para crear equipo
 */
export const validateCreateTeam = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre debe tener entre 2 y 200 caracteres")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("La descripción no puede exceder 1000 caracteres"),

  body("sport")
    .trim()
    .notEmpty()
    .withMessage("El deporte es requerido")
    .isLength({ min: 2, max: 100 })
    .withMessage("El deporte debe tener entre 2 y 100 caracteres")
    .escape(),

  body("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La categoría no puede exceder 100 caracteres")
    .escape(),

  body("ageGroup")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("El grupo de edad no puede exceder 50 caracteres")
    .escape(),

  body("maxMembers")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El máximo de miembros debe estar entre 1 y 100"),

  body("coachId").optional().isUUID().withMessage("ID de entrenador inválido"),

  body("schedule")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("El horario no puede exceder 500 caracteres"),

  validateRequest,
];

/**
 * Validación para actualizar equipo
 */
export const validateUpdateTeam = [
  param("id").isUUID().withMessage("ID de equipo inválido"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre debe tener entre 2 y 200 caracteres")
    .escape(),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("La descripción no puede exceder 1000 caracteres"),

  body("sport")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El deporte debe tener entre 2 y 100 caracteres")
    .escape(),

  body("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La categoría no puede exceder 100 caracteres")
    .escape(),

  body("ageGroup")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("El grupo de edad no puede exceder 50 caracteres")
    .escape(),

  body("maxMembers")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("El máximo de miembros debe estar entre 1 y 100"),

  body("coachId").optional().isUUID().withMessage("ID de entrenador inválido"),

  body("schedule")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("El horario no puede exceder 500 caracteres"),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "SUSPENDED"])
    .withMessage("Estado inválido"),

  validateRequest,
];

/**
 * Validación para agregar miembro al equipo
 */
export const validateAddTeamMember = [
  param("id").isUUID().withMessage("ID de equipo inválido"),

  body("athleteId")
    .notEmpty()
    .withMessage("El ID del deportista es requerido")
    .isUUID()
    .withMessage("ID de deportista inválido"),

  body("position")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La posición no puede exceder 100 caracteres")
    .escape(),

  body("jerseyNumber")
    .optional()
    .isInt({ min: 0, max: 999 })
    .withMessage("El número de camiseta debe estar entre 0 y 999"),

  validateRequest,
];

/**
 * Validación para consultas de equipos
 */
export const validateTeamQuery = [
  query("sport")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Deporte inválido"),

  query("category")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Categoría inválida"),

  query("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "SUSPENDED"])
    .withMessage("Estado inválido"),

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
