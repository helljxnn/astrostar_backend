import { body, param } from "express-validator";
import { handleValidationErrors } from "./common.validator.js";

/**
 * Validador para creación de usuario
 */
export const validateCreateUser = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email muy largo"),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 50 })
    .withMessage("Nombre entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Solo letras permitidas en el nombre")
    .escape(),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("El apellido es requerido")
    .isLength({ min: 2, max: 50 })
    .withMessage("Apellido entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Solo letras permitidas en el apellido")
    .escape(),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Número de teléfono inválido"),

  body("identification")
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("Identificación entre 5 y 20 caracteres")
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage("Identificación inválida"),

  handleValidationErrors,
];

/**
 * Validador para actualización de usuario
 */
export const validateUpdateUser = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido").toInt(),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email muy largo"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Nombre entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Solo letras permitidas")
    .escape(),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Apellido entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Solo letras permitidas")
    .escape(),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Número de teléfono inválido"),

  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Suspended"])
    .withMessage("Estado inválido"),

  handleValidationErrors,
];

/**
 * Validador de ID de usuario
 */
export const validateUserId = [
  param("id").isInt({ min: 1 }).withMessage("ID de usuario inválido").toInt(),

  handleValidationErrors,
];
