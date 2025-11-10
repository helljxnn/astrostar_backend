import { TeamsRepository } from "../repository/teams.repository.js";

export class TeamsService {
  constructor() {
    this.teamsRepository = new TeamsRepository();
  }

  async getAllTeams({
    page = 1,
    limit = 10,
    search = "",
    status,
    teamType,
  }) {
    try {
      const result = await this.teamsRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        teamType,
      });

      return {
        success: true,
        data: result.teams,
        pagination: result.pagination,
      };
    } catch (error) {
      throw error;
    }
  }

  async getTeamById(id) {
    try {
      const team = await this.teamsRepository.findById(id);

      if (!team) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el equipo con ID ${id}.`,
        };
      }

      return {
        success: true,
        data: team,
      };
    } catch (error) {
      throw error;
    }
  }

  async createTeam(teamData) {
    try {
      // Verificar si el nombre del equipo ya existe
      const existingTeam = await this.teamsRepository.findByName(teamData.nombre);
      if (existingTeam) {
        throw new Error(
          `El equipo "${teamData.nombre}" ya está registrado.`
        );
      }

      // Validar que tenga al menos un deportista
      if (!teamData.deportistasIds || teamData.deportistasIds.length === 0) {
        throw new Error("El equipo debe tener al menos un deportista.");
      }

      const newTeam = await this.teamsRepository.create(teamData);

      return {
        success: true,
        data: newTeam,
        message: `Equipo "${teamData.nombre}" creado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async updateTeam(id, updateData) {
    try {
      const existingTeam = await this.teamsRepository.findById(id);
      if (!existingTeam) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el equipo con ID ${id}.`,
        };
      }

      // Verificar si el nombre ya está en uso por otro equipo
      if (updateData.nombre && updateData.nombre !== existingTeam.nombre) {
        const existingByName = await this.teamsRepository.findByName(
          updateData.nombre,
          id
        );
        if (existingByName) {
          throw new Error(
            `El nombre "${updateData.nombre}" ya está registrado por otro equipo.`
          );
        }
      }

      // Validar que tenga al menos un deportista
      if (updateData.deportistasIds && updateData.deportistasIds.length === 0) {
        throw new Error("El equipo debe tener al menos un deportista.");
      }

      const updatedTeam = await this.teamsRepository.update(id, updateData);

      return {
        success: true,
        data: updatedTeam,
        message: `Equipo "${updatedTeam.nombre}" actualizado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteTeam(id) {
    try {
      const teamToDelete = await this.teamsRepository.findById(id);
      if (!teamToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el equipo con ID ${id}.`,
        };
      }

      const deletedTeam = await this.teamsRepository.delete(id);

      return {
        success: true,
        message: `Equipo "${deletedTeam.nombre}" eliminado exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async changeTeamStatus(id, status) {
    try {
      const existingTeam = await this.teamsRepository.findById(id);
      if (!existingTeam) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el equipo con ID ${id}.`,
        };
      }

      const updatedTeam = await this.teamsRepository.changeStatus(id, status);

      return {
        success: true,
        data: updatedTeam,
        message: `Estado del equipo "${updatedTeam.nombre}" cambiado a "${status}" exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async checkNameAvailability(name, excludeId = null) {
    try {
      const existingTeam = await this.teamsRepository.findByName(name, excludeId);

      if (!existingTeam) {
        return { available: true };
      }

      return {
        available: false,
        message: `El nombre "${name}" ya está registrado.`,
      };
    } catch (error) {
      throw error;
    }
  }

  async getTeamStats() {
    try {
      const stats = await this.teamsRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw error;
    }
  }
}