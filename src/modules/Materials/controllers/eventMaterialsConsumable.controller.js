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
      const userId = Number.parseInt(req.user?.id, 10) || 1;
      const userName = req.user?.name || "System";

      const result =
        await eventMaterialsConsumableService.loadDonationMaterials(
          eventoId,
          userId,
          userName,
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
      const userId = Number.parseInt(req.user?.id, 10) || 1;
      const userName = req.user?.name || "System";

      const result = await eventMaterialsConsumableService.assignMaterial(
        eventoId,
        req.body,
        userId,
        userName,
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
      const userId = Number.parseInt(req.user?.id, 10) || 1;
      const userName = req.user?.name || "System";

      const result = await eventMaterialsConsumableService.removeAssignment(
        assignmentId,
        userId,
        userName,
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
      const userId = Number.parseInt(req.user?.id, 10) || 1;
      const userName = req.user?.name || "System";

      const result = await eventMaterialsConsumableService.finalizeEvent(
        eventoId,
        userId,
        userName,
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
