import eventMaterialsSummaryService from "../services/eventMaterialsSummary.service.js";

class EventMaterialsSummaryController {
  /**
   * Get aggregated materials summary for event
   */
  async getSummary(req, res) {
    try {
      const { eventoId } = req.params;
      const result = await eventMaterialsSummaryService.getSummary(eventoId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
return res.status(500).json({
        success: false,
        message: "Error retrieving materials summary",
        error: error.message,
      });
    }
  }
}

export default new EventMaterialsSummaryController();
