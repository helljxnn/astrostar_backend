const DEFAULT_ROLE_ACTIONS = Object.freeze(["Crear", "Ver", "Editar", "Eliminar"]);
const ROLE_ACTIONS = Object.freeze([
  ...DEFAULT_ROLE_ACTIONS,
  "Aceptar",
  "Rechazar",
  "Aprobar",
  "Descargar",
  "Acudiente",
  "Cancelar",
  "Listar deportistas",
  "Materiales",
  "Inscribir",
  "Ver inscritos",
  "Ver Asignaciones del Material",
  "Transferir Stock",
  "Registrar Baja de Material",
]);

const LEGACY_ACTION_ALIASES = Object.freeze({
  Listar: "Ver",
});

const ROLE_MODULES = Object.freeze([
  "dashboard",
  "users",
  "roles",
  "employees",
  "employeesSchedule",
  "appointmentManagement",
  "sportsCategory",
  "athletesSection",
  "athletesAssistance",
  "enrollments",
  "paymentsManagement",
  "myPayments",
  "eventsManagement",
  "temporaryWorkers",
  "temporaryTeams",
  "donorsSponsors",
  "donationsManagement",
  "materials",
  "materialCategories",
  "materialsRegistry",
  "providers",
  // Legacy module that can exist in old records.
  "purchasesManagement",
]);

const MODULE_ALIASES = Object.freeze({
  donations: "donationsManagement",
  events: "eventsManagement",
});

const MODULE_ALLOWED_ACTIONS = Object.freeze({
  dashboard: ["Ver"],
  users: ["Ver"],
  roles: ["Crear", "Ver", "Editar", "Eliminar"],
  employees: ["Crear", "Ver", "Editar", "Eliminar"],
  employeesSchedule: ["Crear", "Ver", "Editar", "Eliminar"],
  appointmentManagement: ["Crear", "Ver", "Editar", "Cancelar"],
  eventsManagement: [
    "Crear",
    "Ver",
    "Editar",
    "Eliminar",
    "Materiales",
    "Inscribir",
    "Ver inscritos",
  ],
  temporaryWorkers: ["Crear", "Ver", "Editar", "Eliminar"],
  temporaryTeams: ["Crear", "Ver", "Editar", "Eliminar"],
  sportsCategory: ["Crear", "Ver", "Editar", "Eliminar", "Listar deportistas"],
  athletesSection: ["Ver", "Editar", "Eliminar", "Acudiente"],
  athletesAssistance: ["Crear", "Ver", "Editar"],
  materials: [
    "Crear",
    "Ver",
    "Editar",
    "Eliminar",
    "Ver Asignaciones del Material",
    "Transferir Stock",
    "Registrar Baja de Material",
  ],
  materialCategories: ["Crear", "Ver", "Editar", "Eliminar"],
  materialsRegistry: ["Ver", "Editar"],
  providers: ["Crear", "Ver", "Editar", "Eliminar"],
  donorsSponsors: ["Crear", "Ver", "Editar", "Eliminar"],
  donationsManagement: ["Crear", "Ver", "Editar"],
  enrollments: ["Ver", "Aceptar", "Rechazar"],
  paymentsManagement: ["Ver", "Descargar", "Aprobar", "Rechazar"],
});

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeAction = (action) => LEGACY_ACTION_ALIASES[action] || action;

export const resolveModuleKey = (moduleKey, permissions = {}) => {
  if (!moduleKey) return moduleKey;
  if (permissions[moduleKey]) return moduleKey;
  const alias = MODULE_ALIASES[moduleKey];
  if (alias && permissions[alias]) return alias;
  return alias || moduleKey;
};

export const validateRolePermissionsShape = (permissions) => {
  if (!isPlainObject(permissions)) {
    return {
      isValid: false,
      message: "Los permisos deben ser un objeto válido.",
    };
  }

  for (const [moduleName, modulePermissions] of Object.entries(permissions)) {
    if (!ROLE_MODULES.includes(moduleName)) {
      return {
        isValid: false,
        message: `El módulo "${moduleName}" no es válido.`,
      };
    }

    const allowedActions = MODULE_ALLOWED_ACTIONS[moduleName] || DEFAULT_ROLE_ACTIONS;

    if (!isPlainObject(modulePermissions)) {
      return {
        isValid: false,
        message: `Los permisos del módulo "${moduleName}" deben ser un objeto.`,
      };
    }

    for (const [rawActionName, rawValue] of Object.entries(modulePermissions)) {
      const actionName = normalizeAction(rawActionName);
      if (!ROLE_ACTIONS.includes(actionName) || !allowedActions.includes(actionName)) {
        return {
          isValid: false,
          message: `La acción "${rawActionName}" no es válida en el módulo "${moduleName}".`,
        };
      }

      if (typeof rawValue !== "boolean") {
        return {
          isValid: false,
          message: `La acción "${rawActionName}" del módulo "${moduleName}" debe ser booleana.`,
        };
      }
    }
  }

  return { isValid: true };
};

