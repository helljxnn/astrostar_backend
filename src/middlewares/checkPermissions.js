import prisma from '../config/database.js';

/**
 * Middleware para verificar permisos específicos por módulo y acción
 * @param {string} module - El módulo que se quiere acceder (ej: 'users', 'roles', 'dashboard')
 * @param {string} action - La acción que se quiere realizar (ej: 'Ver', 'Crear', 'Editar', 'Eliminar')
 * @returns {Function} Middleware function
 */
export const checkPermissions = (module, action) => {
  return async (req, res, next) => {
    try {
      // Obtener el usuario del token (asumiendo que ya está autenticado)
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Si es admin, permitir todo
      if (userRole === 'admin') {
        return next();
      }

      // Obtener el rol del usuario con sus permisos
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              name: true,
              permissions: true,
              status: true
            }
          }
        }
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado'
        });
      }

      // Verificar si el rol está activo
      if (user.role.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Rol inactivo'
        });
      }

      // Obtener los permisos del rol
      const permissions = user.role.permissions || {};

      // Verificar si tiene permisos para el módulo y acción específica
      const modulePermissions = permissions[module];
      
      if (!modulePermissions || !modulePermissions[action]) {
        return res.status(403).json({
          success: false,
          message: `No tienes permisos para ${action.toLowerCase()} en ${module}`,
          requiredPermission: `${module}.${action}`
        });
      }

      // Si llegamos aquí, el usuario tiene permisos
      req.userPermissions = permissions;
      next();

    } catch (error) {
      console.error('Error checking permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Middleware para verificar si el usuario tiene acceso a cualquier acción de un módulo
 * @param {string} module - El módulo que se quiere acceder
 * @returns {Function} Middleware function
 */
export const checkModuleAccess = (module) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Si es admin, permitir todo
      if (userRole === 'admin') {
        return next();
      }

      // Obtener el rol del usuario con sus permisos
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              permissions: true,
              status: true
            }
          }
        }
      });

      if (!user || !user.role || user.role.status !== 'Active') {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      const permissions = user.role.permissions || {};
      const modulePermissions = permissions[module];

      // Verificar si tiene al menos un permiso en el módulo
      if (!modulePermissions || !Object.values(modulePermissions).some(Boolean)) {
        return res.status(403).json({
          success: false,
          message: `No tienes acceso al módulo ${module}`
        });
      }

      req.userPermissions = permissions;
      next();

    } catch (error) {
      console.error('Error checking module access:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

/**
 * Función helper para verificar permisos en controladores
 * @param {Object} permissions - Permisos del usuario
 * @param {string} module - Módulo a verificar
 * @param {string} action - Acción a verificar
 * @returns {boolean} True si tiene permisos, false si no
 */
export const hasPermission = (permissions, module, action) => {
  if (!permissions || !permissions[module]) {
    return false;
  }
  return Boolean(permissions[module][action]);
};

/**
 * Función helper para obtener todos los módulos a los que tiene acceso un usuario
 * @param {Object} permissions - Permisos del usuario
 * @returns {Array} Array de módulos con acceso
 */
export const getAccessibleModules = (permissions) => {
  if (!permissions) return [];
  
  return Object.keys(permissions).filter(module => {
    const modulePermissions = permissions[module];
    return Object.values(modulePermissions).some(Boolean);
  });
};