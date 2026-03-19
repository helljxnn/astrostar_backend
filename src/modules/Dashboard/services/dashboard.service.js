import { dashboardRepository } from "../repository/dashboard.repository.js";

/**
 * Servicio para el Dashboard
 * Lógica de negocio para estadísticas del dashboard
 */
class DashboardService {
  constructor() {
    this.dashboardRepository = dashboardRepository;
  }

  /**
   * Obtener resumen general del dashboard
   */
  async getOverview() {
    try {
      const overview = await this.dashboardRepository.getOverview();
      return overview;
    } catch (error) {
      console.error("Error en DashboardService.getOverview:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de eventos
   */
  async getEventsStats() {
    try {
      const eventsStats = await this.dashboardRepository.getEventsStats();
      return eventsStats;
    } catch (error) {
      console.error("Error en DashboardService.getEventsStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de deportistas
   */
  async getAthletesStats() {
    try {
      const athletesStats = await this.dashboardRepository.getAthletesStats();
      return athletesStats;
    } catch (error) {
      console.error("Error en DashboardService.getAthletesStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de servicios de salud
   */
  async getHealthStats() {
    try {
      const healthStats = await this.dashboardRepository.getHealthStats();
      return healthStats;
    } catch (error) {
      console.error("Error en DashboardService.getHealthStats:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de donaciones
   */
  async getDonationsStats() {
    try {
      const donationsStats = await this.dashboardRepository.getDonationsStats();
      return donationsStats;
    } catch (error) {
      console.error("Error en DashboardService.getDonationsStats:", error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
