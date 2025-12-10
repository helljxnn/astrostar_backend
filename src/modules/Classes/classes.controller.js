import { ClassesService } from "./classes.services.js";

const classesService = new ClassesService();

export class ClassesController {
  /**
   * Obtener todas las clases
   */
  async getAllClasses(req, res) {
    try {
      const { page, limit, search, status, employeeId, startDate, endDate } =
        req.query;

      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        search: search || "",
        status: status || "",
        employeeId: employeeId || "",
        startDate: startDate || "",
        endDate: endDate || "",
      };

      const result = await classesService.getAllClasses(filters);

      res.status(200).json({
        success: true,
        data: result.classes,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error al obtener clases:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener clases",
        error: error.message,
      });
    }
  }

  /**
   * Obtener clase por ID
   */
  async getClassById(req, res) {
    try {
      const { id } = req.params;
      const classData = await classesService.getClassById(id);

      res.status(200).json({
        success: true,
        data: classData,
      });
    } catch (error) {
      console.error("Error al obtener clase:", error);
      const statusCode = error.message === "Clase no encontrada" ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Crear nueva clase
   */
  async createClass(req, res) {
    try {
      const classData = await classesService.createClass(req.body);

      res.status(201).json({
        success: true,
        message: "Clase creada exitosamente",
        data: classData,
      });
    } catch (error) {
      console.error("Error al crear clase:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Actualizar clase
   */
  async updateClass(req, res) {
    try {
      const { id } = req.params;
      const classData = await classesService.updateClass(id, req.body);

      res.status(200).json({
        success: true,
        message: "Clase actualizada exitosamente",
        data: classData,
      });
    } catch (error) {
      console.error("Error al actualizar clase:", error);
      const statusCode =
        error.message === "La clase no fue encontrada" ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Eliminar clase
   */
  async deleteClass(req, res) {
    try {
      const { id } = req.params;
      await classesService.deleteClass(id);

      res.status(200).json({
        success: true,
        message: "Clase eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error al eliminar clase:", error);
      const statusCode = error.message.includes("no existe") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Asignar deportista a clase
   */
  async assignAthlete(req, res) {
    try {
      const { classId, athleteId } = req.params;
      const result = await classesService.assignAthleteToClass(
        classId,
        athleteId
      );

      res.status(201).json({
        success: true,
        message: "Deportista asignada exitosamente",
        data: result,
      });
    } catch (error) {
      console.error("Error al asignar deportista:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Remover deportista de clase
   */
  async removeAthlete(req, res) {
    try {
      const { classId, athleteId } = req.params;
      await classesService.removeAthleteFromClass(classId, athleteId);

      res.status(200).json({
        success: true,
        message: "Deportista removida exitosamente",
      });
    } catch (error) {
      console.error("Error al remover deportista:", error);
      const statusCode = error.message.includes("no existe") ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Confirmar asistencia
   */
  async confirmAttendance(req, res) {
    try {
      const { classId, athleteId } = req.params;
      const { notes } = req.body;

      const result = await classesService.confirmAttendance(
        classId,
        athleteId,
        notes
      );

      res.status(200).json({
        success: true,
        message: "Asistencia confirmada exitosamente",
        data: result,
      });
    } catch (error) {
      console.error("Error al confirmar asistencia:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Actualizar estado de asistencia
   */
  async updateAttendanceStatus(req, res) {
    try {
      const { classId, athleteId } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "El campo status es requerido",
        });
      }

      const result = await classesService.updateAttendanceStatus(
        classId,
        athleteId,
        status,
        notes
      );

      res.status(200).json({
        success: true,
        message: "Estado de asistencia actualizado exitosamente",
        data: result,
      });
    } catch (error) {
      console.error("Error al actualizar estado de asistencia:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener clases de una deportista
   */
  async getAthleteClasses(req, res) {
    try {
      const { athleteId } = req.params;
      const { page, limit, status } = req.query;

      const filters = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
        status: status || "",
      };

      const result = await classesService.getAthleteClasses(athleteId, filters);

      res.status(200).json({
        success: true,
        data: result.classes,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error al obtener clases de deportista:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener clases por rango de fechas (para calendario)
   */
  async getClassesByDateRange(req, res) {
    try {
      const { startDate, endDate, employeeId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Se requieren startDate y endDate",
        });
      }

      const classes = await classesService.getClassesByDateRange(
        startDate,
        endDate,
        employeeId
      );

      res.status(200).json({
        success: true,
        data: classes,
      });
    } catch (error) {
      console.error("Error al obtener clases por rango de fechas:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener estadísticas de clases
   */
  async getStats(req, res) {
    try {
      const { employeeId } = req.query;
      const stats = await classesService.getStats(employeeId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Obtener estadísticas de asistencia de una clase
   */
  async getClassAttendanceStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await classesService.getClassAttendanceStats(id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de asistencia:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
