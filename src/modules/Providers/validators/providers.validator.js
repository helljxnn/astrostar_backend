import { body, param, query } from "express-validator";
import { ProvidersRepository } from "../repository/providers.repository.js";

export const providersValidators = {
  // Validaciones para crear proveedor
  create: [
    body("tipoEntidad")
      .notEmpty()
      .withMessage("El tipo de entidad es obligatorio.")
      .isIn(["juridica", "natural"])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".'),

    body("razonSocial")
      .notEmpty()
      .withMessage("La razón social es obligatoria.")
      .isLength({ min: 3, max: 200 })
      .withMessage("La razón social debe tener entre 3 y 200 caracteres.")
      .custom(async (value) => {
        const providersRepository = new ProvidersRepository();
        const existingProvider = await providersRepository.findByBusinessName(value);
        if (existingProvider) {
          throw new Error(`La razón social "${value}" ya está registrada.`);
        }
        return true;
      })
      .trim(),

    body("nit")
      .notEmpty()
      .withMessage("El NIT es obligatorio.")
      .isLength({ min: 8, max: 15 })
      .withMessage("El NIT debe tener entre 8 y 15 dígitos.")
      .matches(/^\d+$/)
      .withMessage("El NIT solo puede contener números.")
      .custom(async (value) => {
        const providersRepository = new ProvidersRepository();
        const existingProvider = await providersRepository.findByNit(value);
        if (existingProvider) {
          throw new Error(`El NIT "${value}" ya está registrado.`);
        }
        return true;
      }),

    body("tipoDocumento")
      .optional()
      .isIn(["CC", "TI", "CE", "PAS"])
      .withMessage("Seleccione un tipo de documento válido."),

    body("contactoPrincipal")
      .notEmpty()
      .withMessage("El contacto principal es obligatorio.")
      .isLength({ min: 2, max: 150 })
      .withMessage("El contacto principal debe tener entre 2 y 150 caracteres.")
      .custom(async (value) => {
        const providersRepository = new ProvidersRepository();
        const existingProvider = await providersRepository.findByNameCaseInsensitive(value);
        if (existingProvider) {
          throw new Error(`El nombre de contacto "${value}" ya está registrado.`);
        }
        return true;
      })
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El contacto principal solo puede contener letras y espacios.")
      .trim(),

    body("correo")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio.")
      .isEmail()
      .withMessage("El correo electrónico no es válido.")
      .isLength({ max: 150 })
      .withMessage("El correo no puede exceder 150 caracteres.")
      .custom(async (value) => {
        const providersRepository = new ProvidersRepository();
        const existingProvider = await providersRepository.findByEmail(value);
        if (existingProvider) {
          throw new Error(`El correo "${value}" ya está registrado.`);
        }
        return true;
      })
      .trim(),

    body("telefono")
      .notEmpty()
      .withMessage("El teléfono es obligatorio.")
      .isLength({ min: 7, max: 15 })
      .withMessage("El teléfono debe tener entre 7 y 15 caracteres.")
      .matches(/^[\d\s\+\-\(\)]+$/)
      .withMessage("El teléfono contiene caracteres inválidos.")
      .trim(),

    body("direccion")
      .notEmpty()
      .withMessage("La dirección es obligatoria.")
      .isLength({ min: 10, max: 200 })
      .withMessage("La dirección debe tener entre 10 y 200 caracteres.")
      .trim(),

    body("ciudad")
      .notEmpty()
      .withMessage("La ciudad es obligatoria.")
      .isLength({ min: 2, max: 100 })
      .withMessage("La ciudad debe tener entre 2 y 100 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("La ciudad solo puede contener letras y espacios.")
      .trim(),

    body("descripcion")
      .optional()
      .isLength({ max: 500 })
      .withMessage("La descripción no puede exceder 500 caracteres.")
      .trim(),

    body("estado")
      .notEmpty()
      .withMessage("El estado es obligatorio.")
      .isIn(["Activo", "Inactivo"])
      .withMessage('El estado debe ser "Activo" o "Inactivo".')
  ],

  // Validaciones para actualizar proveedor
  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero positivo."),

    body("tipoEntidad")
      .optional()
      .isIn(["juridica", "natural"])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".'),

    body("razonSocial")
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage("La razón social debe tener entre 3 y 200 caracteres.")
      .custom(async (value, { req }) => {
        if (value) {
          const providersRepository = new ProvidersRepository();
          const existingProvider = await providersRepository.findByBusinessName(value, parseInt(req.params.id));
          if (existingProvider) {
            throw new Error(`La razón social "${value}" ya está registrada.`);
          }
        }
        return true;
      })
      .trim(),

    body("nit")
      .optional()
      .isLength({ min: 8, max: 15 })
      .withMessage("El NIT debe tener entre 8 y 15 dígitos.")
      .matches(/^\d+$/)
      .withMessage("El NIT solo puede contener números.")
      .custom(async (value, { req }) => {
        if (value) {
          const providersRepository = new ProvidersRepository();
          const existingProvider = await providersRepository.findByNit(value);
          const currentProvider = await providersRepository.findById(parseInt(req.params.id));
          
          if (existingProvider && (!currentProvider || existingProvider.id !== currentProvider.id)) {
            throw new Error(`El NIT "${value}" ya está registrado.`);
          }
        }
        return true;
      }),

    body("tipoDocumento")
      .optional()
      .isIn(["CC", "TI", "CE", "PAS"])
      .withMessage("Seleccione un tipo de documento válido."),

    body("contactoPrincipal")
      .optional()
      .isLength({ min: 2, max: 150 })
      .withMessage("El contacto principal debe tener entre 2 y 150 caracteres.")
      .custom(async (value, { req }) => {
        if (value) {
          const providersRepository = new ProvidersRepository();
          const existingProvider = await providersRepository.findByNameCaseInsensitive(value, parseInt(req.params.id));
          if (existingProvider) {
            throw new Error(`El nombre de contacto "${value}" ya está registrado.`);
          }
        }
        return true;
      })
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El contacto principal solo puede contener letras y espacios.")
      .trim(),

    body("correo")
      .optional()
      .isEmail()
      .withMessage("El correo electrónico no es válido.")
      .isLength({ max: 150 })
      .withMessage("El correo no puede exceder 150 caracteres.")
      .custom(async (value, { req }) => {
        if (value) {
          const providersRepository = new ProvidersRepository();
          const existingProvider = await providersRepository.findByEmail(value);
          const currentProvider = await providersRepository.findById(parseInt(req.params.id));
          
          if (existingProvider && (!currentProvider || existingProvider.id !== currentProvider.id)) {
            throw new Error(`El correo "${value}" ya está registrado.`);
          }
        }
        return true;
      })
      .trim(),

    body("telefono")
      .optional()
      .isLength({ min: 7, max: 15 })
      .withMessage("El teléfono debe tener entre 7 y 15 caracteres.")
      .matches(/^[\d\s\+\-\(\)]+$/)
      .withMessage("El teléfono contiene caracteres inválidos.")
      .trim(),

    body("direccion")
      .optional()
      .isLength({ min: 10, max: 200 })
      .withMessage("La dirección debe tener entre 10 y 200 caracteres.")
      .trim(),

    body("ciudad")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("La ciudad debe tener entre 2 y 100 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("La ciudad solo puede contener letras y espacios.")
      .trim(),

    body("descripcion")
      .optional()
      .isLength({ max: 500 })
      .withMessage("La descripción no puede exceder 500 caracteres.")
      .trim(),

    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo"])
      .withMessage('El estado debe ser "Activo" o "Inactivo".')
  ],

  // Validaciones para obtener proveedor por ID
  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero positivo.")
  ],

  // Validaciones para eliminar proveedor
  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero positivo.")
      .custom(async (value) => {
        const providersRepository = new ProvidersRepository();
        
        // Verificar si el proveedor existe
        const provider = await providersRepository.findById(parseInt(value));
        if (!provider) {
          throw new Error("El proveedor no existe.");
        }

        // Verificar si tiene compras activas (HU04.1_04_04)
        const hasPurchases = await providersRepository.hasActivePurchases(parseInt(value));
        if (hasPurchases) {
          throw new Error("No se puede eliminar un proveedor con compras activas asociadas.");
        }

        // Verificar si el estado es activo (HU04.1_04_05)
        if (provider.estado === 'Activo') {
          throw new Error("No se puede eliminar un proveedor con estado activo.");
        }

        return true;
      })
  ],

  // Validaciones para cambiar estado
  changeStatus: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero positivo."),

    body("status")
      .notEmpty()
      .withMessage("El estado es obligatorio.")
      .isIn(["Activo", "Inactivo"])
      .withMessage('El estado debe ser "Activo" o "Inactivo".')
  ],

  // Validaciones para verificar NIT
  checkNit: [
    query("nit")
      .notEmpty()
      .withMessage("El NIT es obligatorio.")
      .isLength({ min: 8, max: 15 })
      .withMessage("El NIT debe tener entre 8 y 15 dígitos.")
      .matches(/^\d+$/)
      .withMessage("El NIT solo puede contener números."),

    query("excludeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El excludeId debe ser un número entero positivo.")
  ],

  // ✅ CORRECCIÓN: Validaciones mejoradas para consultas con paginación
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

    // ✅ CORRECCIÓN: Solo validar status si NO está vacío
    query("status")
      .optional({ checkFalsy: true }) // Ignora strings vacíos
      .isIn(["Activo", "Inactivo"])
      .withMessage('El estado debe ser "Activo" o "Inactivo".'),

    // ✅ CORRECCIÓN: Solo validar entityType si NO está vacío
    query("entityType")
      .optional({ checkFalsy: true }) // Ignora strings vacíos
      .isIn(["juridica", "natural"])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".')
  ]
};

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  import("express-validator")
    .then(({ validationResult }) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const errorMessages = errors.array();
        const firstError = errorMessages[0];

        return res.status(400).json({
          success: false,
          message: firstError.msg,
          field: firstError.path,
          value: firstError.value,
        });
      }

      next();
    })
    .catch((error) => {
      console.error("Error importing validationResult:", error);
      next();
    });
};