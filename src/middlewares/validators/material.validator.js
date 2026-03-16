import { body, param, query } from "express-validator";
import { validateRequest } from "./common.validator.js";

/**
 * Validación para crear material
 */
export const validateCreateMaterial = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre debe tener entre 2 y 200 caracteres")
    .escape(),

  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("La descripción no puede exceder 1000 caracteres"),

  body("categoria")
    .trim()
    .notEmpty()
    .withMessage("La categoría es requerida")
    .isLength({ min: 2, max: 100 })
    .withMessage("La categoría debe tener entre 2 y 100 caracteres")
    .escape(),

  body("unidadMedida")
    .trim()
    .notEmpty()
    .withMessage("La unidad de medida es requerida")
    .isIn(["UNIDAD", "KG", "LITRO", "METRO", "CAJA", "PAR"])
    .withMessage("Unidad de medida inválida"),

  body("stockMinimo")
    .notEmpty()
    .withMessage("El stock mínimo es requerido")
    .isInt({ min: 0, max: 1000000 })
    .withMessage("El stock mínimo debe ser un número entre 0 y 1000000"),

  body("stockActual")
    .notEmpty()
    .withMessage("El stock actual es requerido")
    .isInt({ min: 0, max: 1000000 })
    .withMessage("El stock actual debe ser un número entre 0 y 1000000"),

  body("tipoInventario")
    .notEmpty()
    .withMessage("El tipo de inventario es requerido")
    .isIn(["FUNDACION", "EVENTOS"])
    .withMessage("Tipo de inventario inválido"),

  body("ubicacion")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La ubicación no puede exceder 200 caracteres")
    .escape(),

  body("proveedor")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("El proveedor no puede exceder 200 caracteres")
    .escape(),

  validateRequest,
];

/**
 * Validación para actualizar material
 */
export const validateUpdateMaterial = [
  param("id").isUUID().withMessage("ID de material inválido"),

  body("nombre")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre debe tener entre 2 y 200 caracteres")
    .escape(),

  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("La descripción no puede exceder 1000 caracteres"),

  body("categoria")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("La categoría debe tener entre 2 y 100 caracteres")
    .escape(),

  body("unidadMedida")
    .optional()
    .isIn(["UNIDAD", "KG", "LITRO", "METRO", "CAJA", "PAR"])
    .withMessage("Unidad de medida inválida"),

  body("stockMinimo")
    .optional()
    .isInt({ min: 0, max: 1000000 })
    .withMessage("El stock mínimo debe ser un número entre 0 y 1000000"),

  body("stockActual")
    .optional()
    .isInt({ min: 0, max: 1000000 })
    .withMessage("El stock actual debe ser un número entre 0 y 1000000"),

  body("tipoInventario")
    .optional()
    .isIn(["FUNDACION", "EVENTOS"])
    .withMessage("Tipo de inventario inválido"),

  body("ubicacion")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("La ubicación no puede exceder 200 caracteres")
    .escape(),

  body("proveedor")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("El proveedor no puede exceder 200 caracteres")
    .escape(),

  validateRequest,
];

/**
 * Validación para movimiento de inventario
 */
export const validateInventoryMovement = [
  body("materialId")
    .notEmpty()
    .withMessage("El ID del material es requerido")
    .isUUID()
    .withMessage("ID de material inválido"),

  body("tipoMovimiento")
    .notEmpty()
    .withMessage("El tipo de movimiento es requerido")
    .isIn(["INGRESO", "SALIDA", "AJUSTE", "BAJA", "TRANSFERENCIA"])
    .withMessage("Tipo de movimiento inválido"),

  body("cantidad")
    .notEmpty()
    .withMessage("La cantidad es requerida")
    .isInt({ min: 1, max: 1000000 })
    .withMessage("La cantidad debe ser un número entre 1 y 1000000"),

  body("motivo")
    .trim()
    .notEmpty()
    .withMessage("El motivo es requerido")
    .isLength({ min: 3, max: 500 })
    .withMessage("El motivo debe tener entre 3 y 500 caracteres"),

  body("origenDestino")
    .optional()
    .isIn(["FUNDACION", "EVENTOS"])
    .withMessage("Origen/destino inválido"),

  body("tipoBaja")
    .optional()
    .isIn(["DANO", "PERDIDA", "VENCIMIENTO", "OBSOLETO", "OTRO"])
    .withMessage("Tipo de baja inválido"),

  validateRequest,
];

/**
 * Validación para asignación de material a evento
 */
export const validateEventMaterialAssignment = [
  body("eventId")
    .notEmpty()
    .withMessage("El ID del evento es requerido")
    .isUUID()
    .withMessage("ID de evento inválido"),

  body("materialId")
    .notEmpty()
    .withMessage("El ID del material es requerido")
    .isUUID()
    .withMessage("ID de material inválido"),

  body("cantidadAsignada")
    .notEmpty()
    .withMessage("La cantidad asignada es requerida")
    .isInt({ min: 1, max: 1000000 })
    .withMessage("La cantidad debe ser un número entre 1 y 1000000"),

  validateRequest,
];

/**
 * Validación para consultas de materiales
 */
export const validateMaterialQuery = [
  query("categoria")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Categoría inválida"),

  query("tipoInventario")
    .optional()
    .isIn(["FUNDACION", "EVENTOS"])
    .withMessage("Tipo de inventario inválido"),

  query("stockBajo")
    .optional()
    .isBoolean()
    .withMessage("stockBajo debe ser booleano"),

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

