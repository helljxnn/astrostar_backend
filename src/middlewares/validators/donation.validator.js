import { body, param, query } from "express-validator";
import { validateRequest } from "./common.validator.js";

/**
 * Validación para crear donación
 */
export const validateCreateDonation = [
  body("donorName")
    .trim()
    .notEmpty()
    .withMessage("El nombre del donante es requerido")
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre debe tener entre 2 y 200 caracteres")
    .escape(),

  body("donorEmail")
    .trim()
    .notEmpty()
    .withMessage("El email es requerido")
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("donorPhone")
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage("Teléfono inválido")
    .isLength({ min: 7, max: 20 })
    .withMessage("El teléfono debe tener entre 7 y 20 caracteres"),

  body("amount")
    .notEmpty()
    .withMessage("El monto es requerido")
    .isFloat({ min: 1, max: 1000000000 })
    .withMessage("El monto debe ser un número entre 1 y 1000000000"),

  body("currency")
    .optional()
    .isIn(["COP", "USD", "EUR"])
    .withMessage("Moneda inválida"),

  body("donationType")
    .notEmpty()
    .withMessage("El tipo de donación es requerido")
    .isIn(["MONETARY", "IN_KIND", "SERVICE"])
    .withMessage("Tipo de donación inválido"),

  body("paymentMethod")
    .optional()
    .isIn([
      "CREDIT_CARD",
      "DEBIT_CARD",
      "BANK_TRANSFER",
      "CASH",
      "PAYPAL",
      "OTHER",
    ])
    .withMessage("Método de pago inválido"),

  body("serviceId").optional().isUUID().withMessage("ID de servicio inválido"),

  body("message")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("El mensaje no puede exceder 1000 caracteres"),

  body("isAnonymous")
    .optional()
    .isBoolean()
    .withMessage("isAnonymous debe ser booleano"),

  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("isRecurring debe ser booleano"),

  body("frequency")
    .optional()
    .isIn(["MONTHLY", "QUARTERLY", "YEARLY"])
    .withMessage("Frecuencia inválida"),

  validateRequest,
];

/**
 * Validación para actualizar donación
 */
export const validateUpdateDonation = [
  param("id").isUUID().withMessage("ID de donación inválido"),

  body("status")
    .optional()
    .isIn(["PENDING", "COMPLETED", "FAILED", "REFUNDED"])
    .withMessage("Estado inválido"),

  body("transactionId")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("ID de transacción inválido"),

  body("notes")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las notas no pueden exceder 1000 caracteres"),

  validateRequest,
];

/**
 * Validación para consultas de donaciones
 */
export const validateDonationQuery = [
  query("status")
    .optional()
    .isIn(["PENDING", "COMPLETED", "FAILED", "REFUNDED"])
    .withMessage("Estado inválido"),

  query("donationType")
    .optional()
    .isIn(["MONETARY", "IN_KIND", "SERVICE"])
    .withMessage("Tipo de donación inválido"),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha inicial inválido"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha final inválido"),

  query("minAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monto mínimo inválido"),

  query("maxAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Monto máximo inválido"),

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

