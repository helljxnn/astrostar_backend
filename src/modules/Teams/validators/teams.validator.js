import { body, param, query, validationResult } from "express-validator";

export const teamsValidators = {
  // Validaciones para crear equipo
  create: [
    body("nombre")
      .notEmpty()
      .withMessage("El nombre del equipo es obligatorio.")
      .isLength({ min: 3, max: 100 })
      .withMessage("El nombre debe tener entre 3 y 100 caracteres.")
      .trim(),

    body("teamType")
      .notEmpty()
      .withMessage("El tipo de equipo es obligatorio.")
      .isIn(["fundacion", "temporal", "Fundacion", "Temporal"])
      .withMessage('El tipo de equipo debe ser "fundacion", "temporal", "Fundacion" o "Temporal".')
      .customSanitizer(value => {
        // Normalizar a formato con primera letra mayúscula
        if (value.toLowerCase() === "fundacion") return "Fundacion";
        if (value.toLowerCase() === "temporal") return "Temporal";
        return value;
      }),

    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo", "Active", "Inactive"])
      .withMessage('El estado debe ser "Activo", "Inactivo", "Active" o "Inactive".')
      .customSanitizer(value => {
        // Normalizar estados
        if (value === "Active") return "Activo";
        if (value === "Inactive") return "Inactivo";
        return value;
      }),

    body("entrenador")
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage("El entrenador debe tener entre 2 y 200 caracteres.")
      .trim(),

    body("deportistasIds")
      .isArray({ min: 1 })
      .withMessage("Debe seleccionar al menos un deportista."),

    body("entrenadorData")
      .optional()
      .isObject()
      .withMessage("entrenadorData debe ser un objeto."),

    body("telefono")
      .optional()
      .isLength({ min: 7, max: 15 })
      .withMessage("El teléfono debe tener entre 7 y 15 caracteres.")
      .trim(),

    body("categoria")
      .optional()
      .isLength({ max: 50 })
      .withMessage("La categoría no puede exceder 50 caracteres.")
      .trim(),

    body("descripcion")
      .optional()
      .isLength({ max: 500 })
      .withMessage("La descripción no puede exceder 500 caracteres.")
      .trim(),
  ],

  // Validaciones para actualizar equipo
  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del equipo debe ser un número entero positivo."),

    body("nombre")
      .optional()
      .isLength({ min: 3, max: 100 })
      .withMessage("El nombre debe tener entre 3 y 100 caracteres.")
      .trim(),

    body("teamType")
      .optional()
      .isIn(["fundacion", "temporal", "Fundacion", "Temporal"])
      .withMessage('El tipo de equipo debe ser "fundacion", "temporal", "Fundacion" o "Temporal".')
      .customSanitizer(value => {
        if (value.toLowerCase() === "fundacion") return "Fundacion";
        if (value.toLowerCase() === "temporal") return "Temporal";
        return value;
      }),

    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo", "Active", "Inactive"])
      .withMessage('El estado debe ser "Activo", "Inactivo", "Active" o "Inactive".')
      .customSanitizer(value => {
        if (value === "Active") return "Activo";
        if (value === "Inactive") return "Inactivo";
        return value;
      }),

    body("entrenador")
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage("El entrenador debe tener entre 2 y 200 caracteres.")
      .trim(),

    body("deportistasIds")
      .optional()
      .isArray({ min: 1 })
      .withMessage("Debe seleccionar al menos un deportista."),

    body("entrenadorData")
      .optional()
      .isObject()
      .withMessage("entrenadorData debe ser un objeto."),

    body("telefono")
      .optional()
      .isLength({ min: 7, max: 15 })
      .withMessage("El teléfono debe tener entre 7 y 15 caracteres.")
      .trim(),

    body("categoria")
      .optional()
      .isLength({ max: 50 })
      .withMessage("La categoría no puede exceder 50 caracteres.")
      .trim(),

    body("descripcion")
      .optional()
      .isLength({ max: 500 })
      .withMessage("La descripción no puede exceder 500 caracteres.")
      .trim(),
  ],

  // Validaciones para obtener equipo por ID
  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del equipo debe ser un número entero positivo.")
  ],

  // Validaciones para eliminar equipo
  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del equipo debe ser un número entero positivo.")
  ],

  // Validaciones para cambiar estado
  changeStatus: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del equipo debe ser un número entero positivo."),

    body("status")
      .notEmpty()
      .withMessage("El estado es obligatorio.")
      .isIn(["Activo", "Inactivo", "Active", "Inactive"])
      .withMessage('El estado debe ser "Activo", "Inactivo", "Active" o "Inactive".')
      .customSanitizer(value => {
        if (value === "Active") return "Activo";
        if (value === "Inactive") return "Inactivo";
        return value;
      })
  ],

  // Validaciones para verificar nombre
  checkName: [
    query("name")
      .notEmpty()
      .withMessage("El nombre del equipo es requerido.")
      .isLength({ min: 3, max: 100 })
      .withMessage("El nombre debe tener entre 3 y 100 caracteres.")
      .trim(),

    query("excludeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El excludeId debe ser un número entero positivo.")
  ],

  // Validaciones para consultas con paginación
  getAll: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El número de página debe ser un número entero positivo."),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("El límite de resultados debe ser un número entre 1 y 100."),

    query("search")
      .optional()
      .isLength({ max: 100 })
      .withMessage("El término de búsqueda no puede exceder 100 caracteres.")
      .trim(),

    query("status")
      .optional({ checkFalsy: true })
      .isIn(["Activo", "Inactivo", "Active", "Inactive"])
      .withMessage('El estado debe ser "Activo", "Inactivo", "Active" o "Inactive".')
      .customSanitizer(value => {
        if (value === "Active") return "Activo";
        if (value === "Inactive") return "Inactivo";
        return value;
      }),

    query("teamType")
      .optional({ checkFalsy: true })
      .isIn(["fundacion", "temporal", "Fundacion", "Temporal"])
      .withMessage('El tipo de equipo debe ser "fundacion", "temporal", "Fundacion" o "Temporal".')
      .customSanitizer(value => {
        if (value.toLowerCase() === "fundacion") return "Fundacion";
        if (value.toLowerCase() === "temporal") return "Temporal";
        return value;
      })
  ]
};

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    
    console.log("❌ Validation error:", {
      field: firstError.path,
      value: firstError.value,
      message: firstError.msg
    });

    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
      value: firstError.value,
      allErrors: errors.array()
    });
  }

  next();
};