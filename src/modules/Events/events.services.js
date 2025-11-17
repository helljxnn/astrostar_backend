import { EventsRepository } from './events.repository.js';

export class EventsService {
  constructor() {
    this.eventsRepository = new EventsRepository();
  }

  /**
   * Obtener todos los eventos
   */
  async getAllEvents(filters) {
    try {
      // Actualizar automáticamente eventos finalizados antes de obtenerlos
      await this.updateFinishedEventsStatus();
      
      const result = await this.eventsRepository.findAll(filters);
      return result;
    } catch (error) {
      console.error('Error in getAllEvents service:', error);
      throw error;
    }
  }

  /**
   * Obtener evento por ID
   */
  async getEventById(id) {
    try {
      const event = await this.eventsRepository.findById(id);
      
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: 'Evento no encontrado.'
        };
      }

      return {
        success: true,
        data: event
      };
    } catch (error) {
      console.error('Error in getEventById service:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo evento
   */
  async createEvent(data) {
    try {
      // Validar campos requeridos
      this.validateRequiredFields(data);

      // Validar formato de datos
      this.validateDataFormats(data);

      // Validar lógica de negocio
      this.validateBusinessRules(data);

      // Mapear campos del frontend al backend
      const mappedData = this.mapFrontendToBackend(data);

      const event = await this.eventsRepository.create(mappedData);

      return {
        success: true,
        data: event,
        message: `Evento '${event.name}' creado exitosamente.`
      };
    } catch (error) {
      console.error('Error in createEvent service:', error);
      throw error;
    }
  }

  /**
   * Actualizar evento
   */
  async updateEvent(id, data) {
    try {
      // Verificar que existe
      const existing = await this.eventsRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          statusCode: 404,
          message: 'Evento no encontrado.'
        };
      }

      // VALIDACIÓN: No permitir cambiar el estado de eventos finalizados
      if (existing.status === 'Finalizado' && data.status && data.status !== 'Finalizado') {
        return {
          success: false,
          statusCode: 400,
          message: 'No se puede modificar el estado de un evento finalizado.'
        };
      }

      // Validar formato de datos (solo los campos que se están actualizando)
      this.validateDataFormats(data, false);

      // Validar lógica de negocio
      this.validateBusinessRules(data, existing);

      // Mapear campos del frontend al backend
      const mappedData = this.mapFrontendToBackend(data);

      const updatedEvent = await this.eventsRepository.update(id, mappedData);

      return {
        success: true,
        data: updatedEvent,
        message: `Evento '${updatedEvent.name}' actualizado exitosamente.`
      };
    } catch (error) {
      console.error('Error in updateEvent service:', error);
      throw error;
    }
  }

  /**
   * Eliminar evento
   */
  async deleteEvent(id) {
    try {
      const existing = await this.eventsRepository.findById(id);
      if (!existing) {
        return {
          success: false,
          statusCode: 404,
          message: 'Evento no encontrado.'
        };
      }

      const eventName = existing.name;
      const participantCount = existing.participants ? existing.participants.length : 0;

      // Eliminar el evento (los participantes y patrocinadores se eliminarán en cascada)
      await this.eventsRepository.delete(id);

      const message = participantCount > 0 
        ? `El evento '${eventName}' y sus ${participantCount} participante(s) han sido eliminados exitosamente.`
        : `El evento '${eventName}' ha sido eliminado exitosamente.`;

      return {
        success: true,
        message
      };
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      
      // Manejar errores específicos de Prisma
      if (error.code === 'P2003') {
        throw new Error('No se puede eliminar el evento porque tiene relaciones activas.');
      }
      
      if (error.code === 'P2025') {
        throw new Error('El evento no fue encontrado.');
      }
      
      throw error;
    }
  }

  /**
   * Obtener estadísticas
   */
  async getEventStats() {
    try {
      const stats = await this.eventsRepository.getStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error in getEventStats service:', error);
      throw error;
    }
  }

  /**
   * Obtener datos de referencia
   */
  async getReferenceData() {
    try {
      const data = await this.eventsRepository.getReferenceData();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error in getReferenceData service:', error);
      throw error;
    }
  }

  /**
   * Validar campos requeridos
   */
  validateRequiredFields(data) {
    const errors = [];

    if (!data.name || !data.name.trim()) {
      errors.push('El nombre del evento es requerido');
    }

    if (!data.startDate) {
      errors.push('La fecha de inicio es requerida');
    }

    if (!data.endDate) {
      errors.push('La fecha de fin es requerida');
    }

    if (!data.startTime) {
      errors.push('La hora de inicio es requerida');
    }

    if (!data.endTime) {
      errors.push('La hora de fin es requerida');
    }

    if (!data.location || !data.location.trim()) {
      errors.push('La ubicación es requerida');
    }

    if (!data.phone || !data.phone.trim()) {
      errors.push('El teléfono de contacto es requerido');
    }

    if (!data.categoryId) {
      errors.push('La categoría del evento es requerida');
    }

    if (!data.typeId) {
      errors.push('El tipo de evento es requerido');
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  /**
   * Validar formato de datos
   */
  validateDataFormats(data, isCreate = true) {
    const errors = [];

    // Validar nombre
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || data.name.length < 3 || data.name.length > 200) {
        errors.push('El nombre debe tener entre 3 y 200 caracteres');
      }
    }

    // Validar descripción
    if (data.description !== undefined && data.description !== null && data.description !== '') {
      if (data.description.length > 1000) {
        errors.push('La descripción no puede exceder 1000 caracteres');
      }
    }

    // Validar fechas
    if (data.startDate !== undefined) {
      const startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push('La fecha de inicio debe tener un formato válido');
      }
    }

    if (data.endDate !== undefined) {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push('La fecha de fin debe tener un formato válido');
      }
    }

    // Validar horas (formato HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (data.startTime !== undefined && !timeRegex.test(data.startTime)) {
      errors.push('La hora de inicio debe tener formato HH:MM (24 horas)');
    }

    if (data.endTime !== undefined && !timeRegex.test(data.endTime)) {
      errors.push('La hora de fin debe tener formato HH:MM (24 horas)');
    }

    // Validar ubicación
    if (data.location !== undefined && data.location !== null && data.location !== '') {
      if (data.location.length > 200) {
        errors.push('La ubicación no puede exceder 200 caracteres');
      }
    }

    // Validar teléfono
    if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
      // Remover espacios, guiones y paréntesis para validar
      const cleanPhone = data.phone.replace(/[\s\-\(\)]/g, '');
      
      // Validar formato: debe empezar con + (opcional) seguido de números
      if (!/^\+?\d{7,15}$/.test(cleanPhone)) {
        errors.push('El teléfono debe contener entre 7 y 15 dígitos, puede incluir + al inicio');
      }
      
      if (data.phone.length > 20) {
        errors.push('El teléfono no puede exceder 20 caracteres');
      }
    }

    // Validar estado
    if (data.status !== undefined) {
      const validStatuses = ['Programado', 'Finalizado', 'Cancelado', 'Pausado'];
      if (!validStatuses.includes(data.status)) {
        errors.push('El estado debe ser: Programado, Finalizado, Cancelado o Pausado');
      }
    }

    // Validar URLs de Cloudinary
    if (data.imageUrl !== undefined && data.imageUrl !== null && data.imageUrl !== '') {
      if (!this.isValidCloudinaryUrl(data.imageUrl)) {
        errors.push('La URL de la imagen debe ser una URL válida de Cloudinary');
      }
    }

    if (data.scheduleFile !== undefined && data.scheduleFile !== null && data.scheduleFile !== '') {
      if (!this.isValidCloudinaryUrl(data.scheduleFile)) {
        errors.push('La URL del cronograma debe ser una URL válida de Cloudinary');
      }
    }

    // Validar IDs
    if (data.categoryId !== undefined && data.categoryId !== null) {
      const catId = parseInt(data.categoryId);
      if (isNaN(catId) || catId < 1) {
        errors.push('La categoría debe ser un número válido');
      }
    }

    if (data.typeId !== undefined && data.typeId !== null) {
      const typeId = parseInt(data.typeId);
      if (isNaN(typeId) || typeId < 1) {
        errors.push('El tipo de evento debe ser un número válido');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  /**
   * Validar reglas de negocio
   */
  validateBusinessRules(data, existingData = null) {
    const errors = [];

    // Obtener fechas, usando datos existentes si no se proporcionan nuevos
    let startDate = null;
    let endDate = null;

    if (data.startDate) {
      startDate = new Date(data.startDate);
    } else if (existingData && existingData.startDate) {
      startDate = new Date(existingData.startDate);
    }

    if (data.endDate) {
      endDate = new Date(data.endDate);
    } else if (existingData && existingData.endDate) {
      endDate = new Date(existingData.endDate);
    }

    // Validar que la fecha de inicio no sea en el pasado (solo al crear)
    if (!existingData && startDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      if (startDateOnly < today) {
        errors.push('La fecha de inicio no puede ser en el pasado');
      }
    }

    // Validar que la fecha de fin sea posterior o igual a la de inicio
    if (startDate && endDate) {
      // Comparar solo las fechas (sin hora)
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (endDateOnly < startDateOnly) {
        errors.push('La fecha de fin debe ser posterior o igual a la fecha de inicio');
      }

      // Validar que si es el mismo día, la hora de fin sea posterior a la de inicio
      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        const startTime = data.startTime || (existingData ? existingData.startTime : null);
        const endTime = data.endTime || (existingData ? existingData.endTime : null);

        if (startTime && endTime) {
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          if (endMinutes <= startMinutes) {
            errors.push('La hora de fin debe ser posterior a la hora de inicio cuando es el mismo día');
          }
        }
      }
    }

    // Validar que categoryId y typeId existan (se validará en la BD)
    if (data.categoryId !== undefined && data.categoryId !== null) {
      const catId = parseInt(data.categoryId);
      if (catId < 1) {
        errors.push('El ID de categoría debe ser mayor a 0');
      }
    }

    if (data.typeId !== undefined && data.typeId !== null) {
      const typeId = parseInt(data.typeId);
      if (typeId < 1) {
        errors.push('El ID de tipo de evento debe ser mayor a 0');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('. '));
    }
  }

  /**
   * Validar si una URL es de Cloudinary
   */
  isValidCloudinaryUrl(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Validar que sea una URL válida
    try {
      const urlObj = new URL(url);
      // Verificar que sea de Cloudinary
      return urlObj.hostname.includes('cloudinary.com');
    } catch (error) {
      return false;
    }
  }

  /**
   * Mapear campos del frontend al backend
   */
  mapFrontendToBackend(frontendData) {
    const backendData = {};

    if (frontendData.name) backendData.name = frontendData.name.trim();
    if (frontendData.description !== undefined) backendData.description = frontendData.description ? frontendData.description.trim() : null;
    if (frontendData.startDate) backendData.startDate = new Date(frontendData.startDate);
    if (frontendData.endDate) backendData.endDate = new Date(frontendData.endDate);
    if (frontendData.startTime) backendData.startTime = frontendData.startTime;
    if (frontendData.endTime) backendData.endTime = frontendData.endTime;
    if (frontendData.location) backendData.location = frontendData.location.trim();
    if (frontendData.phone) backendData.phone = frontendData.phone.trim();
    if (frontendData.status) backendData.status = frontendData.status;
    if (frontendData.imageUrl !== undefined) backendData.imageUrl = frontendData.imageUrl || null;
    if (frontendData.scheduleFile !== undefined) backendData.scheduleFile = frontendData.scheduleFile || null;
    if (frontendData.publish !== undefined) backendData.publish = Boolean(frontendData.publish);
    if (frontendData.categoryId) backendData.categoryId = parseInt(frontendData.categoryId);
    if (frontendData.typeId) backendData.typeId = parseInt(frontendData.typeId);

    return backendData;
  }

  /**
   * Actualizar automáticamente el estado de eventos finalizados
   * Este método debe ejecutarse periódicamente o al obtener eventos
   */
  async updateFinishedEventsStatus() {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

      // Buscar eventos que deberían estar finalizados pero no lo están
      const eventsToUpdate = await this.eventsRepository.findEventsToFinalize(today, currentTime);

      if (eventsToUpdate.length > 0) {
        await this.eventsRepository.updateMultipleStatuses(
          eventsToUpdate.map(e => e.id),
          'Finalizado'
        );
      }

      return eventsToUpdate.length;
    } catch (error) {
      console.error('Error actualizando estados de eventos:', error);
      return 0;
    }
  }
}
