import { TeamsService } from "../services/teams.service.js";

export class TeamsController {
  constructor() {
    this.teamsService = new TeamsService();
  }

  /**
   * Obtener todos los equipos
   */
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

  /**
   * Obtener equipo por ID
   */
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

  /**
   * Crear nuevo equipo
   */
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

      if (error.message.includes("ya está registrado")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear equipo",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Actualizar equipo
   */
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

      if (error.message.includes("ya está registrado")) {
        return res.status(400).json({
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

  /**
   * Eliminar equipo
   */
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

  /**
   * Cambiar estado de equipo
   */
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

  /**
   * Verificar disponibilidad de nombre
   */
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

  /**
   * Obtener estadísticas de equipos
   */
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
}

export default new TeamsController();