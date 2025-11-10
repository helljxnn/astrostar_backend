import prisma from "../../../config/database.js";

// Horario laboral simulado (en un caso real, esto vendría de la base de datos)
const specialistSchedules = {
  // 'specialistId': { start: 'HH:mm', end: 'HH:mm' }
  1: { start: '08:00', end: '17:00' }, // Dr. Juan Gómez
  2: { start: '09:00', end: '18:00' }, // Lic. Carlos Ruiz
  // ...otros especialistas
};

export class AppointmentController {
  /**
   * Obtiene todas las citas.
   */
  GetAll = async (req, res) => {
    try {
      const appointments = await prisma.appointment.findMany({
        include: {
          // Incluye aquí las relaciones cuando las tengas (athlete, specialist)
        },
        orderBy: {
          start: 'asc',
        },
      });
      res.status(200).json({ success: true, data: appointments });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };

  /**
   * Crea una nueva cita.
   */
  Create = async (req, res) => {
    try {
      const { title, description, start, end, athleteId, specialistId, specialtyId } = req.body;

      if (!title || !start || !end || !athleteId || !specialistId || !specialtyId) {
        return res.status(400).json({ success: false, message: "All fields are required." });
      }

      const startTime = new Date(start);
      const endTime = new Date(end);

      // Validación de Horario del Especialista
      const schedule = specialistSchedules[specialistId];
      if (schedule) {
        const appointmentTime = startTime.toTimeString().slice(0, 5);
        if (appointmentTime < schedule.start || appointmentTime >= schedule.end) {
          return res.status(400).json({
            success: false,
            message: `The selected time is outside the specialist's working hours (${schedule.start} - ${schedule.end}).`,
          });
        }
      }

      // Validación de Cita Existente
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          specialistId: parseInt(specialistId),
          status: { not: 'CANCELLED' },
          OR: [
            { start: { lt: endTime, gte: startTime } }, // Cita existente empieza durante la nueva
            { end: { gt: startTime, lte: endTime } },   // Cita existente termina durante la nueva
          ],
        },
      });

      if (existingAppointment) {
        return res.status(409).json({ success: false, message: "The specialist already has an appointment at this time." });
      }

      const newAppointment = await prisma.appointment.create({
        data: {
          title,
          description,
          start: startTime,
          end: endTime,
          athleteId: parseInt(athleteId),
          specialistId: parseInt(specialistId),
          specialtyId: parseInt(specialtyId),
          status: 'PENDING',
        },
      });

      res.status(201).json({ success: true, message: "Appointment created successfully.", data: newAppointment });
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
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
        return res.status(400).json({ success: false, message: "A reason for cancellation is required." });
      }

      const appointment = await prisma.appointment.findUnique({ where: { id: parseInt(id) } });

      if (!appointment) {
        return res.status(404).json({ success: false, message: "Appointment not found." });
      }

      if (appointment.status === 'CANCELLED') {
        return res.status(400).json({ success: false, message: "This appointment has already been cancelled." });
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: {
          status: 'CANCELLED',
          reasonForCancellation: reason,
        },
      });

      res.status(200).json({ success: true, message: "Appointment cancelled successfully.", data: updatedAppointment });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };
}