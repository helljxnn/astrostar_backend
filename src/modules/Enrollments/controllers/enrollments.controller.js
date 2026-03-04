import { enrollmentsService } from "../services/enrollments.service.js";
import { enrollmentSchemas } from "../validators/enrollments.validator.js";

export const enrollmentsController = {
  async create(req, res) {
    try {
      console.log('📥 [ENROLLMENT CONTROLLER] ========================================');
      console.log('📥 [ENROLLMENT CONTROLLER] CREANDO MATRÍCULA');
      console.log('📥 [ENROLLMENT CONTROLLER] Body recibido:', JSON.stringify(req.body, null, 2));
      console.log('📥 [ENROLLMENT CONTROLLER] preRegistrationId:', req.body.preRegistrationId);
      console.log('📥 [ENROLLMENT CONTROLLER] Tipo de preRegistrationId:', typeof req.body.preRegistrationId);
      console.log('📥 [ENROLLMENT CONTROLLER] ========================================');
      
      const { error, value } = enrollmentSchemas.create.validate(req.body);
      if (error) {
        console.log('❌ [ENROLLMENT CONTROLLER] Error de validación:', error.details[0].message);
        return res.status(400).json({
          success: false,
          message: error.details[0].message,
        });
      }

      console.log('✅ [ENROLLMENT CONTROLLER] Validación exitosa');
      console.log('✅ [ENROLLMENT CONTROLLER] Value después de validación:', JSON.stringify(value, null, 2));
      console.log('✅ [ENROLLMENT CONTROLLER] preRegistrationId en value:', value.preRegistrationId);
      
      const result = await enrollmentsService.create(value);

      return res.status(201).json({
        success: true,
        message: "Deportista matriculada exitosamente. Credenciales enviadas por email.",
        data: result,
        emailSent: result.emailSent,
        temporaryPassword: result.temporaryPassword
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

  // ELIMINADO: Las matrículas NO deben poder eliminarse
  // Solo pueden cambiar de estado (Vigente, Suspendida, Vencida, Cancelada)
  async delete(req, res) {
    return res.status(403).json({
      success: false,
      message: "Las matrículas no pueden ser eliminadas. Solo pueden cambiar de estado (Vigente, Suspendida, Vencida, Cancelada).",
    });
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
