// 📁 Services/Employees/EmployeesSchedule/controllers/schedule.controller.js
import { ScheduleService } from '../services/schedule.services.js';

export class ScheduleController {
  constructor() {
    this.scheduleService = new ScheduleService();
  }

  /**
   * Obtener todos los horarios con filtros
   */
  getAllSchedules = async (req, res) => {
    try {
      const { page = 1, limit = 10, employeeId, dayOfWeek, status } = req.query;
      const result = await this.scheduleService.getAllSchedules({
        page: parseInt(page),
        limit: parseInt(limit),
        employeeId: employeeId ? parseInt(employeeId) : null,
        dayOfWeek,
        status
      });
      res.json({
        success: true,
        data: result.schedules,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination.total} horarios.`
      });
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener horarios.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener horario por ID
   */
  getScheduleById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.scheduleService.getScheduleById(id);
      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message
        });
      }
      res.json({
        success: true,
        data: result.data,
        message: 'Horario encontrado exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching schedule by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener el horario.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener horarios por empleado
   */
  getSchedulesByEmployee = async (req, res) => {
    try {
      const { employeeId } = req.params;
      const result = await this.scheduleService.getSchedulesByEmployee(employeeId);
      res.json({
        success: true,
        data: result.data,
        message: `Horarios del empleado obtenidos exitosamente.`
      });
    } catch (error) {
      console.error('Error fetching schedules by employee:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener horarios del empleado.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Crear horario
   */
  createSchedule = async (req, res) => {
    try {
      const scheduleData = req.body;
      const result = await this.scheduleService.createSchedule(scheduleData);
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } catch (error) {
      console.error('Error creating schedule:', error);
      if (error.message.includes('ya existe un horario') || error.message.includes('no existe') || error.message.includes('no está activo')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear el horario.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Actualizar horario
   */
  updateSchedule = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const result = await this.scheduleService.updateSchedule(id, updateData);
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
      console.error('Error updating schedule:', error);
      if (error.message.includes('ya existe un horario')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar el horario.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Eliminar horario
   */
  deleteSchedule = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.scheduleService.deleteSchedule(id);
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
      console.error('Error deleting schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar el horario.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Registrar novedad en un horario
   */
  registerNovelty = async (req, res) => {
    try {
      const { id } = req.params;
      const { motivoCancelacion } = req.body;
      if (!motivoCancelacion || !motivoCancelacion.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El motivo de la novedad es obligatorio.'
        });
      }
      const result = await this.scheduleService.registerNovelty(id, motivoCancelacion);
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
      console.error('Error registering novelty:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al registrar la novedad.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Obtener lista de empleados activos (para dropdown del formulario)
   */
  getActiveEmployees = async (req, res) => {
    try {
      const result = await this.scheduleService.getActiveEmployees();
      res.json({
        success: true,
        data: result.data,
        message: 'Empleados activos obtenidos exitosamente.'
      });
    } catch (error) {
      console.error('Error fetching active employees:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener empleados.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}
