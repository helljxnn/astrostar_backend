import { TeamsRepository } from "../repository/teams.repository.js";

export class TeamsService {
  constructor() {
    this.teamsRepository = new TeamsRepository();
  }

  normalizeTeamType(type) {
    if (typeof type !== 'string') return 'Temporal';
    const normalized = type.toLowerCase();
    return normalized === 'fundacion' ? 'Fundacion' : 'Temporal';
  }

  validateTeamConsistency(teamData) {
    const { entrenadorData, deportistas, teamType } = teamData;
    
    if (entrenadorData && deportistas.length > 0) {
      if (entrenadorData.type !== deportistas[0].type) {
        throw new Error('El entrenador y los deportistas deben ser del mismo tipo (fundación o temporales)');
      }
    }
    
    if (deportistas.length > 0) {
      const firstType = deportistas[0].type;
      const hasMixedTypes = deportistas.some(d => d.type !== firstType);
      
      if (hasMixedTypes) {
        throw new Error('No se pueden mezclar deportistas de fundación y temporales en el mismo equipo');
      }
    }

    if (teamType === 'temporal' || teamType === 'Temporal') {
      if (!teamData.categoria?.trim()) {
        throw new Error('La categoría es obligatoria para equipos temporales');
      }
    }

    if ((teamType === 'fundacion' || teamType === 'Fundacion') && deportistas.length > 0) {
      const firstCategory = deportistas[0].categoria;
      const hasMixedCategories = deportistas.some(d => d.categoria !== firstCategory);
      
      if (hasMixedCategories) {
        throw new Error('Todos los deportistas de fundación deben ser de la misma categoría deportiva');
      }
    }
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
      const normalizedTeamType = this.normalizeTeamType(teamData.teamType);
      teamData.teamType = normalizedTeamType;

      const existingTeam = await this.teamsRepository.findByName(teamData.nombre);
      if (existingTeam) {
        throw new Error(`El equipo "${teamData.nombre}" ya está registrado.`);
      }

      if (!teamData.deportistasIds || teamData.deportistasIds.length === 0) {
        throw new Error("El equipo debe tener al menos un deportista.");
      }

      this.validateTeamConsistency(teamData);

      const newTeam = await this.teamsRepository.create(teamData);

      return {
        success: true,
        data: newTeam,
        message: `Equipo "${teamData.nombre}" creado exitosamente.`,
      };
    } catch (error) {
      if (error.message.includes('ya está asignado')) {
        throw new Error(`Error de asignación: ${error.message}`);
      }
      if (error.message.includes('no existe')) {
        throw new Error(`Error de datos: ${error.message}`);
      }
      if (error.message.includes('ya está registrado') || 
          error.message.includes('deben ser del mismo tipo') ||
          error.message.includes('No se pueden mezclar') ||
          error.message.includes('misma categoría')) {
        throw error;
      }
      
      console.error('Error no manejado en createTeam:', error);
      throw new Error('Error interno del servidor al crear equipo');
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

      if (updateData.deportistasIds && updateData.deportistasIds.length === 0) {
        throw new Error("El equipo debe tener al menos un deportista.");
      }

      this.validateTeamConsistency(updateData);

      const updatedTeam = await this.teamsRepository.update(id, updateData);

      return {
        success: true,
        data: updatedTeam,
        message: `Equipo "${updatedTeam.nombre}" actualizado exitosamente.`,
      };
    } catch (error) {
      if (error.message.includes('ya está asignado')) {
        throw new Error(`Error de asignación: ${error.message}`);
      }
      if (error.message.includes('no existe')) {
        throw new Error(`Error de datos: ${error.message}`);
      }
      if (error.message.includes('ya está registrado') || 
          error.message.includes('deben ser del mismo tipo') ||
          error.message.includes('No se pueden mezclar') ||
          error.message.includes('misma categoría')) {
        throw error;
      }
      
      console.error('Error no manejado en updateTeam:', error);
      throw new Error('Error interno del servidor al actualizar equipo');
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