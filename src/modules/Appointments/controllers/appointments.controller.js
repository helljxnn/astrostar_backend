import prisma from "../../../config/database.js";

export class AppointmentController {
  /**
   * Creates a new appointment.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  create = async (req, res) => {
    try {
      const { title, date, time, description } = req.body;

      if (!title || !date || !time) {
        return res.status(400).json({
          success: false,
          message: "Fields 'title', 'date', and 'time' are required.",
        });
      }

      const appointment = await prisma.appointment.create({
        data: {
          title,
          date: new Date(date),
          time,
          description,
          status: "SCHEDULED",
        },
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

  /**
   * Retrieves all appointments, with optional search.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  getAll = async (req, res) => {
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

  /**
   * Retrieves a single appointment by its ID.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  getById = async (req, res) => {
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

  /**
   * Updates an existing appointment.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  update = async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Prevent changing status or cancellation reason via this endpoint
      delete data.status;
      delete data.cancellationReason;

      const updatedAppointment = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data,
      });

      res.status(200).json({
        success: true,
        message: "Appointment updated successfully.",
        data: updatedAppointment,
      });
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };

  /**
   * Cancels an appointment and records the reason.
   * @param {object} req - The request object.
   * @param {object} res - The response object.
   */
  cancel = async (req, res) => {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;

      if (!cancellationReason) {
        return res.status(400).json({
          success: false,
          message: "A 'cancellationReason' is required to cancel an appointment.",
        });
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(id) },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }

      if (appointment.status === 'CANCELLED') {
        return res.status(409).json({
            success: false,
            message: "This appointment has already been cancelled.",
        });
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id: parseInt(id) },
        data: {
          status: "CANCELLED",
          cancellationReason,
        },
      });

      res.status(200).json({
        success: true,
        message: "Appointment cancelled successfully.",
        data: updatedAppointment,
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  };
}
