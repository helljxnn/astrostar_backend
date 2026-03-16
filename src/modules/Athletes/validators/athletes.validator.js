import { body, param, query, validationResult } from "express-validator";

export const athletesValidators = {
  // Validaciones para crear deportista
  create: [
    body("firstName")
      .notEmpty()
      .withMessage("El primer nombre es obligatorio.")
      .isLength({ min: 2 })
      .withMessage("El primer nombre debe tener al menos 2 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El primer nombre solo puede contener letras.")
      .trim(),

    body("middleName")
      .optional({ checkFalsy: true })
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      .withMessage("El segundo nombre solo puede contener letras.")
      .trim(),

    body("lastName")
      .notEmpty()
      .withMessage("El primer apellido es obligatorio.")
      .isLength({ min: 2 })
      .withMessage("El primer apellido debe tener al menos 2 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El primer apellido solo puede contener letras.")
      .trim(),

    body("secondLastName")
      .optional({ checkFalsy: true })
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      .withMessage("El segundo apellido solo puede contener letras.")
      .trim(),

    body("documentTypeId")
      .notEmpty()
      .withMessage("El tipo de documento es obligatorio.")
      .isInt({ min: 1 })
      .withMessage("El tipo de documento debe ser un ID válido."),

    body("identification")
      .notEmpty()
      .withMessage("El número de documento es obligatorio.")
      .isLength({ min: 6 })
      .withMessage("El número de documento debe tener al menos 6 caracteres.")
      .matches(/^[a-zA-Z0-9-]+$/)
      .withMessage("El número de documento solo puede contener letras, números y guiones.")
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
        if (birthDate > today) {
          throw new Error("La fecha de nacimiento no puede ser futura.");
        }
        // Validar edad mínima de 5 años para deportistas
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 5) {
          throw new Error("El deportista debe tener al menos 5 años.");
        }
        return true;
      }),

    body("categoria")
      .notEmpty()
      .withMessage("La categoría es obligatoria.")
      .isLength({ min: 2, max: 30 })
      .withMessage("La categoría debe tener entre 2 y 30 caracteres.")
      .trim(),

    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser Activo o Inactivo."),

    body("acudiente")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID del acudiente debe ser un número entero positivo."),

    body("parentesco")
      .optional()
      .isLength({ max: 50 })
      .withMessage("El parentesco no puede exceder 50 caracteres.")
      .trim(),
  ],

  // Validaciones para actualizar deportista
  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del deportista debe ser un número entero positivo."),

    body("firstName")
      .optional()
      .isLength({ min: 2 })
      .withMessage("El primer nombre debe tener al menos 2 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El primer nombre solo puede contener letras.")
      .trim(),

    body("middleName")
      .optional({ checkFalsy: true })
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      .withMessage("El segundo nombre solo puede contener letras.")
      .trim(),

    body("lastName")
      .optional()
      .isLength({ min: 2 })
      .withMessage("El primer apellido debe tener al menos 2 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El primer apellido solo puede contener letras.")
      .trim(),

    body("secondLastName")
      .optional({ checkFalsy: true })
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)
      .withMessage("El segundo apellido solo puede contener letras.")
      .trim(),

    body("documentTypeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El tipo de documento debe ser un ID válido."),

    body("identification")
      .optional()
      .isLength({ min: 6 })
      .withMessage("El número de documento debe tener al menos 6 caracteres.")
      .matches(/^[a-zA-Z0-9-]+$/)
      .withMessage("El número de documento solo puede contener letras, números y guiones.")
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
        if (birthDate > today) {
          throw new Error("La fecha de nacimiento no puede ser futura.");
        }
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 5) {
          throw new Error("El deportista debe tener al menos 5 años.");
        }
        return true;
      }),

    body("categoria")
      .optional()
      .isLength({ min: 2, max: 30 })
      .withMessage("La categoría debe tener entre 2 y 30 caracteres.")
      .trim(),

    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser Activo o Inactivo."),

    body("acudiente")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID del acudiente debe ser un número entero positivo."),

    body("parentesco")
      .optional()
      .isLength({ max: 50 })
      .withMessage("El parentesco no puede exceder 50 caracteres.")
      .trim(),
  ],

  // Validaciones para obtener deportista por ID
  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del deportista debe ser un número entero positivo.")
  ],

  // Validaciones para eliminar deportista
  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del deportista debe ser un número entero positivo.")
  ],

  // Validaciones para cambiar estado
  changeStatus: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del deportista debe ser un número entero positivo."),

    body("status")
      .notEmpty()
      .withMessage("El estado es obligatorio.")
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser Activo o Inactivo.")
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
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser Activo o Inactivo."),

    query("categoria")
      .optional({ checkFalsy: true })
      .isLength({ max: 50 })
      .withMessage("La categoría no puede exceder 50 caracteres.")
      .trim(),

    query("estadoInscripcion")
      .optional({ checkFalsy: true })
      .isIn(["Vigente", "Vencida"])
      .withMessage("El estado de inscripción debe ser Vigente o Vencida.")
  ]
};

// Middleware para manejar errores de validación
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


