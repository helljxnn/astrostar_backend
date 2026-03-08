import { body, param, query, validationResult } from "express-validator";

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(({ path, msg, value, param }) => ({
      field: path || param,
      message: msg,
      value,
    }));
    const firstError = formatted[0];
    return res.status(400).json({
      success: false,
      message: firstError.message,
      field: firstError.field,
      value: firstError.value,
      errors: formatted,
    });
  }
  next();
};

export const donorsSponsorsValidators = {
  list: [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 5000 })
      .withMessage("El límite debe estar entre 1 y 5000.")
      .toInt(),
    query("search").optional().isLength({ max: 100 }).trim(),
    query("status")
      .optional()
      .isIn(["Activo", "Inactivo", "Por confirmar"])
      .withMessage("El estado debe ser Activo, Inactivo o Por confirmar."),
    query("tipo")
      .optional()
      .isIn(["Donante", "Patrocinador"])
      .withMessage("El tipo debe ser Donante o Patrocinador."),
    query("tipoPersona")
      .optional()
      .isIn(["Natural", "Juridica"])
      .withMessage("El tipo de persona debe ser Natural o Juridica."),
  ],

  getById: [param("id").isInt({ min: 1 }).withMessage("ID inv\u00e1lido").toInt()],

  create: [
    body("tipo")
      .notEmpty()
      .withMessage("El tipo es obligatorio.")
      .isIn(["Donante", "Patrocinador"])
      .withMessage("El tipo debe ser Donante o Patrocinador."),

    body("tipoPersona")
      .notEmpty()
      .withMessage("El tipo de persona es obligatorio.")
      .isIn(["Natural", "Juridica"])
      .withMessage("El tipo de persona debe ser Natural o Juridica."),

    body("nombreCompleto")
      .if(body("tipoPersona").equals("Natural"))
      .notEmpty()
      .withMessage("El nombre completo es obligatorio.")
      .isLength({ min: 2, max: 150 })
      .withMessage("El nombre debe tener entre 2 y 150 caracteres.")
      .trim(),

    body("razonSocial")
      .if(body("tipoPersona").equals("Juridica"))
      .notEmpty()
      .withMessage("La raz\u00f3n social es obligatoria.")
      .isLength({ min: 2, max: 200 })
      .withMessage("La raz\u00f3n social debe tener entre 2 y 200 caracteres.")
      .trim(),

    body("tipoDocumento")
      .if(body("tipoPersona").equals("Natural"))
      .notEmpty()
      .withMessage("El tipo de documento es obligatorio.")
      .isLength({ max: 50 }),

    body("numeroDocumento")
      .if(body("tipoPersona").equals("Natural"))
      .notEmpty()
      .withMessage("El n\u00famero de documento es obligatorio.")
      .isLength({ min: 5, max: 50 })
      .withMessage("El documento debe tener entre 5 y 50 caracteres.")
      .matches(/^[0-9A-Za-z.\-]+$/)
      .withMessage("El documento solo puede contener n\u00fameros, letras, puntos o guiones.")
      .trim(),

    body("nit")
      .if(body("tipoPersona").equals("Juridica"))
      .notEmpty()
      .withMessage("El NIT es obligatorio.")
      .isLength({ min: 5, max: 50 })
      .withMessage("El NIT debe tener entre 5 y 50 caracteres.")
      .matches(/^[0-9A-Za-z.\-]+$/)
      .withMessage("El NIT solo puede contener n\u00fameros, letras, puntos o guiones.")
      .trim(),

    body("personaContacto")
      .if(body("tipoPersona").equals("Juridica"))
      .notEmpty()
      .withMessage("El representante legal es obligatorio.")
      .isLength({ min: 2, max: 150 })
      .withMessage("El representante legal debe tener entre 2 y 150 caracteres.")
      .trim(),

    body("telefono")
      .notEmpty()
      .withMessage("El tel\u00e9fono es obligatorio.")
      .isLength({ min: 7, max: 20 })
      .withMessage("El tel\u00e9fono debe tener entre 7 y 20 caracteres.")
      .matches(/^[0-9+\s\-()]+$/)
      .withMessage("El tel\u00e9fono solo puede contener n\u00fameros y signos b\u00e1sicos."),

    body("correo")
      .notEmpty()
      .withMessage("El correo es obligatorio.")
      .isEmail()
      .withMessage("Debe proporcionar un correo v\u00e1lido.")
      .isLength({ max: 150 })
      .withMessage("El correo no puede exceder 150 caracteres.")
      .trim()
      .normalizeEmail(),

    body("direccion")
      .notEmpty()
      .withMessage("La direcci\u00f3n es obligatoria.")
      .isLength({ min: 4, max: 200 })
      .withMessage("La direcci\u00f3n debe tener entre 4 y 200 caracteres.")
      .trim(),
    body("ciudad")
      .notEmpty()
      .withMessage("La ciudad es obligatoria.")
      .isLength({ min: 2, max: 120 })
      .withMessage("La ciudad debe tener entre 2 y 120 caracteres.")
      .trim(),
    body("pais")
      .notEmpty()
      .withMessage("El pa\u00eds es obligatorio.")
      .isLength({ min: 2, max: 120 })
      .withMessage("El pa\u00eds debe tener entre 2 y 120 caracteres.")
      .trim(),
    body("descripcion")
      .optional()
      .isLength({ max: 500 })
      .withMessage("La descripción debe tener máximo 500 caracteres.")
      .trim(),
    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo", "Por confirmar"])
      .withMessage("El estado debe ser Activo, Inactivo o Por confirmar."),
  ],

  update: [
    param("id").isInt({ min: 1 }).withMessage("ID inv\u00e1lido").toInt(),
    body("tipo").optional().isIn(["Donante", "Patrocinador"]),
    body("tipoPersona").optional().isIn(["Natural", "Juridica"]),

    body("nombreCompleto")
      .optional()
      .isLength({ min: 2, max: 150 })
      .withMessage("El nombre debe tener entre 2 y 150 caracteres.")
      .trim(),

    body("razonSocial")
      .optional()
      .isLength({ min: 2, max: 200 })
      .withMessage("La raz\u00f3n social debe tener entre 2 y 200 caracteres.")
      .trim(),

    body("tipoDocumento").optional().isLength({ max: 50 }),

    body("numeroDocumento")
      .optional()
      .isLength({ min: 5, max: 50 })
      .withMessage("El documento debe tener entre 5 y 50 caracteres.")
      .matches(/^[0-9A-Za-z.\-]+$/)
      .withMessage("El documento solo puede contener n\u00fameros, letras, puntos o guiones.")
      .trim(),

    body("nit")
      .optional()
      .isLength({ min: 5, max: 50 })
      .withMessage("El NIT debe tener entre 5 y 50 caracteres.")
      .matches(/^[0-9A-Za-z.\-]+$/)
      .withMessage("El NIT solo puede contener n\u00fameros, letras, puntos o guiones.")
      .trim(),

    body("personaContacto")
      .optional()
      .isLength({ min: 2, max: 150 })
      .withMessage("El representante legal debe tener entre 2 y 150 caracteres.")
      .trim(),

    body("telefono")
      .optional()
      .isLength({ min: 7, max: 20 })
      .withMessage("El tel\u00e9fono debe tener entre 7 y 20 caracteres.")
      .matches(/^[0-9+\s\-()]+$/)
      .withMessage("El tel\u00e9fono solo puede contener n\u00fameros y signos b\u00e1sicos."),

    body("correo")
      .optional()
      .isEmail()
      .withMessage("Debe proporcionar un correo v\u00e1lido.")
      .isLength({ max: 150 })
      .withMessage("El correo no puede exceder 150 caracteres.")
      .trim()
      .normalizeEmail(),

    body("direccion")
      .optional()
      .notEmpty()
      .withMessage("La direcci\u00f3n no puede estar vac\u00eda.")
      .isLength({ min: 4, max: 200 })
      .withMessage("La direcci\u00f3n debe tener entre 4 y 200 caracteres.")
      .trim(),
    body("ciudad")
      .optional()
      .notEmpty()
      .withMessage("La ciudad no puede estar vac\u00eda.")
      .isLength({ min: 2, max: 120 })
      .withMessage("La ciudad debe tener entre 2 y 120 caracteres.")
      .trim(),
    body("pais")
      .optional()
      .notEmpty()
      .withMessage("El pa\u00eds no puede estar vac\u00edo.")
      .isLength({ min: 2, max: 120 })
      .withMessage("El pa\u00eds debe tener entre 2 y 120 caracteres.")
      .trim(),
    body("descripcion")
      .optional()
      .isLength({ max: 500 })
      .withMessage("La descripción debe tener máximo 500 caracteres.")
      .trim(),
    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo", "Por confirmar"])
      .withMessage("El estado debe ser Activo, Inactivo o Por confirmar."),
  ],

  delete: [param("id").isInt({ min: 1 }).withMessage("ID inv\u00e1lido").toInt()],

  changeStatus: [
    param("id").isInt({ min: 1 }).withMessage("ID inv\u00e1lido").toInt(),
    body("status")
      .notEmpty()
      .withMessage("El estado es obligatorio.")
      .isIn(["Activo", "Inactivo", "Por confirmar"])
      .withMessage("El estado debe ser Activo, Inactivo o Por confirmar."),
  ],

  checkIdentification: [
    query("identification")
      .notEmpty()
      .withMessage("La identificaci\u00f3n es obligatoria.")
      .isLength({ min: 5, max: 50 })
      .withMessage("La identificaci\u00f3n debe tener entre 5 y 50 caracteres.")
      .trim(),
    query("excludeId").optional().isInt({ min: 1 }).toInt(),
  ],

  checkEmail: [
    query("email")
      .notEmpty()
      .withMessage("El correo es obligatorio.")
      .isEmail()
      .withMessage("Debe proporcionar un correo v\u00e1lido.")
      .trim()
      .normalizeEmail(),
    query("excludeId").optional().isInt({ min: 1 }).toInt(),
  ],

  createFromLanding: [
    body("nombreCompleto")
      .notEmpty()
      .withMessage("El nombre es obligatorio.")
      .isLength({ min: 2, max: 150 }),
    body("correo")
      .notEmpty()
      .withMessage("El correo es obligatorio.")
      .isEmail()
      .withMessage("Correo inv\u00e1lido.")
      .isLength({ max: 150 }),
    body("telefono")
      .notEmpty()
      .withMessage("El tel\u00e9fono es obligatorio.")
      .isLength({ min: 7, max: 20 }),
    body("tipoDocumento")
      .notEmpty()
      .withMessage("El tipo de documento es obligatorio.")
      .isLength({ max: 50 }),
    body("numeroDocumento")
      .notEmpty()
      .withMessage("El n\u00famero de documento es obligatorio.")
      .isLength({ min: 5, max: 50 })
      .withMessage("El documento debe tener entre 5 y 50 caracteres.")
      .matches(/^[0-9A-Za-z.\-]+$/)
      .withMessage(
        "El documento solo puede contener n\u00fameros, letras, puntos o guiones."
      ),
    body("mensaje").optional().isLength({ max: 500 }),
    body("autorizacion")
      .notEmpty()
      .withMessage("Indica si autorizas ser contactado.")
      .isIn(["Si", "No", "Sí", "si", "no"]),
    body("ciudad").optional().isLength({ min: 2, max: 120 }),
    body("pais").optional().isLength({ min: 2, max: 120 }),
    body("direccion").optional().isLength({ min: 4, max: 200 }),
  ],
};
