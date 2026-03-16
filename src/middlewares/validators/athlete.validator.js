import { body, param, query } from "express-validator";
import { validateRequest } from "./common.validator.js";

/**
 * Validación para crear deportista
 */
export const validateCreateAthlete = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras")
    .escape(),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("El apellido es requerido")
    .isLength({ min: 2, max: 100 })
    .withMessage("El apellido debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido solo puede contener letras")
    .escape(),

  body("documentType")
    .notEmpty()
    .withMessage("El tipo de documento es requerido")
    .isIn(["CC", "TI", "CE", "PASSPORT"])
    .withMessage("Tipo de documento inválido"),

  body("documentNumber")
    .trim()
    .notEmpty()
    .withMessage("El número de documento es requerido")
    .isLength({ min: 5, max: 20 })
    .withMessage("El número de documento debe tener entre 5 y 20 caracteres")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("Número de documento inválido"),

  body("birthDate")
    .notEmpty()
    .withMessage("La fecha de nacimiento es requerida")
    .isISO8601()
    .withMessage("Formato de fecha inválido")
    .custom((value) => {
      const birthDate = new Date(value);
      const now = new Date();
      const age = now.getFullYear() - birthDate.getFullYear();
      if (age < 5 || age > 100) {
        throw new Error("La edad debe estar entre 5 y 100 años");
      }
      return true;
    }),

  body("gender")
    .notEmpty()
    .withMessage("El género es requerido")
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Género inválido"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Teléfono inválido")
    .isLength({ min: 7, max: 20 })
    .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("La dirección no puede exceder 300 caracteres")
    .escape(),

  body("guardianName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre del acudiente debe tener entre 2 y 200 caracteres")
    .escape(),

  body("guardianPhone")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Teléfono del acudiente inválido")
    .isLength({ min: 7, max: 20 })
    .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),

  body("emergencyContact")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Contacto de emergencia inválido")
    .escape(),

  body("medicalNotes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las notas médicas no pueden exceder 1000 caracteres"),

  validateRequest,
];

/**
 * Validación para actualizar deportista
 */
export const validateUpdateAthlete = [
  param("id").isUUID().withMessage("ID de deportista inválido"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras")
    .escape(),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El apellido debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El apellido solo puede contener letras")
    .escape(),

  body("documentType")
    .optional()
    .isIn(["CC", "TI", "CE", "PASSPORT"])
    .withMessage("Tipo de documento inválido"),

  body("documentNumber")
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("El número de documento debe tener entre 5 y 20 caracteres")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("Número de documento inválido"),

  body("birthDate")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha inválido"),

  body("gender")
    .optional()
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Género inválido"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Teléfono inválido")
    .isLength({ min: 7, max: 20 })
    .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("La dirección no puede exceder 300 caracteres")
    .escape(),

  body("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "SUSPENDED"])
    .withMessage("Estado inválido"),

  validateRequest,
];

/**
 * Validación para consultas de deportistas
 */
export const validateAthleteQuery = [
  query("status")
    .optional()
    .isIn(["ACTIVE", "INACTIVE", "SUSPENDED"])
    .withMessage("Estado inválido"),

  query("gender")
    .optional()
    .isIn(["MALE", "FEMALE", "OTHER"])
    .withMessage("Género inválido"),

  query("minAge")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Edad mínima inválida"),

  query("maxAge")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Edad máxima inválida"),

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

