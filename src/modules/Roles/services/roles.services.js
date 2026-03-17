import { RoleRepository } from "../repository/roles.repository.js";
import {
  normalizeRolePermissions,
  validateRolePermissionsShape,
  ROLE_MODULES,
  ROLE_ACTIONS,
  MODULE_ALLOWED_ACTIONS,
} from "../config/permissions.config.js";

const PROTECTED_SYSTEM_ROLES = new Set([
  "administrador",
  "deportista",
  "entrenador",
  "profesionaldelasalud",
  "profesionaldesalud",
]);

const normalizeRoleName = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

const isProtectedSystemRole = (roleName = "") =>
  PROTECTED_SYSTEM_ROLES.has(normalizeRoleName(roleName));

export class RoleService {
  constructor() {
    this.roleRepository = new RoleRepository();
  }

  async getAllRoles({ page = 1, limit = 10, search = "" }) {
    try {
      return await this.roleRepository.findAll({ page, limit, search });
    } catch (error) {
      console.error("Service error - getAllRoles:", error);
      throw error;
    }
  }

  async createRole(roleData) {
    try {
      const existingRole = await this.roleRepository.findByNameCaseInsensitive(
        roleData.name,
      );
      if (existingRole) {
        throw new Error(`El nombre "${roleData.name}" ya esta en uso. Elija otro nombre.`);
      }

      const validationResult = validateRolePermissionsShape(roleData.permissions || {});
      if (!validationResult.isValid) {
        throw new Error(validationResult.message);
      }

      return await this.roleRepository.create({
        ...roleData,
        permissions: normalizeRolePermissions(roleData.permissions || {}),
      });
    } catch (error) {
      console.error("Service error - createRole:", error);
      throw error;
    }
  }

  async getRoleById(id) {
    try {
      return await this.roleRepository.findById(id);
    } catch (error) {
      console.error("Service error - getRoleById:", error);
      throw error;
    }
  }

  async updateRole(id, roleData) {
    try {
      const existingRole = await this.roleRepository.findById(id);
      if (!existingRole) return null;

      if (isProtectedSystemRole(existingRole.name)) {
        throw new Error(
          `El rol "${existingRole.name}" es un rol base del sistema y no puede ser editado ni cambiar sus permisos.`,
        );
      }

      if (roleData.name && roleData.name !== existingRole.name) {
        const nameExists = await this.roleRepository.findByName(roleData.name);
        if (nameExists) {
          throw new Error(`El nombre "${roleData.name}" ya esta en uso. Elija otro nombre.`);
        }
      }

      const payload = { ...roleData };
      if (roleData.permissions) {
        const validationResult = validateRolePermissionsShape(roleData.permissions);
        if (!validationResult.isValid) {
          throw new Error(validationResult.message);
        }
        payload.permissions = normalizeRolePermissions(roleData.permissions);
      }

      return await this.roleRepository.update(id, payload);
    } catch (error) {
      console.error("Service error - updateRole:", error);
      throw error;
    }
  }

  async deleteRole(id) {
    try {
      const roleToDelete = await this.roleRepository.findById(id);
      if (!roleToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontro el rol con ID ${id}. Verifique que el rol existe y que el ID es correcto.`,
        };
      }

      if (isProtectedSystemRole(roleToDelete.name)) {
        return {
          success: false,
          statusCode: 403,
          message: `El rol "${roleToDelete.name}" es un rol base del sistema y no puede ser eliminado.`,
        };
      }

      const deleted = await this.roleRepository.delete(id);
      if (deleted) {
        return {
          success: true,
          message: `El rol "${roleToDelete.name}" ha sido eliminado exitosamente.`,
        };
      }

      return {
        success: false,
        statusCode: 404,
        message: `No se pudo eliminar el rol "${roleToDelete.name}". Verifique que el rol existe.`,
      };
    } catch (error) {
      console.error("Service error - deleteRole:", error);
      if (
        error.message.includes("Administrador") ||
        error.message.includes("esta asignado a") ||
        error.message.includes("usuario")
      ) {
        throw error;
      }
      throw new Error("Error interno al eliminar el rol. Por favor, intentelo de nuevo.");
    }
  }

  async getRoleStats() {
    try {
      return await this.roleRepository.getStats();
    } catch (error) {
      console.error("Service error - getRoleStats:", error);
      throw error;
    }
  }

  validatePermissions(permissions) {
    return validateRolePermissionsShape(permissions);
  }

  getAvailablePermissions() {
    return {
      modules: ROLE_MODULES,
      actions: ROLE_ACTIONS,
      moduleAllowedActions: MODULE_ALLOWED_ACTIONS,
    };
  }

  async checkRoleNameExists(name, excludeId = null) {
    try {
      const existingRole = await this.roleRepository.findByNameCaseInsensitive(name);
      const excludeIdNum = excludeId ? parseInt(excludeId, 10) : null;
      if (existingRole && existingRole.id !== excludeIdNum) {
        return existingRole;
      }
      return null;
    } catch (error) {
      console.error("Service error - checkRoleNameExists:", error);
      throw error;
    }
  }
}
