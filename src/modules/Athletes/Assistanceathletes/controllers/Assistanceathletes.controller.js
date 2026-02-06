import { AssistanceathletesService } from "../services/Assistanceathletes.services.js";

export class AssistanceathletesController {
  constructor() {
    this.service = new AssistanceathletesService();
  }

  getAttendanceByDate = async (req, res) => {
    try {
      const {
        date,
        page = 1,
        limit = 10,
        search = "",
        categoria = "",
      } = req.query;

      const result = await this.service.getAttendanceByDate({
        date,
        page: parseInt(page),
        limit: parseInt(limit),
        search: search.trim(),
        categoria: categoria.trim(),
      });

      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en getAttendanceByDate:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al obtener la asistencia.",
        statusCode: 500,
      });
    }
  };

  saveAttendanceBulk = async (req, res) => {
    try {
      const { date, items } = req.body;
      const result = await this.service.saveAttendanceBulk({ date, items });
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en saveAttendanceBulk:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al guardar la asistencia.",
        statusCode: 500,
      });
    }
  };

  getAthleteHistory = async (req, res) => {
    try {
      const { athleteId, startDate = "", endDate = "" } = req.query;
      const result = await this.service.getAthleteHistory({
        athleteId: parseInt(athleteId),
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      });
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en getAthleteHistory:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al obtener historial de asistencia.",
        statusCode: 500,
      });
    }
  };
}
