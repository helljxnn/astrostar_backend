import DonationsService from "../services/donations.services.js";

export class DonationsController {
  list = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        type,
        month,
        serviceId,
        eventId,
      } = req.query;
      const result = await DonationsService.list({
        page: Number(page),
        limit: Number(limit),
        search,
        status,
        type,
        month,
        serviceId: serviceId || eventId || undefined,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Error list donations", error);
      res.status(500).json({
        success: false,
        message: "Error al listar donaciones",
      });
    }
  };

  getById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await DonationsService.getById(id);
      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }
      res.json(result);
    } catch (error) {
      console.error("Error get donation", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la donacion",
      });
    }
  };

  create = async (req, res) => {
    try {
      const payload = {
        ...req.body,
        serviceId: req.body.serviceId || req.body.eventId || null,
      };
      const result = await DonationsService.create(payload);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error create donation", error);
      res.status(500).json({
        success: false,
        message: "Error al crear la donacion",
      });
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      const payload = {
        ...req.body,
        serviceId: req.body.serviceId || req.body.eventId || undefined,
      };
      const result = await DonationsService.update(id, payload);
      res.json(result);
    } catch (error) {
      console.error("Error update donation", error);
      res.status(500).json({
        success: false,
        message: "Error al actualizar la donacion",
      });
    }
  };

  changeStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const result = await DonationsService.changeStatus(id, status, reason);
      res.json(result);
    } catch (error) {
      console.error("Error change status donation", error);
      res.status(500).json({
        success: false,
        message: "Error al cambiar estado de la donacion",
      });
    }
  };

  softDelete = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await DonationsService.softDelete(id);
      res.json(result);
    } catch (error) {
      console.error("Error delete donation", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la donacion",
      });
    }
  };

  uploadFiles = async (req, res) => {
    try {
      const { id } = req.params;
      const { fileType } = req.query;
      const files = (req.files || []).map((f) => ({
        ...f,
        fileType: fileType || f.fileType || "soporte",
      }));

      const result = await DonationsService.uploadFiles(
        parseInt(id),
        files,
        fileType || "soporte"
      );
      res.status(201).json(result);
    } catch (error) {
      console.error("Error upload donation files", error);
      const status = error.message?.includes("5MB") ? 400 : 500;
      res.status(status).json({
        success: false,
        message:
          error.message ||
          "Error al subir archivos. Verifique tipo y tamaño (PDF/JPG/PNG, max 5MB).",
      });
    }
  };

  /**
   * Convert donation to materials
   * POST /api/donations/:id/convert-to-materials
   * Body: { items: [{ materialId, cantidad, inventarioDestino?, observaciones? }] }
   */
  convertToMaterials = async (req, res) => {
    try {
      const { id } = req.params;
      const { items } = req.body;
      const userId = req.user?.id || 1;
      const userName = req.user?.name || req.user?.username || "Sistema";

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Se requiere un array de items con materialId y cantidad",
        });
      }

      const result = await DonationsService.convertToMaterials(
        id,
        items,
        userId,
        userName
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("Error converting donation to materials", error);
      res.status(500).json({
        success: false,
        message: "Error al convertir donación en materiales",
      });
    }
  };

  /**
   * Get materials linked to a donation
   * GET /api/donations/:id/materials
   */
  getMaterials = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await DonationsService.getMaterialsByDonation(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error getting materials by donation", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener materiales de la donación",
      });
    }
  };
}

export default new DonationsController();
