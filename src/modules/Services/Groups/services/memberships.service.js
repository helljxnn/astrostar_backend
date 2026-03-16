import { MembershipRepository } from "../repository/memberships.repository.js";
import { GroupRepository } from "../repository/groups.repository.js";

export class MembershipService {
  constructor() {
    this.membershipRepository = new MembershipRepository();
    this.groupRepository = new GroupRepository();
  }

  /**
   * Agregar miembro a un grupo
   */
  async addMember(groupId, memberData) {
    try {
      // Validar que el grupo existe
      const groupExists = await this.membershipRepository.groupExists(groupId);
      if (!groupExists) {
        throw new Error(`El grupo con ID ${groupId} no existe.`);
      }

      // Validar que la deportista existe
      const athleteExists = await this.membershipRepository.athleteExists(
        memberData.athleteId,
      );
      if (!athleteExists) {
        throw new Error(
          `La deportista con ID ${memberData.athleteId} no existe.`,
        );
      }

      // Validar que la deportista no esté en otro grupo activo
      const activeGroup = await this.groupRepository.athleteHasActiveGroup(
        memberData.athleteId,
      );
      if (activeGroup) {
        throw new Error(
          `La deportista ya está inscrita en el grupo activo "${activeGroup.group.name}".`,
        );
      }

      // Validar cupo disponible
      const group = await this.groupRepository.findById(groupId);
      const activeMembers =
        await this.groupRepository.countActiveMembers(groupId);

      if (activeMembers >= group.maxCapacity) {
        throw new Error(
          `El grupo "${group.name}" ha alcanzado su cupo máximo de ${group.maxCapacity} miembros.`,
        );
      }

      const membership = await this.membershipRepository.create({
        groupId: parseInt(groupId),
        athleteId: parseInt(memberData.athleteId),
        startDate: memberData.startDate
          ? new Date(memberData.startDate)
          : new Date(),
        status: "ACTIVE",
      });

      return {
        success: true,
        data: membership,
        message: "Miembro agregado al grupo exitosamente.",
      };
    } catch (error) {
      console.error("Service error - addMember:", error);
      throw error;
    }
  }

  /**
   * Actualizar membresía (cambio de nivel con fecha efectiva)
   */
  async updateMembership(id, membershipData) {
    try {
      const existingMembership = await this.membershipRepository.findById(id);
      if (!existingMembership) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la membresía con ID ${id}.`,
        };
      }

      const updateData = {};
      if (membershipData.status) updateData.status = membershipData.status;
      if (membershipData.endDate)
        updateData.endDate = new Date(membershipData.endDate);

      const updatedMembership = await this.membershipRepository.update(
        id,
        updateData,
      );

      return {
        success: true,
        data: updatedMembership,
        message: "Membresía actualizada exitosamente.",
      };
    } catch (error) {
      console.error("Service error - updateMembership:", error);
      throw error;
    }
  }

  /**
   * Eliminar membresía (cambiar a INACTIVE)
   */
  async removeMember(id) {
    try {
      const existingMembership = await this.membershipRepository.findById(id);
      if (!existingMembership) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró la membresía con ID ${id}.`,
        };
      }

      if (existingMembership.status === "INACTIVE") {
        return {
          success: false,
          statusCode: 400,
          message: "La membresía ya está inactiva.",
        };
      }

      await this.membershipRepository.delete(id);

      return {
        success: true,
        message: "Miembro removido del grupo exitosamente.",
      };
    } catch (error) {
      console.error("Service error - removeMember:", error);
      throw error;
    }
  }

  /**
   * Obtener membresías de un grupo
   */
  async getGroupMembers(groupId, status = null) {
    try {
      const groupExists = await this.membershipRepository.groupExists(groupId);
      if (!groupExists) {
        return {
          success: false,
          statusCode: 404,
          message: `El grupo con ID ${groupId} no existe.`,
        };
      }

      const memberships = await this.membershipRepository.findByGroup(
        groupId,
        status,
      );

      return {
        success: true,
        data: memberships,
      };
    } catch (error) {
      console.error("Service error - getGroupMembers:", error);
      throw error;
    }
  }

  /**
   * Obtener historial de grupos de una deportista
   */
  async getAthleteGroups(athleteId) {
    try {
      const athleteExists =
        await this.membershipRepository.athleteExists(athleteId);
      if (!athleteExists) {
        return {
          success: false,
          statusCode: 404,
          message: `La deportista con ID ${athleteId} no existe.`,
        };
      }

      const memberships =
        await this.membershipRepository.findByAthlete(athleteId);

      return {
        success: true,
        data: memberships,
      };
    } catch (error) {
      console.error("Service error - getAthleteGroups:", error);
      throw error;
    }
  }
}

