import eventMaterialsConsumableService from "../services/eventMaterialsConsumable.service.js";

const buildErrorResponse = (error, fallbackMessage) => {
  const statusCode =
    error?.statusCode ||
    (error?.name?.includes("PrismaClientValidationError") ? 400 : 500);

  const message = error?.message || fallbackMessage;
  const response = {
    success: false,
    message,
  };

  if (error?.details) {
    response.errors = error.details;
  }

  return { statusCode, response };
};

class EventMaterialsConsumableController {
  constructor() {
    this.getByEvent = this.getByEvent.bind(this);
    this.loadDonationMaterials = this.loadDonationMaterials.bind(this);
    this.assignMaterial = this.assignMaterial.bind(this);
    this.removeAssignment = this.removeAssignment.bind(this);
    this.finalizeEvent = this.finalizeEvent.bind(this);
  }

  resolveAuthenticatedUser(req) {
    const userId = Number.parseInt(req.user?.id, 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      return null;
    }

    const fullName = [req.user?.firstName, req.user?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return {
      userId,
      userName: fullName || req.user?.name || null,
    };
  }

  /**
   * Get consumable materials for event
   */
  async getByEvent(req, res) {
    try {
      const { eventoId } = req.params;
      const result = await eventMaterialsConsumableService.getByEvent(eventoId);

      return res.status(200).json(result);
    } catch (error) {
      const { statusCode, response } = buildErrorResponse(
        error,
        "Error retrieving consumable materials",
      );
      return res.status(statusCode).json(response);
    }
  }

  /**
   * Load donation materials for event
   */
  async loadDonationMaterials(req, res) {
    try {
      const { eventoId } = req.params;
      const actor = this.resolveAuthenticatedUser(req);
      if (!actor) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result =
        await eventMaterialsConsumableService.loadDonationMaterials(
          eventoId,
          actor.userId,
          actor.userName,
        );

      return res.status(200).json(result);
    } catch (error) {
      const { statusCode, response } = buildErrorResponse(
        error,
        "Error loading donation materials",
      );
      return res.status(statusCode).json(response);
    }
  }

  /**
   * Assign consumable material to event
   */
  async assignMaterial(req, res) {
    try {
      const { eventoId } = req.params;
      const actor = this.resolveAuthenticatedUser(req);
      if (!actor) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await eventMaterialsConsumableService.assignMaterial(
        eventoId,
        req.body,
        actor.userId,
        actor.userName,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      const { statusCode, response } = buildErrorResponse(
        error,
        "Error assigning consumable material",
      );
      return res.status(statusCode).json(response);
    }
  }

  /**
   * Remove consumable material assignment
   */
  async removeAssignment(req, res) {
    try {
      const { assignmentId } = req.params;
      const actor = this.resolveAuthenticatedUser(req);
      if (!actor) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await eventMaterialsConsumableService.removeAssignment(
        assignmentId,
        actor.userId,
        actor.userName,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      const { statusCode, response } = buildErrorResponse(
        error,
        "Error removing assignment",
      );
      return res.status(statusCode).json(response);
    }
  }

  /**
   * Finalize event - deduct consumable materials
   */
  async finalizeEvent(req, res) {
    try {
      const { eventoId } = req.params;
      const actor = this.resolveAuthenticatedUser(req);
      if (!actor) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }

      const result = await eventMaterialsConsumableService.finalizeEvent(
        eventoId,
        actor.userId,
        actor.userName,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      const { statusCode, response } = buildErrorResponse(
        error,
        "Error finalizing event",
      );
      return res.status(statusCode).json(response);
    }
  }
}

export default new EventMaterialsConsumableController();
