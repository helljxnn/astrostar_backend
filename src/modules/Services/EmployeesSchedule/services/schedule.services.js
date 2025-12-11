// 📁 Services/Employees/EmployeesSchedule/services/schedule.services.js
import { ScheduleRepository } from '../repository/schedule.repository.js';

export class ScheduleService {
  constructor() {
    this.scheduleRepository = new ScheduleRepository();
  }

  /**
   * Normalizar fecha (YYYY-MM-DD) a Date con hora local 00:00:00
   */
  normalizeDateOnly(fecha) {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;
    return new Date(`${fecha}T00:00:00`);
  }

  /**
   * Mapear días de semana español -> inglés para Prisma
   */
  mapDayOfWeek(fecha) {
    const date = this.normalizeDateOnly(fecha);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  /**
   * Obtener todos los horarios con filtros
   */
  async getAllSchedules({ page = 1, limit = 10, employeeId = null, dayOfWeek = '', status = '' }) {
    try {
      const result = await this.scheduleRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        employeeId,
        dayOfWeek,
        status
      });
      return result;
    } catch (error) {
      console.error('Service error - getAllSchedules:', error);
      throw error;
    }
  }

  /**
   * Obtener horario por ID
   */
  async getScheduleById(id) {
    try {
      const schedule = await this.scheduleRepository.findById(id);
      if (!schedule) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el horario con ID ${id}.`
        };
      }
      return {
        success: true,
        data: schedule
      };
    } catch (error) {
      console.error('Service error - getScheduleById:', error);
      throw error;
    }
  }

  /**
   * Obtener horarios por empleado
   */
  async getSchedulesByEmployee(employeeId) {
    try {
      const schedules = await this.scheduleRepository.findByEmployeeId(employeeId);
      return {
        success: true,
        data: schedules
      };
    } catch (error) {
      console.error('Service error - getSchedulesByEmployee:', error);
      throw error;
    }
  }

  /**
   * Crear horario con todas las validaciones
   */
  async createSchedule(scheduleData) {
    try {
      // 1. REGLA DE NEGOCIO: Validar que el empleado existe y está activo
      const employees = await this.scheduleRepository.getActiveEmployees();
      const employeeExists = employees.find(emp => emp.id === parseInt(scheduleData.empleadoId));
      if (!employeeExists) {
        throw new Error('El empleado no existe o no está activo.');
      }

      // 2. REGLA DE NEGOCIO: Validar que la fecha no sea pasada
      const scheduleDate = this.normalizeDateOnly(scheduleData.fecha);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (scheduleDate < today) {
        throw new Error('No se puede crear un horario en una fecha pasada.');
      }

      // 3. REGLA DE NEGOCIO: Validar que hora inicio sea menor que hora fin
      if (scheduleData.horaInicio >= scheduleData.horaFin) {
        throw new Error('La hora de inicio debe ser menor que la hora de fin.');
      }

      // 4. REGLA DE NEGOCIO: Verificar conflictos de horario
        const conflict = await this.scheduleRepository.checkScheduleConflict(
          scheduleData.empleadoId,
          scheduleDate,
          scheduleData.horaInicio,
          scheduleData.horaFin
        );
      if (conflict) {
        const conflictDate = new Date(conflict.scheduleDate).toLocaleDateString('es-CO');
        throw new Error(
          `Ya existe un horario para este empleado el ${conflictDate} que se solapa con el horario ingresado (${conflict.startTime} - ${conflict.endTime}).`
        );
      }

      // 5. Calcular día de la semana
      const dayOfWeek = this.mapDayOfWeek(scheduleData.fecha);

      // 6. Preparar datos para la base de datos
      const scheduleDataForDB = {
        employeeId: parseInt(scheduleData.empleadoId),
        scheduleDate,
        dayOfWeek: dayOfWeek,
        startTime: scheduleData.horaInicio,
        endTime: scheduleData.horaFin,
        recurrence: scheduleData.repeticion || 'no',
        customRecurrence: scheduleData.customRecurrence ? JSON.stringify(scheduleData.customRecurrence) : null,
        description: scheduleData.descripcion?.trim() || null,
        status: scheduleData.estado || 'Programado',
        cancellationReason: null
      };

      // 7. Crear el horario
      const newSchedule = await this.scheduleRepository.create(scheduleDataForDB);
      return {
        success: true,
        data: newSchedule,
        message: `Horario para "${newSchedule.employee.user.firstName} ${newSchedule.employee.user.lastName}" creado exitosamente.`
      };
    } catch (error) {
      console.error('Service error - createSchedule:', error);
      throw error;
    }
  }

  /**
   * Actualizar horario
   */
  async updateSchedule(id, updateData) {
    try {
      // 1. REGLA DE NEGOCIO: Verificar que el horario existe
      const existingSchedule = await this.scheduleRepository.findById(id);
      if (!existingSchedule) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el horario con ID ${id}.`
        };
      }

      // 2. REGLA DE NEGOCIO: No permitir editar horarios cancelados
      if (existingSchedule.status === 'Cancelado') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se puede editar un horario cancelado.'
        };
      }

      // 3. Si se actualiza fecha u horario, verificar conflictos
      if (updateData.fecha || updateData.horaInicio || updateData.horaFin) {
        const scheduleDate =
          this.normalizeDateOnly(updateData.fecha) || existingSchedule.scheduleDate;
        const startTime = updateData.horaInicio || existingSchedule.startTime;
        const endTime = updateData.horaFin || existingSchedule.endTime;

        // Validar hora inicio < hora fin
        if (startTime >= endTime) {
          throw new Error('La hora de inicio debe ser menor que la hora de fin.');
        }

        // Verificar conflictos
        const conflict = await this.scheduleRepository.checkScheduleConflict(
          existingSchedule.employeeId,
          scheduleDate,
          startTime,
          endTime,
          id
        );
        if (conflict) {
          const conflictDate = new Date(conflict.scheduleDate).toLocaleDateString('es-CO');
          throw new Error(
            `Ya existe un horario para este empleado el ${conflictDate} que se solapa con el horario ingresado.`
          );
        }
      }

      // 4. Preparar datos actualizados
      const scheduleDataForDB = {};
      if (updateData.fecha) {
        scheduleDataForDB.scheduleDate = this.normalizeDateOnly(updateData.fecha);
        scheduleDataForDB.dayOfWeek = this.mapDayOfWeek(updateData.fecha);
      }
      if (updateData.horaInicio) scheduleDataForDB.startTime = updateData.horaInicio;
      if (updateData.horaFin) scheduleDataForDB.endTime = updateData.horaFin;
      if (updateData.repeticion) scheduleDataForDB.recurrence = updateData.repeticion;
      if (updateData.customRecurrence !== undefined) {
        scheduleDataForDB.customRecurrence = updateData.customRecurrence 
          ? JSON.stringify(updateData.customRecurrence) 
          : null;
      }
      if (updateData.descripcion !== undefined) {
        scheduleDataForDB.description = updateData.descripcion?.trim() || null;
      }
      if (updateData.estado) scheduleDataForDB.status = updateData.estado;

      // 5. Actualizar el horario
      const updatedSchedule = await this.scheduleRepository.update(id, scheduleDataForDB);
      return {
        success: true,
        data: updatedSchedule,
        message: 'Horario actualizado exitosamente.'
      };
    } catch (error) {
      console.error('Service error - updateSchedule:', error);
      throw error;
    }
  }

  /**
   * Eliminar horario
   */
  async deleteSchedule(id) {
    try {
      const scheduleToDelete = await this.scheduleRepository.findById(id);
      if (!scheduleToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el horario con ID ${id}.`
        };
      }

      // REGLA DE NEGOCIO: No permitir eliminar horarios completados
      if (scheduleToDelete.status === 'Completado') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se puede eliminar un horario completado. Considere cancelarlo en su lugar.'
        };
      }

      const deleted = await this.scheduleRepository.delete(id);
      if (deleted) {
        return {
          success: true,
          message: 'Horario eliminado exitosamente.'
        };
      }
    } catch (error) {
      console.error('Service error - deleteSchedule:', error);
      throw error;
    }
  }

  /**
   * Registrar una novedad en un horario
   */
  async registerNovelty(id, motivoCancelacion) {
    try {
      const schedule = await this.scheduleRepository.findById(id);
      if (!schedule) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontró el horario con ID ${id}.`
        };
      }

      if (schedule.status === 'Completado') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se puede registrar una novedad en un horario ya completado.'
        };
      }

      const updatedSchedule = await this.scheduleRepository.update(id, {
        cancellationReason: motivoCancelacion.trim()
      });
      return {
        success: true,
        data: updatedSchedule,
        message: 'Novedad registrada exitosamente.'
      };
    } catch (error) {
      console.error('Service error - registerNovelty:', error);
      throw error;
    }
  }

  /**
   * Obtener empleados activos
   */
  async getActiveEmployees() {
    try {
      const employees = await this.scheduleRepository.getActiveEmployees();
      const formattedEmployees = employees.map(emp => ({
        id: emp.id,
        empleadoId: emp.id,
        nombre: `${emp.user.firstName} ${emp.user.middleName || ''} ${emp.user.lastName} ${emp.user.secondLastName || ''}`.replace(/\s+/g, ' ').trim(),
        cargo: emp.user.role?.name || 'Empleado',
        email: emp.user.email,
        identification: emp.user.identification
      }));
      return {
        success: true,
        data: formattedEmployees
      };
    } catch (error) {
      console.error('Service error - getActiveEmployees:', error);
      throw error;
    }
  }
}
