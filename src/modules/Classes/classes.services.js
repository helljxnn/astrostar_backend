import { ClassesRepository } from "./classes.repository.js";

const classesRepository = new ClassesRepository();

export class ClassesService {
  /**
   * Obtener todas las clases con filtros
   */
  async getAllClasses(filters) {
    try {
      return await classesRepository.findAll(filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener clase por ID
   */
  async getClassById(id) {
    try {
      const classData = await classesRepository.findById(id);
      if (!classData) {
        throw new Error("Clase no encontrada");
      }
      return classData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crear nueva clase
   */
  async createClass(data) {
    try {
      // Validaciones
      if (
        !data.title ||
        !data.classDate ||
        !data.startTime ||
        !data.endTime ||
        !data.employeeId
      ) {
        throw new Error(
          "Faltan campos requeridos: title, classDate, startTime, endTime, employeeId"
        );
      }

      // Validar que la fecha no sea pasada
      const classDate = new Date(data.classDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (classDate < today) {
        throw new Error("No se puede crear una clase con fecha pasada");
      }

      // Validar formato de hora (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(data.startTime) || !timeRegex.test(data.endTime)) {
        throw new Error("Formato de hora inválido. Use HH:MM");
      }

      // Validar que la hora de inicio sea menor que la hora de fin
      const [startHour, startMin] = data.startTime.split(":").map(Number);
      const [endHour, endMin] = data.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        throw new Error("La hora de inicio debe ser menor que la hora de fin");
      }

      return await classesRepository.create(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar clase
   */
  async updateClass(id, data) {
    try {
      // Validar formato de hora si se proporciona
      if (data.startTime || data.endTime) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (data.startTime && !timeRegex.test(data.startTime)) {
          throw new Error("Formato de hora de inicio inválido. Use HH:MM");
        }
        if (data.endTime && !timeRegex.test(data.endTime)) {
          throw new Error("Formato de hora de fin inválido. Use HH:MM");
        }
      }

      return await classesRepository.update(id, data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar clase
   */
  async deleteClass(id) {
    try {
      return await classesRepository.delete(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asignar deportista a clase
   */
  async assignAthleteToClass(classId, athleteId) {
    try {
      // Verificar que la clase existe
      const classData = await classesRepository.findById(classId);
      if (!classData) {
        throw new Error("Clase no encontrada");
      }

      // Verificar capacidad máxima si existe
      if (classData.maxCapacity) {
        const currentAthletes = classData.athletes.length;
        if (currentAthletes >= classData.maxCapacity) {
          throw new Error("La clase ha alcanzado su capacidad máxima");
        }
      }

      return await classesRepository.assignAthlete(classId, athleteId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remover deportista de clase
   */
  async removeAthleteFromClass(classId, athleteId) {
    try {
      return await classesRepository.removeAthlete(classId, athleteId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirmar asistencia de deportista
   */
  async confirmAttendance(classId, athleteId, notes = null) {
    try {
      return await classesRepository.confirmAttendance(
        classId,
        athleteId,
        notes
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar estado de asistencia
   */
  async updateAttendanceStatus(classId, athleteId, status, notes = null) {
    try {
      const validStatuses = [
        "Pendiente",
        "Confirmada",
        "Asistio",
        "No_asistio",
        "Cancelada",
      ];
      if (!validStatuses.includes(status)) {
        throw new Error(
          `Estado inválido. Debe ser uno de: ${validStatuses.join(", ")}`
        );
      }

      return await classesRepository.updateAttendanceStatus(
        classId,
        athleteId,
        status,
        notes
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener clases de una deportista
   */
  async getAthleteClasses(athleteId, filters) {
    try {
      return await classesRepository.findByAthleteId(athleteId, filters);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener clases por rango de fechas (para calendario)
   */
  async getClassesByDateRange(startDate, endDate, employeeId = null) {
    try {
      if (!startDate || !endDate) {
        throw new Error("Se requieren startDate y endDate");
      }

      return await classesRepository.findByDateRange(
        startDate,
        endDate,
        employeeId
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de clases
   */
  async getStats(employeeId = null) {
    try {
      return await classesRepository.getStats(employeeId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener estadísticas de asistencia de una clase
   */
  async getClassAttendanceStats(classId) {
    try {
      return await classesRepository.getClassAttendanceStats(classId);
    } catch (error) {
      throw error;
    }
  }
}
