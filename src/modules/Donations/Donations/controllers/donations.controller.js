import DonationsService from "../services/donations.services.js";

export class DonationsController {
  list = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status, type } = req.query;
      const result = await DonationsService.list({
        page: Number(page),
        limit: Number(limit),
        search,
        status,
        type,
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
      const payload = req.body;
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
      const result = await DonationsService.update(id, req.body);
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
}

export default new DonationsController();
