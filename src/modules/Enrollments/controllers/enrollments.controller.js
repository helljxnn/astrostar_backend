import { enrollmentsService } from "../services/enrollments.service.js";
import { enrollmentSchemas } from "../validators/enrollments.validator.js";

export const enrollmentsController = {
  async create(req, res) {
    try {
      const { error, value } = enrollmentSchemas.create.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const result = await enrollmentsService.create(value);

      return res.status(201).json({
        success: true,
        message: "Deportista matriculada exitosamente",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findAll(req, res) {
    try {
      const { estado, athleteId, page, limit } = req.query;
      const result = await enrollmentsService.findAll({
        estado,
        athleteId,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
      });

      return res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findById(req, res) {
    try {
      const { id } = req.params;
      const enrollment = await enrollmentsService.findById(id);

      return res.json({
        success: true,
        data: enrollment,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findByAthleteId(req, res) {
    try {
      const { athleteId } = req.params;
      const enrollments = await enrollmentsService.findByAthleteId(athleteId);

      return res.json({
        success: true,
        data: enrollments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = enrollmentSchemas.update.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      const enrollment = await enrollmentsService.update(id, value);

      return res.json({
        success: true,
        message: "Matrícula actualizada",
        data: enrollment,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await enrollmentsService.delete(id);

      return res.json({
        success: true,
        message: "Matrícula eliminada",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Procesar matrículas vencidas manualmente
   * POST /api/enrollments/process-expired
   */
  async processExpired(req, res) {
    try {
      const result = await enrollmentsService.processExpiredEnrollments();

      return res.json({
        success: true,
        message: `Procesadas ${result.processed} matrículas vencidas`,
        data: result,
      });
    } catch (error) {
      console.error('Error procesando matrículas vencidas:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * Renovar matrícula de un deportista
   * POST /api/enrollments/renew/:athleteId
   */
  async renew(req, res) {
    try {
      const { athleteId } = req.params;
      const enrollmentData = req.body;

      const result = await enrollmentsService.renewEnrollment(athleteId, enrollmentData);

      return res.status(201).json({
        success: true,
        message: "Matrícula renovada exitosamente. Deportista reactivado.",
        data: result,
      });
    } catch (error) {
      console.error('Error renovando matrícula:', error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};
