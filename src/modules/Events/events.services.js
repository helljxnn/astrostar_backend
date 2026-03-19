import { EventsRepository } from "./events.repository.js";
import prisma from "../../config/database.js";

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
      console.error("❌ Error en EventsService.getAllEvents:", error.message);
      console.error("Stack:", error.stack);
      throw error;
    }
  }

  /**
   * Obtener eventos publicados para landing
   */
  async getPublicEvents(filters = {}) {
    try {
      await this.updateFinishedEventsStatus();

      const events = await this.eventsRepository.findPublicEvents(filters);
      return {
        success: true,
        data: events,
      };
    } catch (error) {
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
          message: "Evento no encontrado.",
        };
      }

      return {
        success: true,
        data: event,
      };
    } catch (error) {
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

      // Validar que el nombre no exista
      await this.validateUniqueName(data.name);

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
        message: `Evento '${event.name}' creado exitosamente.`,
      };
    } catch (error) {
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
          message: "Evento no encontrado.",
        };
      }

      // VALIDACIÓN: No permitir cambiar el estado de eventos finalizados
      if (
        existing.status === "Finalizado" &&
        data.status &&
        data.status !== "Finalizado"
      ) {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede modificar el estado de un evento finalizado.",
        };
      }

      // Validar que el nombre no exista (si se está cambiando)
      if (data.name && data.name !== existing.name) {
        await this.validateUniqueName(data.name, id);
      }

      // Validar formato de datos (solo los campos que se están actualizando)
      this.validateDataFormats(data, false);

      // Validar lógica de negocio
      this.validateBusinessRules(data, existing);

      // Si se solicita limpiar inscripciones, hacerlo antes de actualizar
      if (data.clearRegistrations === true) {
        await this.eventsRepository.clearEventRegistrations(id);
      }

      // Mapear campos del frontend al backend
      const mappedData = this.mapFrontendToBackend(data);

      const updatedEvent = await this.eventsRepository.update(id, mappedData);

      return {
        success: true,
        data: updatedEvent,
        message: `Evento '${updatedEvent.name}' actualizado exitosamente.`,
      };
    } catch (error) {
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
          message: "Evento no encontrado.",
        };
      }

      // Validar estado del evento
      if (existing.status === "En Curso" || existing.status === "en_curso") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede eliminar un evento que está en curso.",
        };
      }

      if (
        existing.status === "Finalizado" ||
        existing.status === "finalizado"
      ) {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede eliminar un evento que ya finalizó.",
        };
      }

      // Validar si tiene inscritos
      const participantCount = existing.participants
        ? existing.participants.length
        : 0;

      if (participantCount > 0) {
        return {
          success: false,
          statusCode: 400,
          message: `No se puede eliminar el evento porque tiene ${participantCount} inscrito(s).`,
        };
      }

      // Validar si tiene materiales a entregar asignados por donación
      // (materiales CONSUMIBLES con donacionId != null no se pueden eliminar
      // porque provienen de un acuerdo legal con un donante/patrocinador)
      const donationDeliverableMaterials = await prisma.eventMaterial.count({
        where: {
          eventoId: parseInt(id),
          tipo: "CONSUMIBLE",
          donacionId: { not: null },
        },
      });

      if (donationDeliverableMaterials > 0) {
        return {
          success: false,
          statusCode: 400,
          message:
            `No se puede eliminar el evento porque tiene ${donationDeliverableMaterials} material(es) a entregar asignados por donación. Estos materiales fueron comprometidos con un donante o patrocinador y no pueden ser reasignados.`,
        };
      }

      const eventName = existing.name;

      // Revertir automáticamente materiales CONSUMIBLES asignados manualmente
      // (los que no tienen donacionId) antes de eliminar el evento
      const manualMaterials = await prisma.eventMaterial.findMany({
        where: {
          eventoId: parseInt(id),
          tipo: "CONSUMIBLE",
          donacionId: null,
        },
        include: { material: true },
      });

      if (manualMaterials.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const assignment of manualMaterials) {
            const material = assignment.material;
            const newStockEventos = material.stockEventos + assignment.cantidad;
            const stockAnterior = material.stockFundacion + material.stockEventos;
            const stockNuevo = material.stockFundacion + newStockEventos;

            // Revertir stock
            await tx.material.update({
              where: { id: material.id },
              data: { stockEventos: newStockEventos },
            });

            // Registrar movimiento de reversión
            await tx.materialMovement.create({
              data: {
                materialId: material.id,
                materialNombre: material.nombre,
                categoria: material.categoria,
                tipoMovimiento: "REVERSION_ASIGNACION",
                cantidad: assignment.cantidad,
                inventarioDestino: "EVENTOS",
                eventoId: parseInt(id),
                observaciones: `Reversión por eliminación del evento "${eventName}"`,
                stockAnterior,
                stockNuevo,
                createdBy: 0,
                createdByName: "Sistema",
              },
            });
          }
        });
      }

      // Eliminar el evento (participantes, patrocinadores y eventMaterials en cascada)
      await this.eventsRepository.delete(id);

      return {
        success: true,
        message: `El evento '${eventName}' ha sido eliminado exitosamente.`,
      };
    } catch (error) {
      // Manejar errores específicos de Prisma
      if (error.code === "P2003") {
        throw new Error(
          "No se puede eliminar el evento porque tiene relaciones activas.",
        );
      }

      if (error.code === "P2025") {
        throw new Error("El evento no fue encontrado.");
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
        data: stats,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener eventos agrupados por trimestre
   */
  async getEventsByQuarter() {
    try {
      const events = await this.eventsRepository.getEventsByQuarter();
      return {
        success: true,
        data: events,
      };
    } catch (error) {
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
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar inscripciones afectadas por cambio de categorías
   */
  async checkAffectedRegistrations(eventId, newCategoryIds) {
    try {
      const result = await this.eventsRepository.checkAffectedRegistrations(
        eventId,
        newCategoryIds,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validar que el nombre del evento sea único
   */
  async validateUniqueName(name, excludeId = null) {
    const existingEvent = await this.eventsRepository.findByName(name);

    if (existingEvent && (!excludeId || existingEvent.id !== excludeId)) {
      throw new Error(`Ya existe un evento con el nombre "${name}"`);
    }
  }

  /**
   * Validar campos requeridos
   */
  validateRequiredFields(data) {
    const errors = [];

    if (!data.name || !data.name.trim()) {
      errors.push("El nombre del evento es requerido");
    }

    if (!data.startDate) {
      errors.push("La fecha de inicio es requerida");
    }

    if (!data.endDate) {
      errors.push("La fecha de fin es requerida");
    }

    if (!data.startTime) {
      errors.push("La hora de inicio es requerida");
    }

    if (!data.endTime) {
      errors.push("La hora de fin es requerida");
    }

    if (!data.location || !data.location.trim()) {
      errors.push("La ubicación es requerida");
    }

    if (!data.phone || !data.phone.trim()) {
      errors.push("El teléfono de contacto es requerido");
    }

    if (
      !data.categoryIds ||
      !Array.isArray(data.categoryIds) ||
      data.categoryIds.length === 0
    ) {
      errors.push("Debe seleccionar al menos una categoría para el evento");
    }

    if (!data.typeId) {
      errors.push("El tipo de evento es requerido");
    }

    // categoryId es opcional ahora, ya que las categorías se manejan a través de categoryIds (deportivas)

    if (errors.length > 0) {
      throw new Error(errors.join(". "));
    }
  }

  /**
   * Validar formato de datos
   */
  validateDataFormats(data, isCreate = true) {
    const errors = [];

    // Validar nombre
    if (data.name !== undefined) {
      if (
        typeof data.name !== "string" ||
        data.name.length < 3 ||
        data.name.length > 200
      ) {
        errors.push("El nombre debe tener entre 3 y 200 caracteres");
      }
    }

    // Validar descripción
    if (
      data.description !== undefined &&
      data.description !== null &&
      data.description !== ""
    ) {
      if (data.description.length > 1000) {
        errors.push("La descripción no puede exceder 1000 caracteres");
      }
    }

    // Validar fechas
    if (data.startDate !== undefined) {
      const startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push("La fecha de inicio debe tener un formato válido");
      }
    }

    if (data.endDate !== undefined) {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push("La fecha de fin debe tener un formato válido");
      }
    }

    // Validar horas (formato HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (data.startTime !== undefined && !timeRegex.test(data.startTime)) {
      errors.push("La hora de inicio debe tener formato HH:MM (24 horas)");
    }

    if (data.endTime !== undefined && !timeRegex.test(data.endTime)) {
      errors.push("La hora de fin debe tener formato HH:MM (24 horas)");
    }

    // Validar ubicación
    if (
      data.location !== undefined &&
      data.location !== null &&
      data.location !== ""
    ) {
      if (data.location.length > 200) {
        errors.push("La ubicación no puede exceder 200 caracteres");
      }
    }

    // Validar teléfono
    if (data.phone !== undefined && data.phone !== null && data.phone !== "") {
      const rawPhone = String(data.phone).trim();
      const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, "");

      if (cleanPhone.startsWith("+") && !cleanPhone.startsWith("+57")) {
        errors.push("Solo se permite el indicativo +57");
      }

      const localPhone = cleanPhone.startsWith("+57")
        ? cleanPhone.slice(3)
        : cleanPhone.startsWith("57")
          ? cleanPhone.slice(2)
          : cleanPhone;

      if (!/^\d+$/.test(localPhone)) {
        errors.push("El teléfono solo puede contener números");
      } else {
        const isMobile = localPhone.length === 10 && /^3/.test(localPhone);
        const isLandline = localPhone.length === 7 && /^[2-8]/.test(localPhone);

        if (!isMobile && !isLandline) {
          errors.push(
            "Número inválido. Celular: 3XXXXXXXXX, fijo: 2XXXXXXX-8XXXXXXX",
          );
        }
      }

      if (rawPhone.length > 20) {
        errors.push("El teléfono no puede exceder 20 caracteres");
      }
    }

    // Validar estado
    if (data.status !== undefined) {
      const validStatuses = [
        "Programado",
        "En_curso",
        "Finalizado",
        "Cancelado",
      ];
      if (!validStatuses.includes(data.status)) {
        errors.push(
          "El estado debe ser: Programado, En_curso, Finalizado o Cancelado",
        );
      }
    }

    // Validar URLs de Cloudinary
    if (
      data.imageUrl !== undefined &&
      data.imageUrl !== null &&
      data.imageUrl !== ""
    ) {
      if (!this.isValidCloudinaryUrl(data.imageUrl)) {
        errors.push(
          "La URL de la imagen debe ser una URL válida de Cloudinary",
        );
      }
    }

    if (
      data.scheduleFile !== undefined &&
      data.scheduleFile !== null &&
      data.scheduleFile !== ""
    ) {
      if (!this.isValidCloudinaryUrl(data.scheduleFile)) {
        errors.push(
          "La URL del cronograma debe ser una URL válida de Cloudinary",
        );
      }
    }

    // Validar IDs de categorías
    if (data.categoryIds !== undefined && data.categoryIds !== null) {
      if (!Array.isArray(data.categoryIds)) {
        errors.push("Las categorías deben ser un array");
      } else if (data.categoryIds.length > 0) {
        const invalidIds = data.categoryIds.filter((id) => {
          const catId = parseInt(id);
          return isNaN(catId) || catId < 1;
        });
        if (invalidIds.length > 0) {
          errors.push("Todas las categorías deben ser números válidos");
        }
      }
    }

    if (data.typeId !== undefined && data.typeId !== null) {
      const typeId = parseInt(data.typeId);
      if (isNaN(typeId) || typeId < 1) {
        errors.push("El tipo de evento debe ser un número válido");
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(". "));
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

    // Validar que la fecha de inicio sea al menos el día siguiente (solo al crear)
    if (!existingData && startDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Parsear la fecha de inicio sin problemas de zona horaria
      // Si startDate es un Date object, extraer año, mes, día
      // Si es un string, parsearlo correctamente
      let startYear, startMonth, startDay;

      if (startDate instanceof Date) {
        // Usar UTC para evitar problemas de zona horaria
        startYear = startDate.getUTCFullYear();
        startMonth = startDate.getUTCMonth();
        startDay = startDate.getUTCDate();
      } else {
        // Si es string, parsearlo manualmente
        const dateStr = startDate.toString();
        const parts = dateStr.split("T")[0].split("-");
        startYear = parseInt(parts[0]);
        startMonth = parseInt(parts[1]) - 1; // Los meses en JS son 0-indexed
        startDay = parseInt(parts[2]);
      }

      const startDateOnly = new Date(startYear, startMonth, startDay);

      // Rechazar si la fecha de inicio es hoy o anterior (permitir desde mañana)
      if (startDateOnly.getTime() <= today.getTime()) {
        errors.push(
          "El evento debe crearse con al menos un día de anticipación. La fecha de inicio debe ser a partir de mañana",
        );
      }
    }

    // Validar que la fecha de finalización no sea en el pasado (solo al crear)
    if (!existingData && endDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDateOnly = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );

      // Solo rechazar si la fecha de fin es anterior a hoy (no incluye el día actual)
      if (endDateOnly < today) {
        errors.push("La fecha de finalización no puede ser en el pasado");
      }
    }

    // Validar que la fecha de fin sea posterior o igual a la de inicio
    if (startDate && endDate) {
      // Comparar solo las fechas (sin hora)
      const startDateOnly = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      const endDateOnly = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );

      if (endDateOnly < startDateOnly) {
        errors.push(
          "La fecha de fin debe ser posterior o igual a la fecha de inicio",
        );
      }

      // Validar que si es el mismo día, la hora de fin sea posterior a la de inicio
      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        const startTime =
          data.startTime || (existingData ? existingData.startTime : null);
        const endTime =
          data.endTime || (existingData ? existingData.endTime : null);

        if (startTime && endTime) {
          const [startHour, startMin] = startTime.split(":").map(Number);
          const [endHour, endMin] = endTime.split(":").map(Number);
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;

          if (endMinutes <= startMinutes) {
            errors.push(
              "La hora de fin debe ser posterior a la hora de inicio cuando es el mismo día",
            );
          }
        }
      }
    }

    // Validar que categoryIds y typeId existan (se validará en la BD)
    if (data.categoryIds !== undefined && data.categoryIds !== null) {
      if (Array.isArray(data.categoryIds) && data.categoryIds.length > 0) {
        const invalidIds = data.categoryIds.filter((id) => parseInt(id) < 1);
        if (invalidIds.length > 0) {
          errors.push("Todos los IDs de categoría deben ser mayores a 0");
        }
      }
    }

    if (data.typeId !== undefined && data.typeId !== null) {
      const typeId = parseInt(data.typeId);
      if (typeId < 1) {
        errors.push("El ID de tipo de evento debe ser mayor a 0");
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(". "));
    }
  }

  /**
   * Validar si una URL es de Cloudinary
   */
  isValidCloudinaryUrl(url) {
    if (!url || typeof url !== "string") return false;

    // Validar que sea una URL válida
    try {
      const urlObj = new URL(url);
      // Verificar que sea de Cloudinary
      return urlObj.hostname.includes("cloudinary.com");
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
    if (frontendData.description !== undefined)
      backendData.description = frontendData.description
        ? frontendData.description.trim()
        : null;
    if (frontendData.startDate) {
      // Crear fecha sin problemas de zona horaria
      const startDateStr = frontendData.startDate.toString();
      if (startDateStr.includes("T")) {
        // Si viene con hora (ISO string), usar directamente
        backendData.startDate = new Date(frontendData.startDate);
      } else {
        // Si viene solo la fecha (YYYY-MM-DD), agregar hora local para evitar cambios de zona horaria
        backendData.startDate = new Date(startDateStr + "T12:00:00");
      }
    }
    if (frontendData.endDate) {
      // Crear fecha sin problemas de zona horaria
      const endDateStr = frontendData.endDate.toString();
      if (endDateStr.includes("T")) {
        // Si viene con hora (ISO string), usar directamente
        backendData.endDate = new Date(frontendData.endDate);
      } else {
        // Si viene solo la fecha (YYYY-MM-DD), agregar hora local para evitar cambios de zona horaria
        backendData.endDate = new Date(endDateStr + "T12:00:00");
      }
    }
    if (frontendData.startTime) backendData.startTime = frontendData.startTime;
    if (frontendData.endTime) backendData.endTime = frontendData.endTime;
    if (frontendData.location)
      backendData.location = frontendData.location.trim();
    if (frontendData.phone) backendData.phone = frontendData.phone.trim();
    if (frontendData.status) backendData.status = frontendData.status;
    if (frontendData.imageUrl !== undefined)
      backendData.imageUrl = frontendData.imageUrl || null;
    if (frontendData.scheduleFile !== undefined)
      backendData.scheduleFile = frontendData.scheduleFile || null;
    if (frontendData.publish !== undefined)
      backendData.publish = Boolean(frontendData.publish);
    if (frontendData.categoryIds !== undefined) {
      backendData.categoryIds = Array.isArray(frontendData.categoryIds)
        ? frontendData.categoryIds.map((id) => parseInt(id))
        : [];
    }
    // Manejar patrocinadores (puede venir como sponsorNames o patrocinador)
    if (frontendData.sponsorNames !== undefined) {
      backendData.sponsorNames = Array.isArray(frontendData.sponsorNames)
        ? frontendData.sponsorNames
        : [];
    } else if (frontendData.patrocinador !== undefined) {
      backendData.sponsorNames = Array.isArray(frontendData.patrocinador)
        ? frontendData.patrocinador
        : [];
    }
    if (frontendData.typeId) backendData.typeId = parseInt(frontendData.typeId);

    return backendData;
  }

  /**
   * Actualizar automáticamente el estado de eventos finalizados
   * Este método debe ejecutarse periódicamente o al obtener eventos
   */
  async updateFinishedEventsStatus() {
    try {
      // Usar la zona horaria de Bogotá, Colombia
      const now = new Date();
      const bogotaTime = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Bogota" }),
      );

      const today =
        bogotaTime.getFullYear() +
        "-" +
        String(bogotaTime.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(bogotaTime.getDate()).padStart(2, "0");
      const currentTime =
        String(bogotaTime.getHours()).padStart(2, "0") +
        ":" +
        String(bogotaTime.getMinutes()).padStart(2, "0");

      // Primero, actualizar eventos que deberían estar en curso
      const eventsToStartInProgress =
        await this.eventsRepository.findEventsToStartInProgress(
          today,
          currentTime,
        );

      if (eventsToStartInProgress.length > 0) {
        await this.eventsRepository.updateMultipleStatuses(
          eventsToStartInProgress.map((e) => e.id),
          "En_curso",
        );
      }

      // Luego, buscar eventos que deberían estar finalizados
      const eventsToUpdate = await this.eventsRepository.findEventsToFinalize(
        today,
        currentTime,
      );

      if (eventsToUpdate.length > 0) {
        await this.eventsRepository.updateMultipleStatuses(
          eventsToUpdate.map((e) => e.id),
          "Finalizado",
        );
      }

      return {
        inProgress: eventsToStartInProgress.length,
        finished: eventsToUpdate.length,
      };
    } catch (error) {
      return {
        inProgress: 0,
        finished: 0,
      };
    }
  }

  /**
   * Obtener deportistas disponibles para inscribir en un evento
   */
  async getAvailableAthletes(eventId, filters) {
    try {
      // Verificar que el evento existe
      const event = await this.eventsRepository.findById(eventId);
      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "Evento no encontrado.",
        };
      }

      const result = await this.eventsRepository.getAvailableAthletes(
        eventId,
        filters,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Inscribir deportista en un evento
   */
  async enrollAthlete(eventId, athleteId, data = {}) {
    try {
      const result = await this.eventsRepository.enrollAthlete(
        eventId,
        athleteId,
        data,
      );

      return {
        success: true,
        data: result,
        message: `Deportista ${result.athlete.fullName} inscrita exitosamente en el evento.`,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Desinscribir deportista de un evento
   */
  async unenrollAthlete(eventId, athleteId) {
    try {
      const result = await this.eventsRepository.unenrollAthlete(
        eventId,
        athleteId,
      );

      return {
        success: true,
        message: `${result.athleteName} ha sido desinscrita del evento exitosamente.`,
      };
    } catch (error) {
      throw error;
    }
  }
}
