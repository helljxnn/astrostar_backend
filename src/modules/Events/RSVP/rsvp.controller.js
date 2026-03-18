import { RSVPService } from "./rsvp.service.js";
import { getRSVPResponseHTML } from "../../../views/rsvpResponse.js";

export class RSVPController {
  constructor() {
    this.rsvpService = new RSVPService();
  }

  /**
   * Manejar respuesta RSVP (confirmar/declinar)
   * GET /api/rsvp?token=xxx&action=confirm|decline
   */
  handleRSVPResponse = async (req, res) => {
    try {
      const { token, action } = req.query;

      // Validar parámetros
      if (!token || !action) {
        const html = getRSVPResponseHTML({
          success: false,
          error: "Parámetros inválidos",
          message: "El enlace no es válido. Faltan parámetros requeridos.",
        });
        return res.status(400).type("html").send(html);
      }

      if (!["confirm", "decline"].includes(action)) {
        const html = getRSVPResponseHTML({
          success: false,
          error: "Acción inválida",
          message: "La acción especificada no es válida.",
        });
        return res.status(400).type("html").send(html);
      }

      // Procesar respuesta
      const result = await this.rsvpService.processRSVPResponse(token, action);

      // Generar HTML de respuesta
      const html = getRSVPResponseHTML(result);

      const statusCode = result.success ? 200 : result.statusCode || 400;
      res.status(statusCode).type("html").send(html);
    } catch (error) {
      console.error("Error en handleRSVPResponse:", error);
      const html = getRSVPResponseHTML({
        success: false,
        error: "Error del servidor",
        message:
          "Ocurrió un error al procesar tu respuesta. Por favor intenta nuevamente.",
      });
      res.status(500).type("html").send(html);
    }
  };

  /**
   * Obtener estado de invitación
   * GET /api/rsvp/status/:token
   */
  getInvitationStatus = async (req, res) => {
    try {
      const { token } = req.params;

      const result = await this.rsvpService.getInvitationStatus(token);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error en getInvitationStatus:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };

  /**
   * Reenviar invitación
   * POST /api/rsvp/resend
   */
  resendInvitation = async (req, res) => {
    try {
      const { invitationId } = req.body;

      if (!invitationId) {
        return res.status(400).json({
          success: false,
          message: "Se requiere invitationId",
        });
      }

      const result = await this.rsvpService.resendInvitation(invitationId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error en resendInvitation:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  };
}
