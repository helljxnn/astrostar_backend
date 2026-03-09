import eventMaterialsConsumableService from "../services/eventMaterialsConsumable.service.js";

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
      console.error("Controller error - getByEvent:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving consumable materials",
        error: error.message,
      });
    }
  }

  /**
   * Load donation materials for event
   */
  async loadDonationMaterials(req, res) {
    try {
      const { eventoId } = req.params;
      const userId = req.user?.id || 1;
      const userName = req.user?.name || "System";

      const result =
        await eventMaterialsConsumableService.loadDonationMaterials(
          eventoId,
          userId,
          userName,
        );

      return res.status(200).json(result);
    } catch (error) {
      console.error("Controller error - loadDonationMaterials:", error);
      return res.status(500).json({
        success: false,
        message: "Error loading donation materials",
        error: error.message,
      });
    }
  }

  /**
   * Assign consumable material to event
   */
  async assignMaterial(req, res) {
    try {
      const { eventoId } = req.params;
      const userId = req.user?.id || 1;
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
      console.error("Controller error - assignMaterial:", error);
      return res.status(500).json({
        success: false,
        message: "Error assigning consumable material",
        error: error.message,
      });
    }
  }

  /**
   * Remove consumable material assignment
   */
  async removeAssignment(req, res) {
    try {
      const { assignmentId } = req.params;
      const userId = req.user?.id || 1;
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
      console.error("Controller error - removeAssignment:", error);
      return res.status(500).json({
        success: false,
        message: "Error removing assignment",
        error: error.message,
      });
    }
  }

  /**
   * Finalize event - deduct consumable materials
   */
  async finalizeEvent(req, res) {
    try {
      const { eventoId } = req.params;
      const userId = req.user?.id || 1;
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
      console.error("Controller error - finalizeEvent:", error);
      return res.status(500).json({
        success: false,
        message: "Error finalizing event",
        error: error.message,
      });
    }
  }
}

export default new EventMaterialsConsumableController();
