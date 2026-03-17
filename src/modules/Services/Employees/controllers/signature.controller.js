import { SignatureService } from "../services/signature.service.js";

export class SignatureController {
  constructor() {
    this.signatureService = new SignatureService();
  }

  /**
   * Upload signature for an employee (admin only)
   * POST /api/employees/:id/signature
   */
  uploadSignature = async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No se ha proporcionado ningún archivo de firma.",
        });
      }

      const result = await this.signatureService.uploadSignature(id, file);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message,
        });
      }

      res.status(200).json({
        success: true,
        data: result.data,
        message: "Firma subida exitosamente.",
      });
    } catch (error) {
      console.error("Error uploading signature:", error);
      res.status(500).json({
        success: false,
        message: "Error al subir la firma.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Delete signature for an employee
   * DELETE /api/employees/:id/signature
   */
  deleteSignature = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.signatureService.deleteSignature(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        message: "Firma eliminada exitosamente.",
      });
    } catch (error) {
      console.error("Error deleting signature:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar la firma.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * Get administrators with signatures (for donation responsible selection)
   * GET /api/employees/administrators/with-signature
   */
  getAdministratorsWithSignature = async (req, res) => {
    try {
      const result =
        await this.signatureService.getAdministratorsWithSignature();

      res.json({
        success: true,
        data: result.data,
        message: `Se encontraron ${result.data.length} administradores con firma.`,
      });
    } catch (error) {
      console.error("Error fetching administrators with signature:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener administradores con firma.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

