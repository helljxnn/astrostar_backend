import { preRegistrationsService } from "../services/preRegistrations.service.js";
import { preRegistrationSchemas } from "../validators/preRegistrations.validator.js";

export const preRegistrationsController = {
  async create(req, res) {
    try {
      const { error, value } = preRegistrationSchemas.create.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0]?.message || 'Error de validación',
          errors: error.details
        });
      }

      const preRegistration = await preRegistrationsService.create(value);

      return res.status(201).json({
        success: true,
        message: "Pre-inscripción creada exitosamente",
        data: preRegistration,
      });
    } catch (error) {
      console.error('Error en create pre-registration:', error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  async findAll(req, res) {
    try {
      const { estado, page, limit, search } = req.query;
      const result = await preRegistrationsService.findAll({
        estado,
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
        message: "Pre-inscripción eliminada",
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
      let { estado } = req.body;

      if (!estado) {
        return res.status(400).json({
          success: false,
          message: "El estado es requerido",
        });
      }

      // Capitalizar primera letra para que coincida con el enum
      // "rechazada" -> "Rechazada", "pendiente" -> "Pendiente"
      estado = estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();

      const preRegistration = await preRegistrationsService.updateStatus(id, estado);

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
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "El correo es requerido",
        });
      }

      const result = await preRegistrationsService.resendEmail(email);

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
};
