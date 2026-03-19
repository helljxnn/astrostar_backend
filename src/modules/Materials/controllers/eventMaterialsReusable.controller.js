import eventMaterialsReusableService from "../services/eventMaterialsReusable.service.js";

class EventMaterialsReusableController {
  /**
   * Get reusable materials for event
   */
  async getByEvent(req, res) {
    try {
      const { eventoId } = req.params;
      const result = await eventMaterialsReusableService.getByEvent(eventoId);

      return res.status(200).json(result);
    } catch (error) {
return res.status(500).json({
        success: false,
        message: "Error retrieving reusable materials",
        error: error.message,
      });
    }
  }

  /**
   * Assign reusable material to event
   */
  async assignMaterial(req, res) {
    try {
      const { eventoId } = req.params;
      const userId = req.user?.id || 1;
      const userName = req.user?.name || "System";

      const result = await eventMaterialsReusableService.assignMaterial(
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
return res.status(500).json({
        success: false,
        message: "Error assigning reusable material",
        error: error.message,
      });
    }
  }

  /**
   * Remove reusable material assignment
   */
  async removeAssignment(req, res) {
    try {
      const { assignmentId } = req.params;
      const userId = req.user?.id || 1;
      const userName = req.user?.name || "System";

      const result = await eventMaterialsReusableService.removeAssignment(
        assignmentId,
        userId,
        userName,
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
return res.status(500).json({
        success: false,
        message: "Error removing assignment",
        error: error.message,
      });
    }
  }

  /**
   * Check material availability for date range
   */
  async checkAvailability(req, res) {
    try {
      const { materialId } = req.params;
      const { startDate, endDate, excludeEventoId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const result =
        await eventMaterialsReusableService.getMaterialAvailability(
          materialId,
          startDate,
          endDate,
          excludeEventoId,
        );

      return res.status(200).json(result);
    } catch (error) {
return res.status(500).json({
        success: false,
        message: "Error checking availability",
        error: error.message,
      });
    }
  }

  /**
   * Check availability for multiple materials at once (optimized)
   */
  async checkBulkAvailability(req, res) {
    try {
      const { materialIds, startDate, endDate, excludeEventoId } = req.body;

      if (
        !materialIds ||
        !Array.isArray(materialIds) ||
        materialIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "materialIds array is required",
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "startDate and endDate are required",
        });
      }

      const result =
        await eventMaterialsReusableService.getBulkMaterialAvailability(
          materialIds,
          startDate,
          endDate,
          excludeEventoId,
        );

      return res.status(200).json(result);
    } catch (error) {
return res.status(500).json({
        success: false,
        message: "Error checking bulk availability",
        error: error.message,
      });
    }
  }

  /**
   * Get all assignments for a specific material (consumables from EventMaterial table)
   */
  async getMaterialAssignments(req, res) {
    try {
      const { materialId } = req.params;
      const { includeCompleted, startDate, endDate } = req.query;

      const result = await eventMaterialsReusableService.getMaterialAssignments(
        materialId,
        {
          includeCompleted: includeCompleted === "true",
          startDate: startDate || null,
          endDate: endDate || null,
        },
      );

      return res.status(200).json(result);
    } catch (error) {
return res.status(500).json({
        success: false,
        message: "Error retrieving material assignments",
        error: error.message,
      });
    }
  }

  /**
   * Get all reusable assignments for a specific material (from EventMaterialReusable table)
   */
  async getReusableMaterialAssignments(req, res) {
    try {
      const { materialId } = req.params;
      const { includeCompleted, startDate, endDate } = req.query;

      const result =
        await eventMaterialsReusableService.getReusableMaterialAssignments(
          materialId,
          {
            includeCompleted: includeCompleted === "true",
            startDate: startDate || null,
            endDate: endDate || null,
          },
        );

      return res.status(200).json(result);
    } catch (error) {
return res.status(500).json({
        success: false,
        message: "Error retrieving reusable material assignments",
        error: error.message,
      });
    }
  }
}

export default new EventMaterialsReusableController();
