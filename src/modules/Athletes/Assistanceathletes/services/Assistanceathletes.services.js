import { AssistanceathletesRepository } from "../repository/Assistanceathletes.repository.js";

export class AssistanceathletesService {
  constructor() {
    this.repository = new AssistanceathletesRepository();
  }

  async getAttendanceByDate(params) {
    try {
      const result = await this.repository.getAttendanceByDate(params);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error("Error en getAttendanceByDate:", error);
      return {
        success: false,
        message: "Error al obtener la asistencia.",
        statusCode: 500,
      };
    }
  }

  async saveAttendanceBulk({ date, items }) {
    try {
      await this.repository.saveAttendanceBulk({ date, items });
      return {
        success: true,
        message: "Asistencia guardada correctamente.",
      };
    } catch (error) {
      console.error("Error en saveAttendanceBulk:", error);
      return {
        success: false,
        message: "Error al guardar la asistencia.",
        statusCode: 500,
      };
    }
  }

  async getAthleteHistory({ athleteId, startDate, endDate }) {
    try {
      const data = await this.repository.getAthleteHistory({
        athleteId,
        startDate,
        endDate,
      });
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error en getAthleteHistory:", error);
      return {
        success: false,
        message: "Error al obtener el historial de asistencia.",
        statusCode: 500,
      };
    }
  }
}
