import prisma from '../config/database.js';

// Middleware para verificar roles específicos
export const checkRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Obtener el rol del usuario con sus permisos
      const userWithRole = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              permissions: true
            }
          }
        }
      });

      if (!userWithRole || !userWithRole.role) {
        return res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado'
        });
      }

      const userRole = userWithRole.role;

      // Convertir requiredRoles a array si es string
      const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      // Verificar si el usuario tiene uno de los roles requeridos
      if (!rolesArray.includes(userRole.name)) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Rol insuficiente.',
          required: rolesArray,
          current: userRole.name
        });
      }

      // Agregar información del rol al request para uso posterior
      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Error en checkRole middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

// Middleware para verificar permisos granulares
export const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Obtener el rol del usuario con sus permisos
      const userWithRole = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              permissions: true
            }
          }
        }
      });

      if (!userWithRole || !userWithRole.role) {
        return res.status(403).json({
          success: false,
          message: 'Usuario sin rol asignado'
        });
      }

      const userRole = userWithRole.role;

      // Si es administrador, permitir todo
      if (userRole.name === 'Administrador') {
        req.userRole = userRole;
        return next();
      }

      // Verificar permisos específicos
      const permissions = userRole.permissions || {};
      const modulePermissions = permissions[module];

      if (!modulePermissions || !modulePermissions[action]) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. No tiene permisos para ${action} en ${module}`,
          required: { module, action },
          current: permissions
        });
      }

      // Agregar información del rol al request
      req.userRole = userRole;
      next();
    } catch (error) {
      console.error('Error en checkPermission middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

// Middleware para verificar si el usuario puede gestionar roles
export const canManageRoles = checkPermission('Roles', 'Update');

// Middleware para verificar si el usuario puede crear roles
export const canCreateRoles = checkPermission('Roles', 'Create');

// Middleware para verificar si el usuario puede eliminar roles
export const canDeleteRoles = checkPermission('Roles', 'Delete');

// Middleware para verificar si el usuario puede ver roles
export const canReadRoles = checkPermission('Roles', 'Read');
