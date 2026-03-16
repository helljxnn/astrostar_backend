import { DonorsSponsorsService } from "../services/donorsSponsors.services.js";

export class DonorsSponsorsController {
  constructor() {
    this.donorsSponsorsService = new DonorsSponsorsService();
  }

  getAll = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        tipo,
        tipoPersona,
      } = req.query;

      const result = await this.donorsSponsorsService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        tipo,
        tipoPersona,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} registros.`,
      });
    } catch (error) {
      console.error("Error in DonorsSponsorsController.getAll:", error);
      res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al obtener donantes/patrocinadores.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const result = await this.donorsSponsorsService.getById(id);
      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: "Registro encontrado exitosamente.",
      });
    } catch (error) {
      console.error("Error in DonorsSponsorsController.getById:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener el registro.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  create = async (req, res) => {
    try {
      const result = await this.donorsSponsorsService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error in DonorsSponsorsController.create:", error);

      if (
        error.message?.includes("identificaci\u00f3n") ||
        error.message?.includes("correo")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear el registro.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  createFromLanding = async (req, res) => {
    try {
      
      const result = await this.donorsSponsorsService.createFromLanding(
        req.body
      );
      
      
      res.status(201).json(result);
    } catch (error) {
      console.error("❌ [LANDING] Error en createFromLanding:", error.message);
      
      const message =
        error.message ||
        "Error interno del servidor al registrar el donante.";
      const status =
        message.includes("registrada") || message.includes("correo")
          ? 400
          : 500;
      res.status(status).json({
        success: false,
        message,
      });
    }
  };

  update = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.donorsSponsorsService.update(id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error in DonorsSponsorsController.update:", error);

      if (
        error.message?.includes("identificaci\u00f3n") ||
        error.message?.includes("correo")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar el registro.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  delete = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await this.donorsSponsorsService.delete(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error in DonorsSponsorsController.delete:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar el registro.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  changeStatus = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      const result = await this.donorsSponsorsService.changeStatus(id, status);
      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error("Error in DonorsSponsorsController.changeStatus:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al cambiar el estado.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkIdentification = async (req, res) => {
    try {
      const { identification, excludeId } = req.query;
      const result =
        await this.donorsSponsorsService.checkIdentificationAvailability(
          identification,
          excludeId
        );

      res.json({
        success: true,
        available: result.available,
        message: result.available
          ? "Identificaci\u00f3n disponible."
          : result.message,
      });
    } catch (error) {
      console.error(
        "Error in DonorsSponsorsController.checkIdentification:",
        error
      );
      res.status(500).json({
        success: false,
        message: "Error interno al verificar la identificaci\u00f3n.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkEmail = async (req, res) => {
    try {
      const { email, excludeId } = req.query;
      const result = await this.donorsSponsorsService.checkEmailAvailability(
        email,
        excludeId
      );

      res.json({
        success: true,
        available: result.available,
        message: result.available ? "Correo disponible." : result.message,
      });
    } catch (error) {
      console.error("Error in DonorsSponsorsController.checkEmail:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al verificar el correo.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getStats = async (_req, res) => {
    try {
      const result = await this.donorsSponsorsService.getStats();
      res.json({
        success: true,
        data: result.data,
        message: "Estad\u00edsticas obtenidas exitosamente.",
      });
    } catch (error) {
      console.error("Error in DonorsSponsorsController.getStats:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al obtener estad\u00edsticas.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getReferenceData = async (_req, res) => {
    try {
      const result = await this.donorsSponsorsService.getReferenceData();
      res.json({
        success: true,
        data: result.data,
        message: "Datos de referencia obtenidos exitosamente.",
      });
    } catch (error) {
      console.error("Error in DonorsSponsorsController.getReferenceData:", error);
      res.status(500).json({
        success: false,
        message: "Error interno al obtener datos de referencia.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default new DonorsSponsorsController();

