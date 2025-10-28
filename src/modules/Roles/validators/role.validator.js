import { body, param, query } from "express-validator";
import { RoleRepository } from "../repository/roles.repository.js";

export const roleValidators = {
  // Validaciones para crear rol
  create: [
    body("name")
      .notEmpty()
      .withMessage("El nombre del rol es obligatorio.")
      .isLength({ min: 2, max: 50 })
      .withMessage("El nombre debe tener entre 2 y 50 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/)
      .withMessage("Solo se permiten letras, números y espacios.")
      .trim()
      .custom(async (value) => {
        const roleRepository = new RoleRepository();
        // Buscar roles con nombres similares (case-insensitive)
        const existingRole = await roleRepository.findByNameCaseInsensitive(
          value
        );
        if (existingRole) {
          throw new Error(
            `El nombre "${value}" ya está en uso. Elija otro nombre.`
          );
        }
        return true;
      }),

    body("description")
      .notEmpty()
      .withMessage("La descripción es obligatoria.")
      .isLength({ min: 10, max: 200 })
      .withMessage("La descripción debe tener entre 10 y 200 caracteres.")
      .trim(),

    body("status")
      .optional()
      .isIn(["Active", "Inactive"])
      .withMessage("Seleccione un estado válido (Activo o Inactivo)."),

    body("permissions")
      .optional()
      .isObject()
      .withMessage("Los permisos deben ser un objeto válido")
      .custom((permissions) => {
        if (permissions && typeof permissions === "object") {
          // Validar estructura de permisos
          for (const [moduleName, modulePermissions] of Object.entries(
            permissions
          )) {
            if (typeof modulePermissions !== "object") {
              throw new Error(
                `Los permisos del módulo "${moduleName}" deben ser un objeto`
              );
            }

            for (const [actionName, hasPermission] of Object.entries(
              modulePermissions
            )) {
              if (typeof hasPermission !== "boolean") {
                throw new Error(
                  `El permiso "${actionName}" en el módulo "${moduleName}" debe ser un booleano`
                );
              }
            }
          }
        }
        return true;
      }),
  ],

  // Validaciones para actualizar rol
  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage(
        "El ID del rol proporcionado no es válido. Debe ser un número entero positivo."
      ),

    body("name")
      .optional()
      .isLength({ min: 2, max: 50 })
      .withMessage("El nombre debe tener entre 2 y 50 caracteres.")
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]+$/)
      .withMessage("Solo se permiten letras, números y espacios.")
      .trim()
      .custom(async (value, { req }) => {
        if (value) {
          const roleRepository = new RoleRepository();
          // Buscar roles con nombres similares (case-insensitive)
          const existingRole = await roleRepository.findByNameCaseInsensitive(
            value
          );
          const currentRole = await roleRepository.findById(
            parseInt(req.params.id)
          );

          // Solo validar si el nombre es diferente al actual
          if (
            existingRole &&
            (!currentRole || existingRole.id !== currentRole.id)
          ) {
            throw new Error(
              `El nombre "${value}" ya está en uso. Elija otro nombre.`
            );
          }
        }
        return true;
      }),

    body("description")
      .optional()
      .isLength({ min: 10, max: 200 })
      .withMessage("La descripción debe tener entre 10 y 200 caracteres.")
      .trim(),

    body("status")
      .optional()
      .isIn(["Active", "Inactive"])
      .withMessage("Seleccione un estado válido (Activo o Inactivo)."),

    body("permissions")
      .optional()
      .isObject()
      .withMessage("Los permisos deben ser un objeto válido")
      .custom((permissions) => {
        if (permissions && typeof permissions === "object") {
          for (const [moduleName, modulePermissions] of Object.entries(
            permissions
          )) {
            if (typeof modulePermissions !== "object") {
              throw new Error(
                `Los permisos del módulo "${moduleName}" deben ser un objeto`
              );
            }

            for (const [actionName, hasPermission] of Object.entries(
              modulePermissions
            )) {
              if (typeof hasPermission !== "boolean") {
                throw new Error(
                  `El permiso "${actionName}" en el módulo "${moduleName}" debe ser un booleano`
                );
              }
            }
          }
        }
        return true;
      }),
  ],

  // Validaciones para obtener rol por ID
  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage(
        "El ID del rol proporcionado no es válido. Debe ser un número entero positivo."
      ),
  ],

  // Validaciones para eliminar rol
  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage(
        "El ID del rol proporcionado no es válido. Debe ser un número entero positivo."
      ),
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
  ],
};

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  import("express-validator")
    .then(({ validationResult }) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const errorMessages = errors.array();

        // Si hay múltiples errores, mostrar el primero más importante
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
