import { MembershipService } from "../services/memberships.service.js";

export class MembershipController {
  constructor() {
    this.membershipService = new MembershipService();
  }

  /**
   * Agregar miembro a un grupo
   */
  addMember = async (req, res) => {
    try {
      const { id } = req.params;
      const memberData = req.body;

      const result = await this.membershipService.addMember(id, memberData);

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error adding member:", error);

      if (
        error.message.includes("no existe") ||
        error.message.includes("ya está inscrita") ||
        error.message.includes("cupo máximo")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al agregar miembro.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Actualizar membresía
   */
  updateMembership = async (req, res) => {
    try {
      const { id } = req.params;
      const membershipData = req.body;

      const result = await this.membershipService.updateMembership(
        id,
        membershipData,
      );

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error updating membership:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar la membresía.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Eliminar membresía
   */
  removeMember = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.membershipService.removeMember(id);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error removing member:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al remover miembro.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener miembros de un grupo
   */
  getGroupMembers = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.query;

      const result = await this.membershipService.getGroupMembers(id, status);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} miembros.`,
      });
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener miembros.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Obtener historial de grupos de una deportista
   */
  getAthleteGroups = async (req, res) => {
    try {
      const { athleteId } = req.params;

      const result = await this.membershipService.getAthleteGroups(athleteId);

      if (!result.success) {
        return res.status(result.statusCode).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} registros.`,
      });
    } catch (error) {
      console.error("Error fetching athlete groups:", error);
      res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al obtener grupos de la deportista.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}
