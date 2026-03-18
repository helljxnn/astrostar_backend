import { AppointmentRepository } from "../repository/AppointmentManagement.repository.js";
import emailService from "../../../../services/emailService.js";
import appointmentEmailService from "./AppointmentEmail.service.js";

const SPECIALTY_LABELS = {
  psicologia: "PsicologÃ­a",
  fisioterapia: "Fisioterapia",
  nutricion: "NutriciÃ³n",
  medicina: "Medicina Deportiva",
};

const APPOINTMENT_ALLOWED_SPECIALTIES = new Set([
  "psicologia",
  "fisioterapia",
  "nutricion",
]);

export class AppointmentService {
  constructor() {
    this.appointmentRepository = new AppointmentRepository();
  }

  pad2(value) {
    return String(value).padStart(2, "0");
  }

  getDateKey(value) {
    if (!value) return "";

    // Keep literal YYYY-MM-DD without timezone side effects.
    if (typeof value === "string") {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) return `${match[1]}-${match[2]}-${match[3]}`;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return "";
      return `${parsed.getFullYear()}-${this.pad2(parsed.getMonth() + 1)}-${this.pad2(parsed.getDate())}`;
    }

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return "";

      // Prisma Date fields (date-only) usually come as UTC midnight.
      const isLikelyDateOnlyUtc =
        value.getUTCHours() === 0 &&
        value.getUTCMinutes() === 0 &&
        value.getUTCSeconds() === 0 &&
        value.getUTCMilliseconds() === 0;

      if (isLikelyDateOnlyUtc) {
        return `${value.getUTCFullYear()}-${this.pad2(value.getUTCMonth() + 1)}-${this.pad2(value.getUTCDate())}`;
      }

