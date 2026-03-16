import { body, param, query, validationResult } from "express-validator";

export const guardiansValidators = {
  create: [
    body("documentTypeId")
      .custom((value) => {
        if (!value && value !== 0) {
          throw new Error("El tipo de documento es obligatorio.");
        }
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1) {
          throw new Error("El tipo de documento debe ser un ID válido.");
        }
        return true;
      })
      .customSanitizer((value) => parseInt(value)),

    body("identification")
      .notEmpty()
      .withMessage("El número de documento es obligatorio.")
      .isLength({ min: 6 })
      .withMessage("El número de documento debe tener al menos 6 caracteres.")
      .matches(/^[a-zA-Z0-9-]+$/)
      .withMessage("El número de documento solo puede contener letras, números y guiones.")
      .trim(),

    body("nombreCompleto")
      .notEmpty()
      .withMessage("El nombre completo es obligatorio.")
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El nombre solo puede contener letras y espacios.")
      .custom((value) => {
        if (/\s{2,}/.test(value)) {
          throw new Error("El nombre no puede contener espacios dobles.");
        }
        return true;
      })
      .trim(),

    body("email")
      .notEmpty()
      .withMessage("El correo electrónico es obligatorio.")
      .isEmail()
      .withMessage("El correo electrónico no es válido.")
      .normalizeEmail()
      .trim(),

    body("phoneNumber")
      .notEmpty()
      .withMessage("El número telefónico es obligatorio.")
      .matches(/^(\+57\s?)?3\d{9}$/)
      .withMessage("El número telefónico debe tener el formato: 3XXXXXXXXX o +57 3XXXXXXXXX")
      .trim(),

    body("birthDate")
      .notEmpty()
      .withMessage("La fecha de nacimiento es obligatoria.")
      .isISO8601()
      .withMessage("Formato de fecha inválido.")
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 100);
        const maxDate = new Date();
        maxDate.setFullYear(today.getFullYear() - 18);

        if (birthDate < minDate) {
          throw new Error("La fecha de nacimiento no puede ser anterior a 100 años.");
        }
        if (birthDate > maxDate) {
          throw new Error("El acudiente debe ser mayor de 18 años.");
        }
        if (birthDate > today) {
          throw new Error("La fecha de nacimiento no puede ser futura.");
        }
        return true;
      }),

    // Estado es opcional en creación, por defecto será "Activo"
    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser Activo o Inactivo."),
  ],

  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del acudiente debe ser un número entero positivo."),

    body("documentTypeId")
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === '') return true;
        const numValue = parseInt(value);
        if (isNaN(numValue) || numValue < 1) {
          throw new Error("El tipo de documento debe ser un ID válido.");
        }
        return true;
      })
      .customSanitizer((value) => {
        if (value === undefined || value === null || value === '') return value;
        return parseInt(value);
      }),

    body("identification")
      .optional()
      .isLength({ min: 6 })
      .withMessage("El número de documento debe tener al menos 6 caracteres.")
      .matches(/^[a-zA-Z0-9-]+$/)
      .withMessage("El número de documento solo puede contener letras, números y guiones.")
      .trim(),

    body("nombreCompleto")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("El nombre debe tener entre 2 y 100 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El nombre solo puede contener letras y espacios.")
      .custom((value) => {
        if (/\s{2,}/.test(value)) {
          throw new Error("El nombre no puede contener espacios dobles.");
        }
        return true;
      })
      .trim(),

    body("email")
      .optional()
      .isEmail()
      .withMessage("El correo electrónico no es válido.")
      .normalizeEmail()
      .trim(),

    body("phoneNumber")
      .optional()
      .matches(/^(\+57\s?)?3\d{9}$/)
      .withMessage("El número telefónico debe tener el formato: 3XXXXXXXXX o +57 3XXXXXXXXX")
      .trim(),

    body("birthDate")
      .optional()
      .isISO8601()
      .withMessage("Formato de fecha inválido.")
      .custom((value) => {
        const birthDate = new Date(value);
        const today = new Date();
        const minDate = new Date();
        minDate.setFullYear(today.getFullYear() - 100);
        const maxDate = new Date();
        maxDate.setFullYear(today.getFullYear() - 18);

        if (birthDate < minDate) {
          throw new Error("La fecha de nacimiento no puede ser anterior a 100 años.");
        }
        if (birthDate > maxDate) {
          throw new Error("El acudiente debe ser mayor de 18 años.");
        }
        if (birthDate > today) {
          throw new Error("La fecha de nacimiento no puede ser futura.");
        }
        return true;
      }),

    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser Activo o Inactivo."),
  ],

  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del acudiente debe ser un número entero positivo.")
  ],

  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del acudiente debe ser un número entero positivo.")
  ],

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
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser Activo o Inactivo."),
  ]
};

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    

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
