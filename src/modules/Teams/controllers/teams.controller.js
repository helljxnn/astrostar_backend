import { TeamsService } from "../services/teams.service.js";

export class TeamsController {
  constructor() {
    this.teamsService = new TeamsService();
  }

  getAllTeams = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        teamType,
      } = req.query;

      const result = await this.teamsService.getAllTeams({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        teamType,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} equipos.`,
      });
    } catch (error) {
      console.error("Error in getAllTeams controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener equipos",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getTeamById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de equipo inválido",
        });
      }

      const result = await this.teamsService.getTeamById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: "Equipo encontrado exitosamente.",
      });
    } catch (error) {
      console.error("Error in getTeamById controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener equipo",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  createTeam = async (req, res) => {
    try {
      console.log("📥 Datos recibidos en createTeam:", req.body);

      const result = await this.teamsService.createTeam(req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in createTeam controller:", error);
      console.error("Error stack:", error.stack);

      if (error.message.includes('ya está registrado') ||
          error.message.includes('Debe seleccionar') ||
          error.message.includes('deben ser del mismo tipo') ||
          error.message.includes('No se pueden mezclar') ||
          error.message.includes('misma categoría')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('ya está asignado')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear equipo",
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  };

  updateTeam = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de equipo inválido",
        });
      }

      console.log("📥 Datos recibidos en updateTeam:", {
        id,
        data: req.body,
      });

      const result = await this.teamsService.updateTeam(id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in updateTeam controller:", error);

      if (error.message.includes('ya está registrado') ||
          error.message.includes('Debe seleccionar') ||
          error.message.includes('deben ser del mismo tipo') ||
          error.message.includes('No se pueden mezclar') ||
          error.message.includes('misma categoría')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('ya está asignado')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar equipo",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  deleteTeam = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de equipo inválido",
        });
      }

      const result = await this.teamsService.deleteTeam(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in deleteTeam controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar equipo",
      });
    }
  };

  changeTeamStatus = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de equipo inválido",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "El estado es requerido",
        });
      }

      const result = await this.teamsService.changeTeamStatus(id, status);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in changeTeamStatus controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al cambiar estado",
      });
    }
  };

  checkNameAvailability = async (req, res) => {
    try {
      const { name, excludeId } = req.query;

      console.log("🔍 Checking name availability:", { name, excludeId });

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "El nombre del equipo es requerido",
        });
      }

      const result = await this.teamsService.checkNameAvailability(name, excludeId);

      res.json({
        success: true,
        available: result.available,
        message: result.available ? "Nombre disponible" : result.message,
      });
    } catch (error) {
      console.error("❌ Error checking name availability:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar disponibilidad",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getTeamStats = async (req, res) => {
    try {
      const result = await this.teamsService.getTeamStats();

      res.json({
        success: true,
        data: result.data,
        message: "Estadísticas obtenidas exitosamente.",
      });
    } catch (error) {
      console.error("Error in getTeamStats controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getSportsCategories = async (req, res) => {
    try {
      const result = await this.teamsService.getSportsCategories();

      res.json({
        success: true,
        data: result.data,
        message: "Categorías deportivas obtenidas exitosamente.",
      });
    } catch (error) {
      console.error("Error in getSportsCategories controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener categorías",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkDuplicateTemporalTeam = async (req, res) => {
    try {
      const { athleteIds, trainerId, excludeId } = req.query;
      
      // Si no hay athleteIds ni trainerId, devolver error
      if (!athleteIds && !trainerId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere al menos athleteIds o trainerId",
        });
      }

      const athleteIdsArray = athleteIds 
        ? (Array.isArray(athleteIds) ? athleteIds : athleteIds.split(',').map(id => parseInt(id)))
        : [];
      const trainerIdNum = trainerId ? parseInt(trainerId) : null;
      const excludeIdNum = excludeId ? parseInt(excludeId) : null;

      const result = await this.teamsService.checkDuplicateTemporalTeam(athleteIdsArray, trainerIdNum, excludeIdNum);

      res.json({
        success: true,
        data: result,
        message: result.isDuplicate ? "Equipo duplicado encontrado" : "No hay duplicados",
      });
    } catch (error) {
      console.error("Error in checkDuplicateTemporalTeam controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al verificar duplicados",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkTemporalPersonAvailability = async (req, res) => {
    try {
      const { personId, excludeTeamId } = req.query;

      console.log('🔍 [CONTROLLER] Verificando disponibilidad:', { personId, excludeTeamId });

      if (!personId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere personId",
        });
      }

      const personIdNum = parseInt(personId);
      const excludeTeamIdNum = excludeTeamId ? parseInt(excludeTeamId) : null;

      const result = await this.teamsService.checkTemporalPersonAvailability(personIdNum, excludeTeamIdNum);

      console.log('📡 [CONTROLLER] Resultado:', result);

      res.json({
        success: true,
        available: result.available,
        message: result.message,
        teamName: result.teamName,
      });
    } catch (error) {
      console.error("❌ [CONTROLLER] Error in checkTemporalPersonAvailability:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al verificar disponibilidad",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkTeamAssignedToEvents = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de equipo inválido",
        });
      }

      const result = await this.teamsService.checkTeamAssignedToEvents(id);

      res.json({
        success: true,
        isAssigned: result.isAssigned,
        count: result.count,
        events: result.events,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in checkTeamAssignedToEvents controller:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar asignación a eventos",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener todos los equipos para reporte (sin paginación)
   */
  getAllTeamsForReport = async (req, res) => {
    try {
      const {
        search = "",
        status,
        teamType,
      } = req.query;

      const result = await this.teamsService.getAllTeamsForReport({
        search,
        status,
        teamType,
      });

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} equipos para el reporte.`,
      });
    } catch (error) {
      console.error("Error in getAllTeamsForReport controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener equipos para reporte",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default new TeamsController();