export const normalizeRolePermissions = (permissions = {}) => {
  const rawPermissions = isPlainObject(permissions) ? permissions : {};
  const normalized = {};

  ROLE_MODULES.forEach((moduleName) => {
    const rawModulePermissions = isPlainObject(rawPermissions[moduleName])
      ? rawPermissions[moduleName]
      : {};

    const allowedActions = MODULE_ALLOWED_ACTIONS[moduleName] || DEFAULT_ROLE_ACTIONS;
    const aceptar =
      allowedActions.includes("Aceptar") &&
      rawModulePermissions.Aceptar === true;
    const rechazar =
      allowedActions.includes("Rechazar") &&
      rawModulePermissions.Rechazar === true;
    const aprobar =
      allowedActions.includes("Aprobar") &&
      rawModulePermissions.Aprobar === true;
    const descargar =
      allowedActions.includes("Descargar") &&
      rawModulePermissions.Descargar === true;
    const acudiente =
      allowedActions.includes("Acudiente") &&
      rawModulePermissions.Acudiente === true;
    const materiales =
      allowedActions.includes("Materiales") &&
      rawModulePermissions.Materiales === true;
    const inscribir =
      allowedActions.includes("Inscribir") &&
      rawModulePermissions.Inscribir === true;
    const verInscritos =
      allowedActions.includes("Ver inscritos") &&
      rawModulePermissions["Ver inscritos"] === true;
    const verAsignaciones =
      allowedActions.includes("Ver Asignaciones del Material") &&
      rawModulePermissions["Ver Asignaciones del Material"] === true;
    const transferirStock =
      allowedActions.includes("Transferir Stock") &&
      rawModulePermissions["Transferir Stock"] === true;
    const registrarBajaMaterial =
      allowedActions.includes("Registrar Baja de Material") &&
      rawModulePermissions["Registrar Baja de Material"] === true;
    const ver =
      rawModulePermissions.Ver === true ||
      rawModulePermissions.Listar === true ||
      aceptar ||
      rechazar ||
      aprobar ||
      descargar ||
      materiales ||
      inscribir ||
      verInscritos ||
      verAsignaciones ||
      transferirStock ||
      registrarBajaMaterial;

    normalized[moduleName] = {
      Ver: allowedActions.includes("Ver") ? ver : false,
      Crear:
        allowedActions.includes("Crear") && rawModulePermissions.Crear === true,
      Editar:
        allowedActions.includes("Editar") && rawModulePermissions.Editar === true,
      Eliminar:
        allowedActions.includes("Eliminar") &&
        rawModulePermissions.Eliminar === true,
      Cancelar:
        allowedActions.includes("Cancelar") &&
        rawModulePermissions.Cancelar === true,
      Aceptar:
        aceptar,
      Rechazar:
        rechazar,
      Aprobar:
        aprobar,
      Descargar:
        descargar,
      Acudiente:
        acudiente,
      Materiales:
        materiales,
      Inscribir:
        inscribir,
      "Ver inscritos":
        verInscritos,
      "Listar deportistas":
        allowedActions.includes("Listar deportistas") &&
        rawModulePermissions["Listar deportistas"] === true,
      "Ver Asignaciones del Material":
        verAsignaciones,
      "Transferir Stock":
        transferirStock,
      "Registrar Baja de Material":
        registrarBajaMaterial,
    };
  });

  return normalized;
};

export const hasNormalizedPermission = (permissions, module, action) => {
  if (!isPlainObject(permissions)) return false;

  const resolvedModule = resolveModuleKey(module, permissions);
  const modulePermissions = permissions[resolvedModule];
  if (!isPlainObject(modulePermissions)) return false;

  const normalizedAction = normalizeAction(action);

  if (normalizedAction === "Ver") {
    return Boolean(modulePermissions.Ver || modulePermissions.Listar);
  }
  if (normalizedAction === "Aceptar") {
    return Boolean(modulePermissions.Aceptar);
  }
  if (normalizedAction === "Rechazar") {
    return Boolean(modulePermissions.Rechazar);
  }
  if (normalizedAction === "Ver Asignaciones del Material") {
    return Boolean(modulePermissions["Ver Asignaciones del Material"]);
  }
  if (normalizedAction === "Materiales") {
    return Boolean(modulePermissions.Materiales);
  }
  if (normalizedAction === "Inscribir") {
    return Boolean(modulePermissions.Inscribir);
  }
  if (normalizedAction === "Ver inscritos") {
    return Boolean(modulePermissions["Ver inscritos"]);
  }
  if (normalizedAction === "Transferir Stock") {
    return Boolean(modulePermissions["Transferir Stock"]);
  }
  if (normalizedAction === "Registrar Baja de Material") {
    return Boolean(modulePermissions["Registrar Baja de Material"]);
  }

  return Boolean(modulePermissions[normalizedAction]);
};

export {
  ROLE_ACTIONS,
  DEFAULT_ROLE_ACTIONS,
  ROLE_MODULES,
  LEGACY_ACTION_ALIASES,
  MODULE_ALLOWED_ACTIONS,
};

