import { GroupRepository } from "../repository/groups.repository.js";

export class GroupService {
  constructor() {
    this.groupRepository = new GroupRepository();
  }

  /**
   * Obtener todos los grupos con filtros
   */
  async getAllGroups({
    page = 1,
    limit = 10,
    search = "",
    status = "",
    level = "",
  }) {
    try {
      const result = await this.groupRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        level,
      });

      return result;
    } catch (error) {
      console.error("Service error - getAllGroups:", error);
      throw error;
    }
  }

  /**
   * Obtener grupo por ID
   */
  async getGroupById(id) {
    try {
      const group = await this.groupRepository.findById(id);

      if (!group) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el grupo con ID ${id}.`,
        };
      }

      return {
        success: true,
        data: group,
      };
    } catch (error) {
      console.error("Service error - getGroupById:", error);
      throw error;
    }
  }

  /**
   * Crear grupo
   */
  async createGroup(groupData) {
    try {
      // Validar que el profesor existe
      const teacherExists = await this.groupRepository.teacherExists(
        groupData.teacherId,
      );
      if (!teacherExists) {
        throw new Error(`El profesor con ID ${groupData.teacherId} no existe.`);
      }

      // Validar cupo máximo
      if (groupData.maxCapacity < 1) {
        throw new Error("El cupo máximo debe ser al menos 1.");
      }

      const group = await this.groupRepository.create({
        name: groupData.name.trim(),
        level: groupData.level,
        teacherId: parseInt(groupData.teacherId),
        maxCapacity: parseInt(groupData.maxCapacity),
        status: groupData.status || "ACTIVE",
      });

      return {
        success: true,
        data: group,
        message: `Grupo "${group.name}" creado exitosamente.`,
      };
    } catch (error) {
      console.error("Service error - createGroup:", error);
      throw error;
    }
  }

  /**
   * Actualizar grupo
   */
  async updateGroup(id, groupData) {
    try {
      // Verificar que el grupo existe
      const existingGroup = await this.groupRepository.findById(id);
      if (!existingGroup) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el grupo con ID ${id}.`,
        };
      }

      // Si se cambia el profesor, validar que existe
      if (groupData.teacherId) {
        const teacherExists = await this.groupRepository.teacherExists(
          groupData.teacherId,
        );
        if (!teacherExists) {
          throw new Error(
            `El profesor con ID ${groupData.teacherId} no existe.`,
          );
        }
      }

      // Si se cambia el cupo, validar que no sea menor a los miembros actuales
      if (groupData.maxCapacity) {
        const activeMembers = await this.groupRepository.countActiveMembers(id);
        if (parseInt(groupData.maxCapacity) < activeMembers) {
          throw new Error(
            `No se puede reducir el cupo a ${groupData.maxCapacity}. El grupo tiene ${activeMembers} miembros activos.`,
          );
        }
      }

      const updateData = {};
      if (groupData.name) updateData.name = groupData.name.trim();
      if (groupData.level) updateData.level = groupData.level;
      if (groupData.teacherId)
        updateData.teacherId = parseInt(groupData.teacherId);
      if (groupData.maxCapacity)
        updateData.maxCapacity = parseInt(groupData.maxCapacity);
      if (groupData.status) updateData.status = groupData.status;

      const updatedGroup = await this.groupRepository.update(id, updateData);

      return {
        success: true,
        data: updatedGroup,
        message: `Grupo "${updatedGroup.name}" actualizado exitosamente.`,
      };
    } catch (error) {
      console.error("Service error - updateGroup:", error);
      throw error;
    }
  }

  /**
   * Actualizar estado del grupo
   */
  async updateGroupStatus(id, status) {
    try {
      const existingGroup = await this.groupRepository.findById(id);
      if (!existingGroup) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el grupo con ID ${id}.`,
        };
      }

      if (existingGroup.status === status) {
        return {
          success: false,
          statusCode: 400,
          message: `El grupo ya tiene el estado "${status}".`,
        };
      }

      const updatedGroup = await this.groupRepository.updateStatus(id, status);

      return {
        success: true,
        data: updatedGroup,
        message: `Estado del grupo actualizado a "${status}".`,
      };
    } catch (error) {
      console.error("Service error - updateGroupStatus:", error);
      throw error;
    }
  }

  /**
   * Eliminar grupo (archivado lógico)
   */
  async deleteGroup(id) {
    try {
      const existingGroup = await this.groupRepository.findById(id);
      if (!existingGroup) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el grupo con ID ${id}.`,
        };
      }

      if (existingGroup.status === "ARCHIVED") {
        return {
          success: false,
          statusCode: 400,
          message: "El grupo ya está archivado.",
        };
      }

      await this.groupRepository.delete(id);

      return {
        success: true,
        message: `El grupo "${existingGroup.name}" ha sido archivado exitosamente.`,
      };
    } catch (error) {
      console.error("Service error - deleteGroup:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de grupos
   */
  async getGroupStats() {
    try {
      const stats = await this.groupRepository.getStats();

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Service error - getGroupStats:", error);
      throw error;
    }
  }
}

