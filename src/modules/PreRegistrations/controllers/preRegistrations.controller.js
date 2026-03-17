import { preRegistrationsService } from "../services/preRegistrations.service.js";
import { preRegistrationSchemas } from "../validators/preRegistrations.validator.js";

export const preRegistrationsController = {
  async create(req, res) {
    try {
      console.log('📥 [PreRegistration] Datos recibidos:', req.body);
      
      const { error, value } = preRegistrationSchemas.create.validate(req.body);
      if (error) {
        console.log('❌ [PreRegistration] Error de validación:', error.details);
        return res.status(400).json({
          success: false,
          message: error.details[0]?.message || 'Error de validación',
          errors: error.details
        });
      }

      console.log('✅ [PreRegistration] Datos validados:', value);
      const preRegistration = await preRegistrationsService.create(value);
      console.log('✅ [PreRegistration] Pre-inscripción creada:', preRegistration);

      return res.status(201).json({
        success: true,
        message: "Inscripción creada exitosamente",
        data: preRegistration,
      });
    } catch (error) {
      console.error('❌ [PreRegistration] Error en create:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findAll(req, res) {
    try {
      const { status, page, limit, search } = req.query;
      const result = await preRegistrationsService.findAll({
        status,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10,
        search,
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
      const preRegistration = await preRegistrationsService.findById(id);

      return res.json({
        success: true,
        data: preRegistration,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await preRegistrationsService.delete(id);

      return res.json({
        success: true,
        message: "Inscripción eliminada",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "El estado es requerido",
        });
      }

      const preRegistration = await preRegistrationsService.updateStatus(id, status);

      return res.json({
        success: true,
        message: "Estado actualizado exitosamente",
        data: preRegistration,
      });
    } catch (error) {
      console.error('Error en updateStatus:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async resendEmail(req, res) {
    try {
      const { email, identification } = req.body;

      // Debe proporcionar al menos uno: email o documento
      if (!email && !identification) {
        return res.status(400).json({
          success: false,
          message: "Debes proporcionar el correo o el número de documento",
        });
      }

      const result = await preRegistrationsService.resendEmail({ email, identification });

      return res.json({
        success: true,
        message: "Correo reenviado exitosamente",
        data: result,
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  async checkDocument(req, res) {
    try {
      const { identification } = req.params;

      if (!identification) {
        return res.status(400).json({
          success: false,
          message: "El número de documento es requerido",
        });
      }

      const result = await preRegistrationsService.checkDocumentExists(identification);

      return res.json({
        success: true,
        exists: result.exists,
        message: result.message,
        location: result.location,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async checkEmail(req, res) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "El email es requerido",
        });
      }

      const result = await preRegistrationsService.checkEmailExists(email);

      return res.json({
        success: true,
        exists: result.exists,
        message: result.message,
        location: result.location,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * GET /api/pre-registrations/report
   * Obtener todas las inscripciones para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport(req, res) {
    try {
      const { status, search } = req.query;
      const result = await preRegistrationsService.findAllForReport({
        status,
        search,
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