      return `${value.getFullYear()}-${this.pad2(value.getMonth() + 1)}-${this.pad2(value.getDate())}`;
    }

    return "";
  }

  normalizeDateOnly(value) {
    const dateKey = this.getDateKey(value);
    if (!dateKey) return null;
    return new Date(`${dateKey}T00:00:00`);
  }

  formatDateKey(value) {
    return this.getDateKey(value);
  }

  formatTime(value) {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toTimeString().slice(0, 5);
  }

  normalizeText(value) {
    return value ? String(value).trim().replace(/\s+/g, " ") : "";
  }

  normalizeKey(value) {
    return value
      ? String(value)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "")
      : "";
  }

  normalizeRoleKey(value) {
    return this.normalizeKey(value);
  }

  async resolveScopeFilters(filters = {}, user = null) {
    const scoped = { ...filters };
    const roleKey = this.normalizeRoleKey(user?.role?.name || user?.rol || "");
    const isAdmin = roleKey === "admin" || roleKey === "administrador";
    const isAthlete = roleKey === "athlete" || roleKey === "deportista";

    if (isAthlete) {
      const athleteId = user?.athlete?.id || null;
      if (athleteId) {
        scoped.athleteId = parseInt(athleteId);
      }
      return scoped;
    }

    if (isAdmin) {
      return scoped;
    }

    const employeeIdFromToken = user?.employee?.id || null;
    if (employeeIdFromToken) {
      scoped.specialistId = parseInt(employeeIdFromToken);
      return scoped;
    }

    const employee = await this.appointmentRepository.findEmployeeByUserId(
      user?.id,
    );
    if (employee?.id) {
      scoped.specialistId = parseInt(employee.id);
    }

    return scoped;
  }

  resolveSpecialtyKey(rawValue) {
    const key = this.normalizeKey(rawValue);
    if (!key) return "";
    if (key.includes("psicolog")) return "psicologia";
    if (key.includes("fisioterap") || key.includes("fisio"))
      return "fisioterapia";
    if (key.includes("nutric")) return "nutricion";
    if (key.includes("medic")) return "medicina";
    return key;
  }

  resolveSpecialtyLabel(key) {
    return (
      SPECIALTY_LABELS[key] ||
      (key ? key.charAt(0).toUpperCase() + key.slice(1) : "")
    );
  }

  parseDateTimePayload(data = {}) {
    let startValue = data.start || data.startDateTime || null;
    let endValue = data.end || data.endDateTime || null;

    if (
      (!startValue || !endValue) &&
      data.date &&
      data.startTime &&
      data.endTime
    ) {
      startValue = `${data.date}T${data.startTime}`;
      endValue = `${data.date}T${data.endTime}`;
    }

    if (!startValue || !endValue) {
      throw new Error("Debe proporcionar la fecha y hora de inicio y fin.");
    }

    const startDate = new Date(startValue);
    const endDate = new Date(endValue);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new Error("La fecha y hora de la cita no son vÃ¡lidas.");
    }

    return { startDate, endDate };
  }

  parseCustomRecurrence(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  normalizeFrequency(value = "") {
    const frequency = String(value || "").toLowerCase();
    if (frequency === "ao" || frequency === "ano") return "anio";
    return frequency || "semana";
  }

  isSameDate(first, second) {
    const a = this.normalizeDateOnly(first);
    const b = this.normalizeDateOnly(second);
    if (!a || !b) return false;
    return a.getTime() === b.getTime();
  }

  timeToMinutes(value) {
    if (!value) return null;
    const [hours, minutes] = String(value).split(":");
    const parsedHours = Number(hours);
    const parsedMinutes = Number(minutes);
    if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) return null;
    return parsedHours * 60 + parsedMinutes;
  }

  isTimeRangeOverlap(startA, endA, startB, endB) {
    if ([startA, endA, startB, endB].some((value) => value === null))
      return false;
    return startA < endB && endA > startB;
  }

  getNoveltiesForDate(schedule, targetDate) {
    const novelties = Array.isArray(schedule?.novelties)
      ? schedule.novelties
      : [];
    return novelties.filter((novelty) =>
      this.isSameDate(novelty?.date, targetDate),
    );
  }

  isScheduleBlockedByNovelty(schedule, targetDate, startTime, endTime) {
    const novelties = this.getNoveltiesForDate(schedule, targetDate);
    if (novelties.length === 0) return false;

    const appointmentStart = this.timeToMinutes(startTime);
    const appointmentEnd = this.timeToMinutes(endTime);
    if (appointmentStart === null || appointmentEnd === null) return true;

    return novelties.some((novelty) => {
      const type = this.normalizeKey(
        novelty?.type || novelty?.tipoCancelacion || "full",
      );
      if (type === "full") return true;
      const noveltyStart = this.timeToMinutes(novelty?.startTime);
      const noveltyEnd = this.timeToMinutes(novelty?.endTime);
      if (noveltyStart === null || noveltyEnd === null) return true;
      return this.isTimeRangeOverlap(
        appointmentStart,
        appointmentEnd,
        noveltyStart,
        noveltyEnd,
      );
    });
  }

  differenceInDays(dateA, dateB) {
    const a = this.normalizeDateOnly(dateA);
    const b = this.normalizeDateOnly(dateB);
    if (!a || !b) return 0;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((a - b) / msPerDay);
  }

  differenceInWeeks(dateA, dateB) {
    return Math.floor(this.differenceInDays(dateA, dateB) / 7);
  }

  differenceInMonths(dateA, dateB) {
    const a = this.normalizeDateOnly(dateA);
    const b = this.normalizeDateOnly(dateB);
    if (!a || !b) return 0;
    return (
      (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth())
    );
  }

  differenceInYears(dateA, dateB) {
    const a = this.normalizeDateOnly(dateA);
    const b = this.normalizeDateOnly(dateB);
    if (!a || !b) return 0;
    return a.getFullYear() - b.getFullYear();
  }

  isCustomRecurrenceActiveOnDate(schedule, targetDate, baseDate) {
    const custom = this.parseCustomRecurrence(schedule.customRecurrence);
    if (!custom) return false;

    const interval = Number(custom.interval) || 1;
    const frequency = this.normalizeFrequency(custom.frequency || "semana");
    const dias = Array.isArray(custom.dias) ? custom.dias : [];
    const endType = custom.endType || "";
    const endDateValue =
      endType === "el"
        ? custom.endDate
        : endType === "despues"
          ? custom.afterDate
          : custom.endDate || custom.afterDate;

    if (endDateValue) {
      const limit = this.normalizeDateOnly(endDateValue);
      if (limit && targetDate > limit) return false;
    }

    if (this.isSameDate(targetDate, baseDate)) return true;

    if (dias.length > 0) {
      const daysDiff = this.differenceInDays(targetDate, baseDate);
      const weeksDiff = this.differenceInWeeks(targetDate, baseDate);

      if (frequency === "dia" && daysDiff % interval !== 0) return false;
      if (frequency === "semana" && weeksDiff % interval !== 0) return false;
      if ((frequency === "mes" || frequency === "anio") && daysDiff % 7 !== 0) {
        return false;
      }

      return dias.includes(targetDate.getDay());
    }

    if (frequency === "dia") {
      return this.differenceInDays(targetDate, baseDate) % interval === 0;
    }
    if (frequency === "semana") {
      return (
        targetDate.getDay() === baseDate.getDay() &&
        this.differenceInWeeks(targetDate, baseDate) % interval === 0
      );
    }
    if (frequency === "mes") {
      return (
        targetDate.getDate() === baseDate.getDate() &&
        this.differenceInMonths(targetDate, baseDate) % interval === 0
      );
    }
    if (frequency === "anio") {
      return (
        targetDate.getDate() === baseDate.getDate() &&
        targetDate.getMonth() === baseDate.getMonth() &&
        this.differenceInYears(targetDate, baseDate) % interval === 0
      );
    }

    return false;
  }

  isScheduleActiveOnDate(schedule, date) {
    if (!schedule?.scheduleDate) return false;
    const targetDate = this.normalizeDateOnly(date);
    const baseDate = this.normalizeDateOnly(schedule.scheduleDate);
    if (!targetDate || !baseDate) return false;
    if (targetDate < baseDate) return false;

    const recurrenceRaw = String(
      schedule.recurrence || schedule.repeticion || "no",
    ).toLowerCase();
    const recurrence = recurrenceRaw === "ao" ? "anio" : recurrenceRaw;
    const interval = Number(schedule.intervalo) || 1;

    if (recurrence === "personalizado") {
      return this.isCustomRecurrenceActiveOnDate(
        schedule,
        targetDate,
        baseDate,
      );
    }
    if (recurrence === "no") return this.isSameDate(targetDate, baseDate);
    if (recurrence === "laboral") {
      if (this.isSameDate(targetDate, baseDate)) return true;
      const day = targetDate.getDay();
      return day >= 1 && day <= 5;
    }
    if (recurrence === "dia") {
      return this.differenceInDays(targetDate, baseDate) % interval === 0;
    }
    if (recurrence === "semana") {
      return (
        targetDate.getDay() === baseDate.getDay() &&
        this.differenceInWeeks(targetDate, baseDate) % interval === 0
      );
    }
    if (recurrence === "mes") {
      return (
        targetDate.getDate() === baseDate.getDate() &&
        this.differenceInMonths(targetDate, baseDate) % interval === 0
      );
    }
    if (recurrence === "anio") {
      return (
        targetDate.getDate() === baseDate.getDate() &&
        targetDate.getMonth() === baseDate.getMonth() &&
        this.differenceInYears(targetDate, baseDate) % interval === 0
      );
    }

    return false;
  }

  isTimeWithinSchedule(schedule, startTime, endTime) {
    const scheduleStart = this.timeToMinutes(schedule.startTime);
    const scheduleEnd = this.timeToMinutes(schedule.endTime);
    const appointmentStart = this.timeToMinutes(startTime);
    const appointmentEnd = this.timeToMinutes(endTime);
    if (
      [scheduleStart, scheduleEnd, appointmentStart, appointmentEnd].some(
        (value) => value === null,
      )
    ) {
      return false;
    }
    return appointmentStart >= scheduleStart && appointmentEnd <= scheduleEnd;
  }

  async ensureScheduleAvailability({
    specialistId,
    appointmentDate,
    startTime,
    endTime,
  }) {
    const schedules =
      await this.appointmentRepository.getSchedulesBySpecialistId(specialistId);
    if (!schedules || schedules.length === 0) {
      throw new Error("El especialista no tiene horarios disponibles.");
    }

    const dateOnly = this.normalizeDateOnly(appointmentDate);
    const matchingSchedules = schedules.filter(
      (schedule) =>
        this.isScheduleActiveOnDate(schedule, dateOnly) &&
        this.isTimeWithinSchedule(schedule, startTime, endTime),
    );

    if (matchingSchedules.length === 0) {
      throw new Error(
        "El especialista no tiene horario disponible para esa fecha y hora.",
      );
    }

    const hasAvailableSchedule = matchingSchedules.some(
      (schedule) =>
        !this.isScheduleBlockedByNovelty(
          schedule,
          dateOnly,
          startTime,
          endTime,
        ),
    );

    if (!hasAvailableSchedule) {
      throw new Error("El especialista tiene una novedad en ese horario.");
    }
  }

  /**
   * Obtener todas las citas con filtros
   */
  async getAllAppointments(filters = {}, user = null) {
    try {
      const scopedFilters = await this.resolveScopeFilters(filters, user);
      return await this.appointmentRepository.findAll(scopedFilters);
    } catch (error) {
      console.error("Service error - getAllAppointments:", error);
      throw error;
    }
  }

  /**
   * Obtener cita por ID
   */
  async getAppointmentById(id) {
    try {
      const appointment = await this.appointmentRepository.findById(id);
      if (!appointment) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontrÃ³ la cita con ID ${id}.`,
        };
      }
      return {
        success: true,
        data: appointment,
      };
    } catch (error) {
      console.error("Service error - getAppointmentById:", error);
      throw error;
    }
  }

  /**
   * Crear cita con validaciones
   */
  async createAppointment(appointmentData) {
    try {
      const athleteId = parseInt(
        appointmentData.athleteId || appointmentData.athlete,
      );
      const specialistId = parseInt(
        appointmentData.specialistId || appointmentData.specialist,
      );

      if (!athleteId || !specialistId) {
        throw new Error("El deportista y el especialista son obligatorios.");
      }

      const athlete =
        await this.appointmentRepository.findAthleteById(athleteId);
      if (!athlete) {
        throw new Error("El deportista no existe o no estÃ¡ activo.");
      }

      const specialist =
        await this.appointmentRepository.findSpecialistById(specialistId);
      if (!specialist) {
        throw new Error("El especialista no existe o no estÃ¡ activo.");
      }

      const { startDate, endDate } = this.parseDateTimePayload(appointmentData);

      if (endDate <= startDate) {
        throw new Error("La hora de fin debe ser mayor que la hora de inicio.");
      }

      const now = new Date();
      const PAST_GRACE_MS = 60 * 1000; // prevent false negatives around current minute
      if (startDate.getTime() < now.getTime() - PAST_GRACE_MS) {
        throw new Error(
          "No se puede crear una cita en una fecha u hora pasada.",
        );
      }

      const startDateKey = this.formatDateKey(startDate);
      const endDateKey = this.formatDateKey(endDate);
      if (startDateKey !== endDateKey) {
        throw new Error("La cita debe iniciar y finalizar el mismo dÃ­a.");
      }

      const appointmentDate = this.normalizeDateOnly(startDate);
      const startTime = this.formatTime(startDate);
      const endTime = this.formatTime(endDate);

      const specialtyInput =
        appointmentData.specialty || appointmentData.especialidad || "";
      const specialtyKey =
        this.resolveSpecialtyKey(specialtyInput) ||
        this.resolveSpecialtyKey(specialist?.user?.role?.name);

      if (!specialtyKey) {
        throw new Error("La especialidad es obligatoria.");
      }

      await this.ensureScheduleAvailability({
        specialistId,
        appointmentDate,
        startTime,
        endTime,
      });

      const conflicts =
        await this.appointmentRepository.checkAppointmentConflicts({
          appointmentDate,
          startTime,
          endTime,
          athleteId,
          specialistId,
        });

      if (conflicts.athleteConflict) {
        throw new Error(
          "El deportista ya tiene una cita programada en ese horario.",
        );
      }

      if (conflicts.specialistConflict) {
        throw new Error(
          "El especialista ya tiene una cita programada en ese horario.",
        );
      }

      const appointmentDataForDB = {
        athleteId,
        specialistId,
        appointmentDate,
        startTime,
        endTime,
        specialty: specialtyKey,
        description:
          this.normalizeText(
            appointmentData.description || appointmentData.motivo,
          ) || null,
        status: appointmentData.status || "Programado",
        cancelReason: null,
        conclusion: null,
      };

      const newAppointment =
        await this.appointmentRepository.create(appointmentDataForDB);
      const athleteName =
        `${athlete.user.firstName} ${athlete.user.lastName}`.trim();
      const specialistName =
        `${specialist.user.firstName} ${specialist.user.lastName}`.trim();

      // Notificar al deportista por email (no bloqueante)
      emailService
        .sendAppointmentCalendarEmail({
          to: athlete.user.email,
          athleteName,
          appointmentData: {
            date: newAppointment.appointmentDate,
            startTime: newAppointment.startTime,
            endTime: newAppointment.endTime,
            specialistName,
            description:
              newAppointment.description ||
              `Cita de ${this.resolveSpecialtyLabel(specialtyKey)}`,
          },
        })
        .catch((err) =>
          console.warn("Error enviando email de cita:", err?.message),
        );

      return {
        success: true,
        data: newAppointment,
        message: `Cita para "${athleteName}" creada exitosamente.`,
      };
    } catch (error) {
      console.error("Service error - createAppointment:", error);
      throw error;
    }
  }

  /**
   * Actualizar cita
   */
  async updateAppointment(id, updateData) {
    try {
      const existingAppointment = await this.appointmentRepository.findById(id);
      if (!existingAppointment) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontrÃ³ la cita con ID ${id}.`,
        };
      }

      if (
        existingAppointment.status === "Cancelado" ||
        existingAppointment.status === "Completado"
      ) {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede editar una cita cancelada o completada.",
        };
      }

      const payload = {};

      const athleteId = updateData.athleteId || updateData.athlete;
      const specialistId = updateData.specialistId || updateData.specialist;

      if (athleteId) {
        const athlete =
          await this.appointmentRepository.findAthleteById(athleteId);
        if (!athlete) {
          return {
            success: false,
            statusCode: 400,
            message: "El deportista no existe o no estÃ¡ activo.",
          };
        }
        payload.athleteId = parseInt(athleteId);
      }

      if (specialistId) {
        const specialist =
          await this.appointmentRepository.findSpecialistById(specialistId);
        if (!specialist) {
          return {
            success: false,
            statusCode: 400,
            message: "El especialista no existe o no estÃ¡ activo.",
          };
        }
        payload.specialistId = parseInt(specialistId);
      }

      if (updateData.specialty) {
        payload.specialty = this.resolveSpecialtyKey(updateData.specialty);
      }

      if (
        updateData.description !== undefined ||
        updateData.motivo !== undefined
      ) {
        payload.description =
          this.normalizeText(updateData.description || updateData.motivo) ||
          null;
      }

      const hasDateUpdate =
        updateData.start ||
        updateData.end ||
        (updateData.date && updateData.startTime && updateData.endTime);

      if (hasDateUpdate) {
        const existingDateKey = this.formatDateKey(
          existingAppointment.appointmentDate,
        );
        const existingStart = new Date(
          `${existingDateKey}T${existingAppointment.startTime}`,
        );
        const existingEnd = new Date(
          `${existingDateKey}T${existingAppointment.endTime}`,
        );

        const startCandidate =
          updateData.start ||
          (updateData.date && updateData.startTime
            ? `${updateData.date}T${updateData.startTime}`
            : existingStart);
        const endCandidate =
          updateData.end ||
          (updateData.date && updateData.endTime
            ? `${updateData.date}T${updateData.endTime}`
            : existingEnd);

        const { startDate, endDate } = this.parseDateTimePayload({
          start: startCandidate,
          end: endCandidate,
        });

        if (endDate <= startDate) {
          throw new Error(
            "La hora de fin debe ser mayor que la hora de inicio.",
          );
        }

        const startKey = this.formatDateKey(startDate);
        const endKey = this.formatDateKey(endDate);
        if (startKey !== endKey) {
          throw new Error("La cita debe iniciar y finalizar el mismo dÃ­a.");
        }

        const now = new Date();
        const PAST_GRACE_MS = 60 * 1000;
        if (startDate.getTime() < now.getTime() - PAST_GRACE_MS) {
          throw new Error("No se puede reprogramar a una fecha u hora pasada.");
        }

        payload.appointmentDate = this.normalizeDateOnly(startDate);
        payload.startTime = this.formatTime(startDate);
        payload.endTime = this.formatTime(endDate);

        const conflicts =
          await this.appointmentRepository.checkAppointmentConflicts({
            appointmentDate: payload.appointmentDate,
            startTime: payload.startTime,
            endTime: payload.endTime,
            athleteId: payload.athleteId || existingAppointment.athleteId,
            specialistId:
              payload.specialistId || existingAppointment.specialistId,
            excludeAppointmentId: id,
          });

        if (conflicts.athleteConflict) {
          throw new Error(
            "El deportista ya tiene una cita programada en ese horario.",
          );
        }

        if (conflicts.specialistConflict) {
          throw new Error(
            "El especialista ya tiene una cita programada en ese horario.",
          );
        }
      }

      const shouldValidateSchedule =
        hasDateUpdate || Boolean(payload.specialistId);
      if (shouldValidateSchedule) {
        const appointmentDate =
          payload.appointmentDate || existingAppointment.appointmentDate;
        const startTime = payload.startTime || existingAppointment.startTime;
        const endTime = payload.endTime || existingAppointment.endTime;

        await this.ensureScheduleAvailability({
          specialistId:
            payload.specialistId || existingAppointment.specialistId,
          appointmentDate,
          startTime,
          endTime,
        });
      }

      const updatedAppointment = await this.appointmentRepository.update(
        id,
        payload,
      );
      return {
        success: true,
        data: updatedAppointment,
        message: "Cita actualizada exitosamente.",
      };
    } catch (error) {
      console.error("Service error - updateAppointment:", error);
      throw error;
    }
  }

  /**
   * Cancelar cita
   */
  async cancelAppointment(id, cancelReason) {
    try {
      const appointment = await this.appointmentRepository.findById(id);
      if (!appointment) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontrÃ³ la cita con ID ${id}.`,
        };
      }

      if (appointment.status === "Cancelado") {
        return {
          success: false,
          statusCode: 400,
          message: "La cita ya estÃ¡ cancelada.",
        };
      }

      if (appointment.status === "Completado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede cancelar una cita completada.",
        };
      }

      const updatedAppointment = await this.appointmentRepository.update(id, {
        status: "Cancelado",
        cancelReason: this.normalizeText(cancelReason) || null,
        conclusion: null,
      });

      // Enviar correos de cancelaciÃ³n (no bloqueante)
      if (
        appointment.athlete &&
        appointment.athlete.user &&
        appointment.specialist &&
        appointment.specialist.user
      ) {
        const athleteName =
          `${appointment.athlete.user.firstName || ""} ${appointment.athlete.user.lastName || ""}`.trim() ||
          "Deportista";
        const specialistName =
          `${appointment.specialist.user.firstName || ""} ${appointment.specialist.user.lastName || ""}`.trim() ||
          "Especialista";

        appointmentEmailService
          .sendAppointmentCancelled(
            {
              ...updatedAppointment,
              specialty: this.resolveSpecialtyLabel(appointment.specialty),
            },
            appointment.athlete.user.email,
            athleteName,
            appointment.specialist.user.email,
            specialistName,
            cancelReason,
          )
          .catch((err) =>
            console.warn("Error enviando emails de cancelaciÃ³n:", err?.message),
          );
      }

      return {
        success: true,
        data: updatedAppointment,
        message: "Cita cancelada exitosamente.",
      };
    } catch (error) {
      console.error("Service error - cancelAppointment:", error);
      throw error;
    }
  }

  /**
   * Completar cita
   */
  async completeAppointment(id, conclusion) {
    try {
      const appointment = await this.appointmentRepository.findById(id);
      if (!appointment) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontrÃ³ la cita con ID ${id}.`,
        };
      }

      if (appointment.status === "Completado") {
        return {
          success: false,
          statusCode: 400,
          message: "La cita ya estÃ¡ completada.",
        };
      }

      if (appointment.status === "Cancelado") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede completar una cita cancelada.",
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const apptDate = new Date(appointment.appointmentDate);
      apptDate.setHours(0, 0, 0, 0);
      if (apptDate > today) {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede completar una cita que aÃºn no ha ocurrido.",
        };
      }

      const updatedAppointment = await this.appointmentRepository.update(id, {
        status: "Completado",
        conclusion: this.normalizeText(conclusion) || null,
        cancelReason: null,
      });

      return {
        success: true,
        data: updatedAppointment,
        message: "Cita marcada como completada.",
      };
    } catch (error) {
      console.error("Service error - completeAppointment:", error);
      throw error;
    }
  }

  /**
   * Eliminar cita
   */
  async deleteAppointment(id) {
    try {
      const appointmentToDelete = await this.appointmentRepository.findById(id);
      if (!appointmentToDelete) {
        return {
          success: false,
          statusCode: 404,
          message: `No se encontrÃ³ la cita con ID ${id}.`,
        };
      }

      if (appointmentToDelete.status === "Completado") {
        return {
          success: false,
          statusCode: 400,
          message:
            "No se puede eliminar una cita completada. Considere cancelarla.",
        };
      }

      const deleted = await this.appointmentRepository.delete(id);
      if (deleted) {
        return {
          success: true,
          message: "Cita eliminada exitosamente.",
        };
      }
    } catch (error) {
      console.error("Service error - deleteAppointment:", error);
      throw error;
    }
  }

  /**
   * Obtener deportistas activos para el formulario
   */
  async getActiveAthletes(user = null) {
    try {
      const roleKey = this.normalizeRoleKey(
        user?.role?.name || user?.rol || "",
      );
      const isAdmin = roleKey === "admin" || roleKey === "administrador";
      const isHealthProfessional =
        roleKey === "profesionaldelasalud" || roleKey === "profesionaldesalud";

      const athletes = await this.appointmentRepository.getActiveAthletes();
      let formatted = athletes.map((athlete) => {
        const currentInscription = athlete.inscriptions?.[0] || null;
        const sportsCategory = currentInscription?.sportsCategory || null;
        const categoryId = sportsCategory?.id || null;
        const categoryName = sportsCategory?.nombre || "Sin categoria";

        return {
          id: athlete.id,
          athleteId: athlete.id,
          nombre:
            `${athlete.user.firstName} ${athlete.user.middleName || ""} ${athlete.user.lastName} ${athlete.user.secondLastName || ""}`
              .replace(/\s+/g, " ")
              .trim(),
          nombres: athlete.user.firstName,
          apellidos:
            `${athlete.user.lastName} ${athlete.user.secondLastName || ""}`.trim(),
          email: athlete.user.email,
          identification: athlete.user.identification,
          categoryId,
          categoryName,
          category: categoryName,
          categoria: categoryName,
          sportsCategoryId: categoryId,
          sportsCategory: sportsCategory
            ? {
                id: sportsCategory.id,
                nombre: sportsCategory.nombre,
                name: sportsCategory.nombre,
              }
            : null,
        };
      });

      // Los profesionales de salud solo ven deportistas activos (ya filtrado en la query)
      // pero podrÃ­amos agregar filtros adicionales aquÃ­ si fuera necesario

      return {
        success: true,
        data: formatted,
      };
    } catch (error) {
      console.error("Service error - getActiveAthletes:", error);
      throw error;
    }
  }

  /**
   * Obtener especialistas activos
   */
  async getActiveSpecialists({ specialty = "" } = {}) {
    try {
      const specialists =
        await this.appointmentRepository.getActiveSpecialists();
      const formatted = specialists
        .map((emp) => {
          const fullName =
            `${emp.user.firstName} ${emp.user.middleName || ""} ${emp.user.lastName} ${emp.user.secondLastName || ""}`
              .replace(/\s+/g, " ")
              .trim();
          const roleName = emp.user.role?.name || "Especialista";
          const specialtySource = emp.specialty || roleName;
          const specialtyKey = this.resolveSpecialtyKey(specialtySource);
          return {
            id: emp.id,
            specialistId: emp.id,
            nombre: fullName,
            cargo: roleName,
            specialty: specialtyKey,
            specialtyLabel: this.resolveSpecialtyLabel(specialtyKey),
            email: emp.user.email,
            identification: emp.user.identification,
          };
        })
        .filter((spec) => APPOINTMENT_ALLOWED_SPECIALTIES.has(spec.specialty));

      const normalizedFilter = this.resolveSpecialtyKey(specialty);
      const filtered =
        normalizedFilter &&
        APPOINTMENT_ALLOWED_SPECIALTIES.has(normalizedFilter)
          ? formatted.filter((spec) => spec.specialty === normalizedFilter)
          : normalizedFilter
            ? []
            : formatted;

      return {
        success: true,
        data: filtered,
      };
    } catch (error) {
      console.error("Service error - getActiveSpecialists:", error);
      throw error;
    }
  }

  /**
   * Obtener especialidades disponibles
   */
  async getSpecialties() {
    try {
      const specialists = await this.getActiveSpecialists();
      const map = new Map();
      (specialists.data || []).forEach((spec) => {
        if (!spec.specialty) return;
        if (!map.has(spec.specialty)) {
          map.set(
            spec.specialty,
            spec.specialtyLabel || this.resolveSpecialtyLabel(spec.specialty),
          );
        }
      });
      const specialties = Array.from(map.entries()).map(([key, label]) => ({
        value: key,
        label,
      }));
      return {
        success: true,
        data: specialties,
      };
    } catch (error) {
      console.error("Service error - getSpecialties:", error);
      throw error;
    }
  }
}

