import { body, param, query } from "express-validator";
import { validateRequest } from "./common.validator.js";

/**
 * Validación para crear pre-registro
 */
export const validateCreatePreRegistration = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage("El nombre solo puede contener letras")
    .escape(),

  body("middleName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El segundo nombre no puede exceder 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
    .withMessage("El segundo nombre solo puede contener letras")
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

  body("secondLastName")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El segundo apellido no puede exceder 100 caracteres")
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
    .withMessage("El segundo apellido solo puede contener letras")
    .escape(),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("El teléfono es requerido")
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Teléfono inválido")
    .isLength({ min: 7, max: 20 })
    .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),

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

  body("address")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("La dirección no puede exceder 300 caracteres")
    .escape(),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La ciudad no puede exceder 100 caracteres")
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

  body("interestedSport")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("El deporte de interés no puede exceder 100 caracteres")
    .escape(),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las notas no pueden exceder 1000 caracteres"),

  validateRequest,
];

/**
 * Validación para actualizar pre-registro
 */
export const validateUpdatePreRegistration = [
  param("id").isUUID().withMessage("ID de pre-registro inválido"),

  body("status")
    .optional()
    .isIn(["PENDING", "CONTACTED", "ENROLLED", "REJECTED"])
    .withMessage("Estado inválido"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las notas no pueden exceder 1000 caracteres"),

  body("contactedAt")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha inválido"),

  validateRequest,
];

/**
 * Validación para consultas de pre-registros
 */
export const validatePreRegistrationQuery = [
  query("status")
    .optional()
    .isIn(["PENDING", "CONTACTED", "ENROLLED", "REJECTED"])
    .withMessage("Estado inválido"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha inicial inválido"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha final inválido"),

  query("interestedSport")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Deporte inválido"),

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

