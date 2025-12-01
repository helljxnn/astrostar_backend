import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      field: firstError.path,
      value: firstError.value,
      errors: errors.array(),
    });
  }

  next();
};

/**
 * Validadores para proveedores
 */
export const providersValidators = {
  /**
   * Validación para obtener todos los proveedores
   */
  getAll: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("La página debe ser un número entero mayor a 0.")
      .toInt(),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("El límite debe ser un número entre 1 y 100.")
      .toInt(),

    query("search")
      .optional()
      .isLength({ max: 100 })
      .withMessage("La búsqueda no puede exceder 100 caracteres.")
      .trim(),

    query("status")
      .optional({ checkFalsy: true })
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser: Activo o Inactivo."),

    query("entityType")
      .optional({ checkFalsy: true })
      .isIn(["juridica", "natural"])
      .withMessage("El tipo de entidad debe ser: juridica o natural."),
  ],

  /**
   * Validación para obtener proveedor por ID
   */
  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero válido.")
      .toInt(),
  ],

  /**
   * Validación para crear proveedor
   */
  create: [
    // Tipo de entidad
    body("tipoEntidad")
      .notEmpty()
      .withMessage("El tipo de entidad es obligatorio.")
      .isIn(["juridica", "natural"])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".'),

    // Razón social / Nombre (acepta tanto razonSocial como businessName)
    body("razonSocial").custom((value, { req }) => {
      // Si no hay razonSocial pero sí businessName, usar businessName
      if (!value && req.body.businessName) {
        req.body.razonSocial = req.body.businessName;
        value = req.body.businessName;
      }

      if (!value) {
        throw new Error(
          req.body.tipoEntidad === "juridica"
            ? "La razón social es obligatoria."
            : "El nombre completo es obligatorio."
        );
      }

      if (value.length < 3 || value.length > 200) {
        throw new Error(
          req.body.tipoEntidad === "juridica"
            ? "La razón social debe tener entre 3 y 200 caracteres."
            : "El nombre debe tener entre 3 y 200 caracteres."
        );
      }

      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.,\-&()]+$/.test(value)) {
        throw new Error(
          "Solo se permiten letras, números, espacios y caracteres especiales básicos."
        );
      }

      return true;
    }),

    // NIT / Documento de identidad
    body("nit")
      .notEmpty()
      .withMessage((value, { req }) =>
        req.body.tipoEntidad === "juridica"
          ? "El NIT es obligatorio."
          : "El documento de identidad es obligatorio."
      )
      .custom(async (value, { req }) => {
        if (req.body.tipoEntidad === "juridica") {
          // PERSONA JURÍDICA: Solo números, exactamente 10 dígitos
          if (!/^\d+$/.test(value)) {
            throw new Error("El NIT solo puede contener números, sin guiones.");
          }
          if (value.length !== 10) {
            throw new Error("El NIT debe tener exactamente 10 dígitos.");
          }
        } else {
          // PERSONA NATURAL: Validar según tipo de documento
          const { validateDocumentNumber } = await import(
            "../../../utils/documentValidation.js"
          );
          const { getDocumentTypeName } = await import(
            "../repository/providers.repository.js"
          );

          if (req.body.tipoDocumento) {
            try {
              const documentTypeName = await getDocumentTypeName(
                req.body.tipoDocumento
              );
              const validation = validateDocumentNumber(
                documentTypeName,
                value
              );

              if (!validation.isValid) {
                throw new Error(validation.error);
              }
            } catch (error) {
              // Si no se puede obtener el tipo, usar validación básica
              if (!/^[0-9A-Za-z\-]+$/.test(value)) {
                throw new Error(
                  "El documento solo puede contener números, letras y guiones."
                );
              }
              if (value.length < 6 || value.length > 20) {
                throw new Error(
                  "El documento debe tener entre 6 y 20 caracteres."
                );
              }
            }
          } else {
            // Sin tipo de documento, validación básica
            if (!/^[0-9A-Za-z\-]+$/.test(value)) {
              throw new Error(
                "El documento solo puede contener números, letras y guiones."
              );
            }
            if (value.length < 6 || value.length > 20) {
              throw new Error(
                "El documento debe tener entre 6 y 20 caracteres."
              );
            }
          }
        }

        return true;
      })
      .trim(),

    // Tipo de documento (solo para persona natural)
    body("tipoDocumento")
      .optional()
      .custom((value, { req }) => {
        if (req.body.tipoEntidad === "natural" && !value) {
          throw new Error(
            "Debe seleccionar un tipo de documento para persona natural."
          );
        }
        // Validar que sea un número válido (ID del tipo de documento)
        if (value) {
          const numValue = typeof value === "string" ? parseInt(value) : value;
          if (isNaN(numValue) || numValue < 1) {
            throw new Error("Seleccione un tipo de documento válido.");
          }
        }
        return true;
      }),

    // Contacto principal (acepta tanto contactoPrincipal como mainContact)
    body("contactoPrincipal").custom((value, { req }) => {
      // Si no hay contactoPrincipal pero sí mainContact, usar mainContact
      if (!value && req.body.mainContact) {
        req.body.contactoPrincipal = req.body.mainContact;
        value = req.body.mainContact;
      }

      if (!value) {
        throw new Error("El contacto principal es obligatorio.");
      }

      if (value.length < 2 || value.length > 150) {
        throw new Error(
          "El contacto principal debe tener entre 2 y 150 caracteres."
        );
      }

      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        throw new Error(
          "El contacto principal solo puede contener letras y espacios."
        );
      }

      return true;
    }),

    // Correo electrónico (acepta tanto correo como email)
    body("correo").custom((value, { req }) => {
      // Si no hay correo pero sí email, usar email
      if (!value && req.body.email) {
        req.body.correo = req.body.email;
        value = req.body.email;
      }

      // El correo es opcional
      if (value) {
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new Error("Debe proporcionar un email válido.");
        }

        if (value.length > 150) {
          throw new Error("El email no puede exceder 150 caracteres.");
        }
      }

      return true;
    }),

    // Normalizar email si viene como 'email' en lugar de 'correo'
    body("email").custom((value, { req }) => {
      if (value && !req.body.correo) {
        req.body.correo = value;
      }
      return true;
    }),

    // Normalizar mainContact a contactoPrincipal
    body("mainContact").custom((value, { req }) => {
      if (value && !req.body.contactoPrincipal) {
        req.body.contactoPrincipal = value;
      }
      return true;
    }),

    // Normalizar phone a telefono
    body("phone").custom((value, { req }) => {
      if (value && !req.body.telefono) {
        req.body.telefono = value;
      }
      return true;
    }),

    // Normalizar address a direccion
    body("address").custom((value, { req }) => {
      if (value && !req.body.direccion) {
        req.body.direccion = value;
      }
      return true;
    }),

    // Normalizar city a ciudad
    body("city").custom((value, { req }) => {
      if (value && !req.body.ciudad) {
        req.body.ciudad = value;
      }
      return true;
    }),

    // Normalizar documentTypeId a tipoDocumento
    body("documentTypeId").custom((value, { req }) => {
      if (value && !req.body.tipoDocumento) {
        req.body.tipoDocumento = value;
      }
      return true;
    }),

    // Normalizar status a estado
    body("status").custom((value, { req }) => {
      if (value && !req.body.estado) {
        // Convertir de inglés a español
        req.body.estado =
          value === "Active"
            ? "Activo"
            : value === "Inactive"
            ? "Inactivo"
            : value;
      }
      return true;
    }),

    // Teléfono (acepta tanto telefono como phone)
    body("telefono").custom((value, { req }) => {
      // Si no hay telefono pero sí phone, usar phone
      if (!value && req.body.phone) {
        req.body.telefono = req.body.phone;
        value = req.body.phone;
      }

      if (!value) {
        throw new Error("El número telefónico es obligatorio.");
      }

      if (value.length < 7 || value.length > 20) {
        throw new Error("El teléfono debe tener entre 7 y 20 caracteres.");
      }

      if (!/^\+?[\d\s\-()]+$/.test(value)) {
        throw new Error("El formato del teléfono no es válido.");
      }

      return true;
    }),

    // Dirección (acepta tanto direccion como address)
    body("direccion").custom((value, { req }) => {
      // Si no hay direccion pero sí address, usar address
      if (!value && req.body.address) {
        req.body.direccion = req.body.address;
        value = req.body.address;
      }

      if (!value) {
        throw new Error("La dirección es obligatoria.");
      }

      if (value.length < 10 || value.length > 200) {
        throw new Error("La dirección debe tener entre 10 y 200 caracteres.");
      }

      return true;
    }),

    // Ciudad (acepta tanto ciudad como city)
    body("ciudad").custom((value, { req }) => {
      // Si no hay ciudad pero sí city, usar city
      if (!value && req.body.city) {
        req.body.ciudad = req.body.city;
        value = req.body.city;
      }

      if (!value) {
        throw new Error("La ciudad es obligatoria.");
      }

      if (value.length < 2 || value.length > 100) {
        throw new Error("La ciudad debe tener entre 2 y 100 caracteres.");
      }

      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        throw new Error("La ciudad solo puede contener letras y espacios.");
      }

      return true;
    }),

    // Descripción (opcional, acepta tanto descripcion como description)
    body("descripcion").custom((value, { req }) => {
      // Si no hay descripcion pero sí description, usar description
      if (!value && req.body.description) {
        req.body.descripcion = req.body.description;
        value = req.body.description;
      }

      // La descripción es opcional
      if (value && value.length > 500) {
        throw new Error("La descripción no puede exceder 500 caracteres.");
      }

      return true;
    }),

    // Estado
    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser: Activo o Inactivo."),
  ],

  /**
   * Validación para actualizar proveedor
   */
  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero válido.")
      .toInt(),

    // Normalizar estado a status (español a inglés)
    body("estado").custom((value, { req }) => {
      if (value) {
        // Convertir de español a inglés para el backend
        req.body.status =
          value === "Activo"
            ? "Active"
            : value === "Inactivo"
            ? "Inactive"
            : value;
      }
      return true;
    }),

    // Todos los campos son opcionales en actualización
    body("tipoEntidad")
      .optional()
      .isIn(["juridica", "natural"])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".'),

    body("razonSocial")
      .optional()
      .isLength({ min: 3, max: 200 })
      .withMessage((value, { req }) =>
        req.body.tipoEntidad === "juridica"
          ? "La razón social debe tener entre 3 y 200 caracteres."
          : "El nombre debe tener entre 3 y 200 caracteres."
      )
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.,\-&()]+$/)
      .withMessage(
        "Solo se permiten letras, números, espacios y caracteres especiales básicos."
      )
      .trim(),

    body("nit")
      .optional()
      .custom(async (value, { req }) => {
        if (value) {
          if (req.body.tipoEntidad === "juridica") {
            // PERSONA JURÍDICA: Solo números, exactamente 10 dígitos
            if (!/^\d+$/.test(value)) {
              throw new Error(
                "El NIT solo puede contener números, sin guiones."
              );
            }
            if (value.length !== 10) {
              throw new Error("El NIT debe tener exactamente 10 dígitos.");
            }
          } else {
            // PERSONA NATURAL: Validar según tipo de documento
            const { validateDocumentNumber } = await import(
              "../../../utils/documentValidation.js"
            );
            const { getDocumentTypeName } = await import(
              "../repository/providers.repository.js"
            );

            if (req.body.tipoDocumento) {
              try {
                const documentTypeName = await getDocumentTypeName(
                  req.body.tipoDocumento
                );
                const validation = validateDocumentNumber(
                  documentTypeName,
                  value
                );

                if (!validation.isValid) {
                  throw new Error(validation.error);
                }
              } catch (error) {
                // Si no se puede obtener el tipo, usar validación básica
                if (!/^[0-9A-Za-z\-]+$/.test(value)) {
                  throw new Error(
                    "El documento solo puede contener números, letras y guiones."
                  );
                }
                if (value.length < 6 || value.length > 20) {
                  throw new Error(
                    "El documento debe tener entre 6 y 20 caracteres."
                  );
                }
              }
            } else {
              // Sin tipo de documento, validación básica
              if (!/^[0-9A-Za-z\-]+$/.test(value)) {
                throw new Error(
                  "El documento solo puede contener números, letras y guiones."
                );
              }
              if (value.length < 6 || value.length > 20) {
                throw new Error(
                  "El documento debe tener entre 6 y 20 caracteres."
                );
              }
            }
          }
        }
        return true;
      })
      .trim(),

    body("tipoDocumento")
      .optional()
      .custom((value, { req }) => {
        // Validar que sea un número válido (ID del tipo de documento)
        if (value) {
          const numValue = typeof value === "string" ? parseInt(value) : value;
          if (isNaN(numValue) || numValue < 1) {
            throw new Error("Seleccione un tipo de documento válido.");
          }
        }
        return true;
      }),

    body("contactoPrincipal")
      .optional()
      .isLength({ min: 2, max: 150 })
      .withMessage("El contacto principal debe tener entre 2 y 150 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage(
        "El contacto principal solo puede contener letras y espacios."
      )
      .trim(),

    body("correo")
      .optional()
      .isEmail()
      .withMessage("Debe proporcionar un email válido.")
      .isLength({ max: 150 })
      .withMessage("El email no puede exceder 150 caracteres.")
      .trim()
      .toLowerCase(),

    body("telefono")
      .optional()
      .isLength({ min: 7, max: 20 })
      .withMessage("El teléfono debe tener entre 7 y 20 caracteres.")
      .matches(/^\+?[\d\s\-()]+$/)
      .withMessage("El formato del teléfono no es válido."),

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
      .optional({ nullable: true })
      .isLength({ max: 500 })
      .withMessage("La descripción no puede exceder 500 caracteres.")
      .trim(),

    body("estado")
      .optional()
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser: Activo o Inactivo."),
  ],

  /**
   * Validación para eliminar proveedor
   */
  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero válido.")
      .toInt(),
  ],

  /**
   * Validación para cambiar estado
   */
  changeStatus: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del proveedor debe ser un número entero válido.")
      .toInt(),

    body("status")
      .notEmpty()
      .withMessage("El estado es obligatorio.")
      .isIn(["Activo", "Inactivo"])
      .withMessage("El estado debe ser: Activo o Inactivo."),
  ],

  /**
   * Validación para verificar disponibilidad de NIT/documento
   */
  checkNit: [
    query("nit")
      .notEmpty()
      .withMessage((value, { req }) =>
        req.query.tipoEntidad === "juridica"
          ? "El NIT es obligatorio."
          : "El documento de identidad es obligatorio."
      )
      .custom(async (value, { req }) => {
        if (req.query.tipoEntidad === "juridica") {
          // PERSONA JURÍDICA: Solo números, exactamente 10 dígitos
          if (!/^\d+$/.test(value)) {
            throw new Error("El NIT solo puede contener números, sin guiones.");
          }
          if (value.length !== 10) {
            throw new Error("El NIT debe tener exactamente 10 dígitos.");
          }
        } else {
          // PERSONA NATURAL: Validación básica (no tenemos tipo de documento en query)
          if (!/^[0-9A-Za-z\-]+$/.test(value)) {
            throw new Error(
              "El documento solo puede contener números, letras y guiones."
            );
          }
          if (value.length < 6 || value.length > 20) {
            throw new Error("El documento debe tener entre 6 y 20 caracteres.");
          }
        }

        return true;
      })
      .trim(),

    query("excludeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El excludeId debe ser un número entero válido.")
      .toInt(),

    query("tipoEntidad")
      .optional()
      .isIn(["juridica", "natural"])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".'),
  ],

  /**
   * Validación para verificar disponibilidad de razón social/nombre
   */
  checkBusinessName: [
    query("businessName")
      .notEmpty()
      .withMessage((value, { req }) =>
        req.query.tipoEntidad === "juridica"
          ? "La razón social es requerida."
          : "El nombre es requerido."
      )
      .isLength({ min: 3, max: 200 })
      .withMessage("Debe tener entre 3 y 200 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\.,\-&()]+$/)
      .withMessage(
        "Solo se permiten letras, números, espacios y caracteres especiales básicos."
      )
      .trim(),

    query("excludeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El excludeId debe ser un número entero válido.")
      .toInt(),

    query("tipoEntidad")
      .optional()
      .isIn(["juridica", "natural"])
      .withMessage('El tipo de entidad debe ser "juridica" o "natural".'),
  ],

  /**
   * Validación para verificar disponibilidad de email
   */
  checkEmail: [
    query("email")
      .notEmpty()
      .withMessage("El email es obligatorio.")
      .isEmail()
      .withMessage("Debe proporcionar un email válido.")
      .isLength({ max: 150 })
      .withMessage("El email no puede exceder 150 caracteres.")
      .trim()
      .toLowerCase(),

    query("excludeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID a excluir debe ser un número entero válido.")
      .toInt(),
  ],

  /**
   * Validación para verificar disponibilidad de contacto
   */
  checkContact: [
    query("contact")
      .notEmpty()
      .withMessage("El nombre de contacto es obligatorio.")
      .isLength({ min: 2, max: 150 })
      .withMessage("El contacto debe tener entre 2 y 150 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage("El contacto solo puede contener letras y espacios.")
      .trim(),

    query("excludeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El ID a excluir debe ser un número entero válido.")
      .toInt(),
  ],

  /**
   * Validación para verificar disponibilidad de identificación
   */
  checkIdentification: [
    query("identification")
      .notEmpty()
      .withMessage("La identificación es obligatoria.")
      .isLength({ min: 6, max: 50 })
      .withMessage("La identificación debe tener entre 6 y 50 caracteres.")
      .matches(/^[0-9A-Za-z\-]+$/)
      .withMessage(
        "La identificación solo puede contener números, letras y guiones."
      )
      .trim(),

    query("excludeUserId")
      .optional()
      .isInt({ min: 1 })
      .withMessage(
        "El ID de usuario a excluir debe ser un número entero válido."
      )
      .toInt(),
  ],
};
