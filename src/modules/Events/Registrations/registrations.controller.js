import { RegistrationsService } from './registrations.service.js';

export class RegistrationsController {
  constructor() {
    this.registrationsService = new RegistrationsService();
  }

  /**
   * Inscribir equipo a un evento
   */
  registerTeamToEvent = async (req, res) => {
    try {
      const result = await this.registrationsService.registerTeamToEvent(req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error('Error in registerTeamToEvent controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al inscribir equipo.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener inscripciones de un evento
   */
  getEventRegistrations = async (req, res) => {
    try {
      const { serviceId } = req.params;
      const { status } = req.query;

      const result = await this.registrationsService.getEventRegistrations(serviceId, {
        status,
      });

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} inscripciones para el evento.`,
      });
    } catch (error) {
      console.error('Error in getEventRegistrations controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener inscripciones.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener inscripciones de un equipo
   */
  getTeamRegistrations = async (req, res) => {
    try {
      const { teamId } = req.params;
      const { status } = req.query;

      const result = await this.registrationsService.getTeamRegistrations(teamId, {
        status,
      });

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} inscripciones para el equipo.`,
      });
    } catch (error) {
      console.error('Error in getTeamRegistrations controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener inscripciones.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener inscripción por ID
   */
  getRegistrationById = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.registrationsService.getRegistrationById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: 'Inscripción encontrada exitosamente.',
      });
    } catch (error) {
      console.error('Error in getRegistrationById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener inscripción.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * Actualizar estado de inscripción
   */
  updateRegistrationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const result = await this.registrationsService.updateRegistrationStatus(
        id,
        status,
        notes
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error('Error in updateRegistrationStatus controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar estado.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * Cancelar inscripción
   */
  cancelRegistration = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.registrationsService.cancelRegistration(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error('Error in cancelRegistration controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al cancelar inscripción.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener estadísticas de inscripciones
   */
  getRegistrationStats = async (req, res) => {
    try {
      const result = await this.registrationsService.getRegistrationStats();

      res.json({
        success: true,
        data: result.data,
        message: 'Estadísticas obtenidas exitosamente.',
      });
    } catch (error) {
      console.error('Error in getRegistrationStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener equipos disponibles para inscripción
   */
  getAvailableTeams = async (req, res) => {
    try {
      const { category } = req.query;

      const result = await this.registrationsService.getAvailableTeams({ category });

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.total} equipos disponibles (${result.data.foundation.length} de fundación, ${result.data.temporary.length} temporales).`,
      });
    } catch (error) {
      console.error('Error in getAvailableTeams controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener equipos.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };

  /**
   * Inscribir múltiples equipos a un evento
   */
  registerMultipleTeams = async (req, res) => {
    try {
      const { serviceId, teamIds, notes } = req.body;

      if (!serviceId || !teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere serviceId y un array de teamIds con al menos un equipo.',
        });
      }

      const result = await this.registrationsService.registerMultipleTeams({
        serviceId,
        teamIds,
        notes,
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error('Error in registerMultipleTeams controller:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al inscribir equipos.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  };
}

export default new RegistrationsController();
