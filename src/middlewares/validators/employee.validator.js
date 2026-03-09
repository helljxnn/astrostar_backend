import { body, param } from "express-validator";
import { handleValidationErrors } from "./common.validator.js";

/**
 * Validador para creación de empleado
 */
export const validateCreateEmployee = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 50 })
    .withMessage("Nombre entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Solo letras permitidas")
    .escape(),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("El apellido es requerido")
    .isLength({ min: 2, max: 50 })
    .withMessage("Apellido entre 2 y 50 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("Solo letras permitidas")
    .escape(),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email muy largo"),

  body("identification")
    .trim()
    .notEmpty()
    .withMessage("La identificación es requerida")
    .isLength({ min: 5, max: 20 })
    .withMessage("Identificación entre 5 y 20 caracteres")
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage("Identificación inválida"),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Número de teléfono inválido"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Dirección muy larga")
    .escape(),

  body("birthDate")
    .optional()
    .isISO8601()
    .withMessage("Fecha de nacimiento inválida")
    .toDate(),

  body("roleId")
    .notEmpty()
    .withMessage("El rol es requerido")
    .isInt({ min: 1 })
    .withMessage("ID de rol inválido")
    .toInt(),

  body("documentTypeId")
    .notEmpty()
    .withMessage("El tipo de documento es requerido")
    .isInt({ min: 1 })
    .withMessage("ID de tipo de documento inválido")
    .toInt(),

  handleValidationErrors,
];

/**
 * Validador para actualización de empleado
 */
export const validateUpdateEmployee = [
  param("id").isInt({ min: 1 }).withMessage("ID inválido").toInt(),

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

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Número de teléfono inválido"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Dirección muy larga")
    .escape(),

  body("status")
    .optional()
    .isIn(["Active", "Inactive", "Suspended"])
    .withMessage("Estado inválido"),

  handleValidationErrors,
];

/**
 * Validador de ID de empleado
 */
export const validateEmployeeId = [
  param("id").isInt({ min: 1 }).withMessage("ID de empleado inválido").toInt(),

  handleValidationErrors,
];
