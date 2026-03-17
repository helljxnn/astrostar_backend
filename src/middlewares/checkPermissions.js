import prisma from "../config/database.js";
import {
  hasNormalizedPermission,
  resolveModuleKey,
} from "../modules/Roles/config/permissions.config.js";

export const checkPermissions = (module, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const roleName = userRole.name || userRole;
      const roleStr = String(roleName).toLowerCase();
      if (roleStr === "admin" || roleStr === "administrador") {
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              name: true,
              permissions: true,
            },
          },
        },
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: "Usuario sin rol asignado",
        });
      }

      const permissions = user.role.permissions || {};
      const resolvedModule = resolveModuleKey(module, permissions);

      if (!hasNormalizedPermission(permissions, resolvedModule, action)) {
        return res.status(403).json({
          success: false,
          message: `No tienes permisos para ${String(action).toLowerCase()} en ${resolvedModule}`,
          requiredPermission: `${resolvedModule}.${action}`,
        });
      }

      req.userPermissions = permissions;
      next();
    } catch (error) {
      console.error("Error checking permissions:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
};

export const checkModuleAccess = (module) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const roleName = userRole.name || userRole;
      const roleStr = String(roleName).toLowerCase();
      if (roleStr === "admin" || roleStr === "administrador") {
        return next();
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              permissions: true,
            },
          },
        },
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: "Acceso denegado",
        });
      }

      const permissions = user.role.permissions || {};
      const resolvedModule = resolveModuleKey(module, permissions);
      const modulePermissions = permissions[resolvedModule];

      if (!modulePermissions || !Object.values(modulePermissions).some(Boolean)) {
        return res.status(403).json({
          success: false,
          message: `No tienes acceso al modulo ${resolvedModule}`,
        });
      }

      req.userPermissions = permissions;
      next();
    } catch (error) {
      console.error("Error checking module access:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
};

export const hasPermission = (permissions, module, action) => {
  const resolvedModule = resolveModuleKey(module, permissions || {});
  return hasNormalizedPermission(permissions, resolvedModule, action);
};

export const getAccessibleModules = (permissions) => {
  if (!permissions) return [];
  return Object.keys(permissions).filter((module) => {
    const modulePermissions = permissions[module];
    return modulePermissions && Object.values(modulePermissions).some(Boolean);
  });
};
