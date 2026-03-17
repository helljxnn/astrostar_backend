import { body, param, query, validationResult } from "express-validator";
import { RoleRepository } from "../repository/roles.repository.js";
import { validateRolePermissionsShape } from "../config/permissions.config.js";

export const roleValidators = {
  create: [
    body("name")
      .notEmpty()
      .withMessage("El nombre del rol es obligatorio.")
      .isLength({ min: 2, max: 50 })
      .withMessage("El nombre debe tener entre 2 y 50 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/)
      .withMessage("Solo se permiten letras, numeros y espacios.")
      .trim()
      .custom(async (value) => {
        const roleRepository = new RoleRepository();
        const existingRole = await roleRepository.findByNameCaseInsensitive(value);
        if (existingRole) {
          throw new Error(`El nombre "${value}" ya esta en uso. Elija otro nombre.`);
        }
        return true;
      }),

    body("description")
      .notEmpty()
      .withMessage("La descripcion es obligatoria.")
      .isLength({ min: 10, max: 200 })
      .withMessage("La descripcion debe tener entre 10 y 200 caracteres.")
      .trim(),

    body("permissions")
      .optional()
      .isObject()
      .withMessage("Los permisos deben ser un objeto valido.")
      .custom((permissions) => {
        if (!permissions) return true;
        const validationResult = validateRolePermissionsShape(permissions);
        if (!validationResult.isValid) {
          throw new Error(validationResult.message);
        }
        return true;
      }),
  ],

  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del rol no es valido. Debe ser un entero positivo."),

    body("name")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("El nombre debe tener entre 2 y 50 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/)
      .withMessage("Solo se permiten letras, numeros y espacios.")
      .trim()
      .custom(async (value, { req }) => {
        if (!value) return true;
        const roleRepository = new RoleRepository();
        const existingRole = await roleRepository.findByNameCaseInsensitive(value);
        const currentRole = await roleRepository.findById(parseInt(req.params.id, 10));
        if (existingRole && (!currentRole || existingRole.id !== currentRole.id)) {
          throw new Error(`El nombre "${value}" ya esta en uso. Elija otro nombre.`);
        }
        return true;
      }),

    body("description")
      .optional()
      .isLength({ min: 10, max: 200 })
      .withMessage("La descripcion debe tener entre 10 y 200 caracteres.")
      .trim(),

    body("permissions")
      .optional()
      .isObject()
      .withMessage("Los permisos deben ser un objeto valido.")
      .custom((permissions) => {
        if (!permissions) return true;
        const validationResult = validateRolePermissionsShape(permissions);
        if (!validationResult.isValid) {
          throw new Error(validationResult.message);
        }
        return true;
      }),
  ],

  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del rol no es valido. Debe ser un entero positivo."),
  ],

  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("El ID del rol no es valido. Debe ser un entero positivo."),
  ],

  getAll: [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("El numero de pagina debe ser un entero positivo."),

    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("El limite debe estar entre 1 y 100."),

    query("search")
      .optional()
      .isLength({ max: 100 })
      .withMessage("La busqueda no puede exceder 100 caracteres.")
      .trim(),
  ],
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
    });
  }
  next();
};


