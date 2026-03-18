import { dashboardService } from "../services/dashboard.service.js";

/**
 * Controlador para el Dashboard
 * Centraliza todas las estadísticas del sistema
 */
export const dashboardController = {
  /**
   * GET /api/dashboard/overview
   * Obtener resumen general del dashboard
   */
  async getOverview(req, res) {
    try {
      const overview = await dashboardService.getOverview();

      return res.status(200).json({
        success: true,
        message: "Resumen del dashboard obtenido exitosamente",
        data: overview,
      });
    } catch (error) {
      console.error("Error en getOverview:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener resumen del dashboard",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * GET /api/dashboard/events
   * Obtener estadísticas de eventos para el dashboard
   */
  async getEventsStats(req, res) {
    try {
      const eventsStats = await dashboardService.getEventsStats();

      return res.status(200).json({
        success: true,
        message: "Estadísticas de eventos obtenidas exitosamente",
        data: eventsStats,
      });
    } catch (error) {
      console.error("Error en getEventsStats:", error);
      return res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al obtener estadísticas de eventos",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * GET /api/dashboard/athletes
   * Obtener estadísticas de deportistas para el dashboard
   */
  async getAthletesStats(req, res) {
    try {
      const athletesStats = await dashboardService.getAthletesStats();

      return res.status(200).json({
        success: true,
        message: "Estadísticas de deportistas obtenidas exitosamente",
        data: athletesStats,
      });
    } catch (error) {
      console.error("Error en getAthletesStats:", error);
      return res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al obtener estadísticas de deportistas",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * GET /api/dashboard/health
   * Obtener estadísticas de servicios de salud para el dashboard
   */
  async getHealthStats(req, res) {
    try {
      const healthStats = await dashboardService.getHealthStats();

      return res.status(200).json({
        success: true,
        message: "Estadísticas de servicios de salud obtenidas exitosamente",
        data: healthStats,
      });
    } catch (error) {
      console.error("Error en getHealthStats:", error);
      return res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al obtener estadísticas de servicios de salud",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },

  /**
   * GET /api/dashboard/donations
   * Obtener estadísticas de donaciones para el dashboard
   */
  async getDonationsStats(req, res) {
    try {
      const donationsStats = await dashboardService.getDonationsStats();

      return res.status(200).json({
        success: true,
        message: "Estadísticas de donaciones obtenidas exitosamente",
        data: donationsStats,
      });
    } catch (error) {
      console.error("Error en getDonationsStats:", error);
      return res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al obtener estadísticas de donaciones",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
};
