
import { AppointmentService } from '../services/AppointmentManagement..services.js';

export class AppointmentController {
  constructor() {
    this.appointmentService = new AppointmentService();
  }

  /**
   * Obtener todas las citas con filtros
   */
  getAllAppointments = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        athleteId,
        specialistId,
        specialty = '',
        startDate = '',
        endDate = ''
      } = req.query;

      const result = await this.appointmentService.getAllAppointments({
        page: parseInt(page),
        limit: parseInt(limit),
        
        search,
        status,
        athleteId: athleteId ? parseInt(athleteId) : null,
        specialistId: specialistId ? parseInt(specialistId) : null,
        specialty,
        startDate,
        endDate
      });

      res.json({
        success: true,
        data: result.appointments,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination.total} citas.`
      });
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener citas.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener cita por ID
   */
  getAppointmentById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.getAppointmentById(id);
      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }
      res.json({
        success: true,
        data: result.data,
        message: 'Cita encontrada exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching appointment by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener la cita.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Crear cita
   */
  createAppointment = async (req, res) => {
    try {
      const appointmentData = req.body;
      const result = await this.appointmentService.createAppointment(appointmentData);
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error creating appointment:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Actualizar cita
   */
  updateAppointment = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await this.appointmentService.updateAppointment(id, updateData);
      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }
      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Cancelar cita
   */
  cancelAppointment = async (req, res) => {
    try {
      const { id } = req.params;
      const { cancelReason } = req.body;
      if (!cancelReason || !cancelReason.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El motivo de cancelación es obligatorio.'
        });
      }
      const result = await this.appointmentService.cancelAppointment(id, cancelReason);
      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }
      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al cancelar la cita.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Completar cita
   */
  completeAppointment = async (req, res) => {
    try {
      const { id } = req.params;
      const { conclusion } = req.body;
      if (!conclusion || !conclusion.trim()) {
        return res.status(400).json({
          success: false,
          message: 'La conclusión es obligatoria.'
        });
      }
      const result = await this.appointmentService.completeAppointment(id, conclusion);
      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }
      res.json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al completar la cita.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Eliminar cita
   */
  deleteAppointment = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.deleteAppointment(id);
      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar la cita.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener deportistas activos
   */
  getActiveAthletes = async (req, res) => {
    try {
      const result = await this.appointmentService.getActiveAthletes();
      res.json({
        success: true,
        data: result.data,
        message: 'Deportistas activos obtenidos exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching active athletes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener deportistas.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener especialistas activos
   */
  getActiveSpecialists = async (req, res) => {
    try {
      const { specialty = '' } = req.query;
      const result = await this.appointmentService.getActiveSpecialists({ specialty });
      res.json({
        success: true,
        data: result.data,
        message: 'Especialistas activos obtenidos exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching active specialists:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener especialistas.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener especialidades disponibles
   */
  getSpecialties = async (req, res) => {
    try {
      const result = await this.appointmentService.getSpecialties();
      res.json({
        success: true,
        data: result.data,
        message: 'Especialidades obtenidas exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching specialties:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener especialidades.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
