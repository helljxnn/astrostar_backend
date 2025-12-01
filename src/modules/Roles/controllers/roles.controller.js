import { RoleService } from '../services/roles.services.js';

export class RoleController {
  constructor() {
    this.roleService = new RoleService();
  }

  // Get all roles
  getAllRoles = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      
      const result = await this.roleService.getAllRoles({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      const totalRoles = result.pagination.total;
      const currentPage = result.pagination.page;
      const totalPages = result.pagination.pages;
      
      let message = '';
      if (totalRoles === 0) {
        message = 'No se encontraron roles en el sistema.';
      } else if (totalRoles === 1) {
        message = 'Se encontró 1 rol en el sistema.';
      } else {
        message = `Se encontraron ${totalRoles} roles en el sistema (página ${currentPage} de ${totalPages}).`;
      }

      res.json({
        success: true,
        data: result.roles,
        pagination: result.pagination,
        message: message
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching roles',
        error: error.message
      });
    }
  };

  // Create a new role
  createRole = async (req, res) => {
    try {
      const { name, description, permissions } = req.body;

      const newRole = await this.roleService.createRole({
        name: name.trim(),
        description: description.trim(),
        permissions: permissions || {}
      });

      res.status(201).json({
        success: true,
        data: newRole,
        message: `El rol "${newRole.name}" ha sido creado exitosamente`
      });
    } catch (error) {
      console.error('Error creating role:', error);
      
      // Error de nombre duplicado de Prisma
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: `El nombre "${req.body.name}" ya está en uso. Elija otro nombre.`
        });
      }

      // Error personalizado del servicio
      if (error.message.includes('ya existe')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear el rol. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Get role by ID
  getRoleById = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'El ID del rol proporcionado no es válido. Debe ser un número entero positivo.'
        });
      }

      const role = await this.roleService.getRoleById(parseInt(id));

      if (!role) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el rol con ID ${id}. Verifique que el rol existe y que el ID es correcto.`
        });
      }

      res.json({
        success: true,
        data: role,
        message: `Información del rol "${role.name}" obtenida exitosamente`
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el rol. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Update role
  updateRole = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;

      const updatedRole = await this.roleService.updateRole(parseInt(id), {
        name: name ? name.trim() : undefined,
        description: description ? description.trim() : undefined,
        permissions
      });

      if (!updatedRole) {
        return res.status(404).json({
          success: false,
          message: `No se encontró el rol con ID ${id}. Verifique que el rol existe y que el ID es correcto.`
        });
      }

      res.json({
        success: true,
        data: updatedRole,
        message: `El rol "${updatedRole.name}" ha sido actualizado exitosamente`
      });
    } catch (error) {
      console.error('Error updating role:', error);
      
      // Error de nombre duplicado de Prisma
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: `El nombre "${req.body.name}" ya está en uso. Elija otro nombre.`
        });
      }

      // Error personalizado del servicio
      if (error.message.includes('ya existe')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Error de rol protegido
      if (error.message.includes('Administrador')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar el rol. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Delete role
  deleteRole = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'El ID del rol proporcionado no es válido. Debe ser un número entero positivo.'
        });
      }

      const result = await this.roleService.deleteRole(parseInt(id));

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      
      // Error de restricción de clave foránea (rol en uso) - fallback por si no se detecta antes
      if (error.code === 'P2003') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar este rol porque está siendo utilizado por uno o más usuarios. Para eliminarlo, primero debe reasignar esos usuarios a otro rol.'
        });
      }

      // Manejar errores específicos de restricciones
      if (error.message.includes('Administrador') && error.message.includes('sistema')) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      if (error.message.includes('está asignado a') || (error.message.includes('usuario') && !error.message.includes('interno'))) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar el rol. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Get role statistics
  getRoleStats = async (req, res) => {
    try {
      const stats = await this.roleService.getRoleStats();

      res.json({
        success: true,
        data: stats,
        message: `Estadísticas de roles obtenidas exitosamente: ${stats.total} roles en total.`
      });
    } catch (error) {
      console.error('Error fetching role stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener las estadísticas de roles. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Get available permissions structure
  getAvailablePermissions = async (req, res) => {
    try {
      const permissions = this.roleService.getAvailablePermissions();

      res.json({
        success: true,
        data: permissions,
        message: `Estructura de permisos disponibles obtenida exitosamente. Se encontraron ${permissions.modules.length} módulos con permisos configurables.`
      });
    } catch (error) {
      console.error('Error fetching available permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener la estructura de permisos. Por favor, inténtelo de nuevo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  // Check if role name is available
  checkRoleNameAvailability = async (req, res) => {
    try {
      const { name } = req.query;
      const { excludeId } = req.query; // Para excluir el rol actual al editar

      if (!name || name.trim().length < 2) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: 'El nombre debe tener al menos 2 caracteres.'
          }
        });
      }

      const existingRole = await this.roleService.checkRoleNameExists(name.trim(), excludeId ? parseInt(excludeId) : null);

      if (existingRole) {
        return res.json({
          success: true,
          data: {
            available: false,
            message: `El nombre "${name}" ya está en uso.`,
            existingRole: existingRole.name
          }
        });
      }

      res.json({
        success: true,
        data: {
          available: true,
          message: 'Nombre disponible'
        }
      });
    } catch (error) {
      console.error('Error checking role name availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar disponibilidad del nombre.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };


}