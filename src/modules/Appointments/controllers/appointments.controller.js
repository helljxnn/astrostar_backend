import prisma from "../../../config/database.js";

export class AppointmentController {
  /**
   * Obtiene todas las citas con paginación.
   */
  GetAll = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};

      // Filtro por búsqueda (título o descripción)
      if (search && search.trim()) {
        where.OR = [
          { title: { contains: search.trim(), mode: "insensitive" } },
          { description: { contains: search.trim(), mode: "insensitive" } },
        ];
      }

      // Filtro por estado
      if (status && status.trim()) {
        where.status = status.trim();
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            // Incluye aquí las relaciones cuando las tengas (athlete, specialist)
          },
          orderBy: {
            start: "asc",
          },
        }),
        prisma.appointment.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: appointments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  };

  /**
   * Crea una nueva cita.
   */
  Create = async (req, res) => {
    try {
      const { description, start, end, athleteId, specialistId, specialty } =
        req.body;

      if (!start || !end || !athleteId || !specialistId || !specialty) {
        return res.status(400).json({
          success: false,
          message:
            "Los campos start, end, athleteId, specialistId y specialty son requeridos.",
        });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Las fechas start y end no son válidas.",
        });
      }

      // Extraer fecha y horas
      const appointmentDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      const startTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
      const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

      // Validación de Cita Existente
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          specialistId: parseInt(specialistId),
          appointmentDate,
          status: { not: "Cancelado" },
          startTime,
        },
      });

      if (existingAppointment) {
        return res.status(409).json({
          success: false,
          message: "El especialista ya tiene una cita en ese horario.",
        });
      }

      const newAppointment = await prisma.appointment.create({
        data: {
          description: description?.trim() || null,
          appointmentDate,
          startTime,
          endTime,
          specialty,
          athleteId: parseInt(athleteId),
          specialistId: parseInt(specialistId),
          status: "Programado",
        },
      });

      res.status(201).json({
        success: true,
        message: "Cita creada exitosamente.",
        data: newAppointment,
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  };

  /**
   * Cancela una cita.
   */
  Cancel = async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "A reason for cancellation is required.",
        });
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
      });

      if (!appointment) {
        return res
          .status(404)
          .json({ success: false, message: "Appointment not found." });
      }

      if (appointment.status === "CANCELLED") {
        return res.status(400).json({
          success: false,
          message: "This appointment has already been cancelled.",
        });
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: {
          status: "CANCELLED",
          reasonForCancellation: reason,
        },
      });

      res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully.",
        data: updatedAppointment,
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  };
}
