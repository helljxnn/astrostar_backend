import { body, param, query, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Errores de validación",
      errors: errors.array(),
    });
  }
  next();
};

export const purchasesValidators = {
  // Validación para obtener todas las compras
  getAll: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La página debe ser un número entero positivo"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("El límite debe estar entre 1 y 100"),
    query("search")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 100 })
      .withMessage("La búsqueda no puede exceder 100 caracteres"),
    query("providerId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero positivo"),
    query("status")
      .optional()
      .isIn(["Pending", "Received", "Partial", "Cancelled"])
      .withMessage("Estado inválido"),
  ],

  // Validación para obtener por ID
  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID debe ser un número entero positivo"),
  ],

  // Validación para crear compra
  create: [
    body("providerId")
      .notEmpty()
      .withMessage("El proveedor es requerido")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero positivo"),
    body("employeeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID del empleado debe ser un número entero positivo"),
    body("purchaseDate")
      .notEmpty()
      .withMessage("La fecha de compra es requerida")
      .isISO8601()
      .withMessage("La fecha de compra debe ser una fecha válida"),
    body("deliveryDate")
      .optional()
      .isISO8601()
      .withMessage("La fecha de entrega debe ser una fecha válida"),
    body("status")
      .optional()
      .isIn(["Pending", "Received", "Partial", "Cancelled"])
      .withMessage("Estado inválido"),
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Las notas no pueden exceder 1000 caracteres"),
    body("items")
      .notEmpty()
      .withMessage("Los items son requeridos")
      .isArray({ min: 1 })
      .withMessage("Debe incluir al menos un item"),
    body("items.*.productName")
      .notEmpty()
      .withMessage("El nombre del producto es requerido")
      .isString()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("El nombre del producto debe tener entre 2 y 200 caracteres"),
    body("items.*.description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("La descripción no puede exceder 500 caracteres"),
    body("items.*.quantity")
      .notEmpty()
      .withMessage("La cantidad es requerida")
      .isInt({ min: 1 })
      .withMessage("La cantidad debe ser un número entero positivo"),
    body("items.*.unitPrice")
      .notEmpty()
      .withMessage("El precio unitario es requerido")
      .isFloat({ min: 0 })
      .withMessage("El precio unitario debe ser un número positivo"),
    body("items.*.subtotal")
      .notEmpty()
      .withMessage("El subtotal es requerido")
      .isFloat({ min: 0 })
      .withMessage("El subtotal debe ser un número positivo"),
  ],

  // Validación para actualizar compra
  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID debe ser un número entero positivo"),
    body("providerId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero positivo"),
    body("purchaseDate")
      .optional()
      .isISO8601()
      .withMessage("La fecha de compra debe ser una fecha válida"),
    body("deliveryDate")
      .optional()
      .isISO8601()
      .withMessage("La fecha de entrega debe ser una fecha válida"),
    body("status")
      .optional()
      .isIn(["Pending", "Received", "Partial", "Cancelled"])
      .withMessage("Estado inválido"),
    body("notes")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Las notas no pueden exceder 1000 caracteres"),
    body("items")
      .optional()
      .isArray({ min: 1 })
      .withMessage("Debe incluir al menos un item"),
    body("items.*.productName")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage("El nombre del producto debe tener entre 2 y 200 caracteres"),
    body("items.*.description")
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 })
      .withMessage("La descripción no puede exceder 500 caracteres"),
    body("items.*.quantity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La cantidad debe ser un número entero positivo"),
    body("items.*.unitPrice")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El precio unitario debe ser un número positivo"),
    body("items.*.subtotal")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("El subtotal debe ser un número positivo"),
  ],

  // Validación para cambiar estado
  changeStatus: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID debe ser un número entero positivo"),
    body("status")
      .notEmpty()
      .withMessage("El estado es requerido")
      .isIn(["Pending", "Received", "Partial", "Cancelled"])
      .withMessage("Estado inválido"),
  ],
};
