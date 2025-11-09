import prisma from "../../../config/database.js";

export class AppointmentController {
  // Crear una nueva cita
  Create = async (req, res) => {
    try {
      const { title, date, time, description } = req.body;

      if (!title || !date || !time) {
        return res.status(400).json({
          success: false,
          message: "Fields 'title', 'date' and 'time' are required.",
        });
      }

      const appointment = await prisma.appointment.create({
        data: { title, date: new Date(date), time, description },
      });

      res.status(201).json({
        success: true,
        message: "Appointment created successfully.",
        data: appointment,
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };

  // Obtener todas las citas (con búsqueda opcional)
  GetAll = async (req, res) => {
    try {
      const { search = "" } = req.query;
      const where = search
        ? { title: { contains: search, mode: "insensitive" } }
        : {};

      const appointments = await prisma.appointment.findMany({
        where,
        orderBy: { date: "desc" },
      });

      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };

  // Obtener una cita por ID
  GetById = async (req, res) => {
    try {
      const { id } = req.params;
      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };

  // Actualizar cita
  Update = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const updated = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data,
      });

      res.status(200).json({
        success: true,
        message: "Appointment updated successfully.",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };

  // Cambiar estado (completar o cancelar)
  ChangeStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["COMPLETED", "CANCELLED"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either COMPLETED or CANCELLED.",
        });
      }

      const updated = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: { status },
      });

      res.status(200).json({
        success: true,
        message: "Appointment status updated.",
        data: updated,
      });
    } catch (error) {
      console.error("Error changing appointment status:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };

  // Eliminar cita
  Delete = async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.appointment.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({
        success: true,
        message: "Appointment deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };
}
