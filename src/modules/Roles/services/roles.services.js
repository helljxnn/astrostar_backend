import { RoleRepository } from "../repository/roles.repository.js";

export class RoleService {
  constructor() {
    this.roleRepository = new RoleRepository();
  }

  // Get all roles with pagination and search
  async getAllRoles({ page = 1, limit = 10, search = "" }) {
    try {
      const result = await this.roleRepository.findAll({
        page,
        limit,
        search,
      });

      return result;
    } catch (error) {
      console.error("Service error - getAllRoles:", error);
      throw error;
    }
  }

  // Create a new role
  async createRole(roleData) {
    try {
      // Check if role name already exists
      const existingRole = await this.roleRepository.findByName(roleData.name);
      if (existingRole) {
        throw new Error(
          `El nombre "${roleData.name}" ya está en uso. Elija otro nombre.`
        );
      }

      const newRole = await this.roleRepository.create(roleData);
      return newRole;
    } catch (error) {
      console.error("Service error - createRole:", error);
      throw error;
    }
  }

  // Get role by ID
  async getRoleById(id) {
    try {
      const role = await this.roleRepository.findById(id);
      return role;
    } catch (error) {
      console.error("Service error - getRoleById:", error);
      throw error;
    }
  }

  // Update role
  async updateRole(id, roleData) {
    try {
      // Check if role exists
      const existingRole = await this.roleRepository.findById(id);
      if (!existingRole) {
        return null;
      }

      // Verificar si es el rol de Administrador y se está intentando cambiar el nombre
      if (
        existingRole.name === "Administrador" &&
        roleData.name &&
        roleData.name !== "Administrador"
      ) {
        throw new Error(
          'El rol "Administrador" es un rol del sistema y su nombre no puede ser modificado por razones de seguridad.'
        );
      }

      // If name is being changed, check if new name already exists
      if (roleData.name && roleData.name !== existingRole.name) {
        const nameExists = await this.roleRepository.findByName(roleData.name);
        if (nameExists) {
          throw new Error(
            `El nombre "${roleData.name}" ya está en uso. Elija otro nombre.`
          );
        }
      }

      const updatedRole = await this.roleRepository.update(id, roleData);
      return updatedRole;
    } catch (error) {
      console.error("Service error - updateRole:", error);
      throw error;
    }
  }

  // Delete role
  async deleteRole(id) {
    try {
      // Obtener información del rol antes de intentar eliminarlo
      const roleToDelete = await this.roleRepository.findById(id);

      if (!roleToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el rol con ID ${id}. Verifique que el rol existe y que el ID es correcto.`,
        };
      }

      const deleted = await this.roleRepository.delete(id);

      if (deleted) {
        return {
          success: true,
          message: `El rol "${roleToDelete.name}" ha sido eliminado exitosamente.`,
        };
      } else {
        return {
          success: false,
          statusCode: 404,
          message: `No se pudo eliminar el rol "${roleToDelete.name}". Verifique que el rol existe.`,
        };
      }
    } catch (error) {
      console.error("Service error - deleteRole:", error);

      // Si el error contiene información específica, la pasamos tal como está
      if (
        error.message.includes("Administrador") ||
        error.message.includes("Activo") ||
        error.message.includes("está asignado a") ||
        error.message.includes("usuario")
      ) {
        throw error;
      }

      // Para otros errores, proporcionamos un mensaje genérico
      throw new Error(
        "Error interno al eliminar el rol. Por favor, inténtelo de nuevo."
      );
    }
  }

  // Get role statistics
  async getRoleStats() {
    try {
      const stats = await this.roleRepository.getStats();
      return stats;
    } catch (error) {
      console.error("Service error - getRoleStats:", error);
      throw error;
    }
  }

  // Validate role permissions structure
  validatePermissions(permissions) {
    if (!permissions || typeof permissions !== "object") {
      return { isValid: false, message: "Permissions must be an object" };
    }

    // Expected structure: { "ModuleName": { "ActionName": boolean } }
    for (const [moduleName, modulePermissions] of Object.entries(permissions)) {
      if (typeof modulePermissions !== "object") {
        return {
          isValid: false,
          message: `Permissions for module "${moduleName}" must be an object`,
        };
      }

      for (const [actionName, hasPermission] of Object.entries(
        modulePermissions
      )) {
        if (typeof hasPermission !== "boolean") {
          return {
            isValid: false,
            message: `Permission "${actionName}" in module "${moduleName}" must be a boolean`,
          };
        }
      }
    }

    return { isValid: true };
  }

  // Get available modules and actions for permissions
  getAvailablePermissions() {
    return {
      modules: [
        {
          name: "Users",
          icon: "👤",
          actions: ["Create", "Read", "Update", "Delete"],
        },
        {
          name: "Roles",
          icon: "🛡️",
          actions: ["Create", "Read", "Update", "Delete"],
        },
        {
          name: "Athletes",
          icon: "🏃",
          actions: ["Create", "Read", "Update", "Delete"],
        },
        {
          name: "Events",
          icon: "📅",
          actions: ["Create", "Read", "Update", "Delete"],
        },
        {
          name: "Services",
          icon: "⚙️",
          actions: ["Create", "Read", "Update", "Delete"],
        },
      ],
    };
  }

  // Check if role name exists (for real-time validation)
  async checkRoleNameExists(name, excludeId = null) {
    try {
      const existingRole = await this.roleRepository.findByNameCaseInsensitive(name);
      
      // Si encontramos un rol y no es el que estamos excluyendo
      if (existingRole && existingRole.id !== excludeId) {
        return existingRole;
      }
      
      return null;
    } catch (error) {
      console.error('Service error - checkRoleNameExists:', error);
      throw error;
    }
  }
}
