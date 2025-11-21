import { ProvidersService } from "../services/providers.service.js";

export class ProvidersController {
  constructor() {
    this.providersService = new ProvidersService();
  }

  getAllProviders = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
        entityType,
      } = req.query;

      const result = await this.providersService.getAllProviders({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        entityType,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} proveedores.`,
      });
    } catch (error) {
      console.error("Error in getAllProviders controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener proveedores",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getProviderById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de proveedor inválido",
        });
      }

      const result = await this.providersService.getProviderById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: "Proveedor encontrado exitosamente.",
      });
    } catch (error) {
      console.error("Error in getProviderById controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener proveedor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  createProvider = async (req, res) => {
    try {
      console.log("=== DATOS RECIBIDOS EN BACKEND ===");
      console.log(JSON.stringify(req.body, null, 2));
      console.log("tipoEntidad:", req.body.tipoEntidad);
      console.log("razonSocial:", req.body.razonSocial);
      console.log("===================================");

      console.log("Llamando al servicio createProvider...");
      const result = await this.providersService.createProvider(req.body);
      console.log("Servicio completado exitosamente:", result.success);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in createProvider controller:", error);

      if (error.message.includes("ya está registrado")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear proveedor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  updateProvider = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de proveedor inválido",
        });
      }

      console.log("=== DATOS PARA ACTUALIZAR PROVEEDOR ===");
      console.log("ID:", id);
      console.log("Estado recibido:", req.body.estado);
      console.log("Datos completos:", JSON.stringify(req.body, null, 2));
      console.log("=======================================");

      const result = await this.providersService.updateProvider(id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in updateProvider controller:", error);

      if (error.message.includes("ya está registrado")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar proveedor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  deleteProvider = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de proveedor inválido",
        });
      }

      const result = await this.providersService.deleteProvider(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in deleteProvider controller:", error);

      if (error.message.includes("No se puede eliminar")) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar proveedor",
      });
    }
  };

  changeProviderStatus = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de proveedor inválido",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "El estado es requerido",
        });
      }

      const result = await this.providersService.changeProviderStatus(
        id,
        status
      );

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in changeProviderStatus controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al cambiar estado",
      });
    }
  };

  checkActivePurchases = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de proveedor inválido",
        });
      }

      const result = await this.providersService.checkActivePurchases(id);

      res.json({
        success: true,
        hasActivePurchases: result.hasActivePurchases,
        message: result.hasActivePurchases
          ? "El proveedor tiene compras activas"
          : "El proveedor no tiene compras activas",
      });
    } catch (error) {
      console.error("Error in checkActivePurchases controller:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar compras activas",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkNitAvailability = async (req, res) => {
    try {
      const { nit, excludeId, tipoEntidad = "juridica" } = req.query;

      if (!nit) {
        return res.status(400).json({
          success: false,
          message:
            tipoEntidad === "juridica"
              ? "El NIT es requerido"
              : "El documento de identidad es requerido",
        });
      }

      const result = await this.providersService.checkNitAvailability(
        nit,
        excludeId,
        tipoEntidad
      );

      res.json({
        success: true,
        available: result.available,
        message: result.available
          ? tipoEntidad === "juridica"
            ? "NIT disponible"
            : "Documento disponible"
          : result.message,
      });
    } catch (error) {
      console.error("Error checking NIT availability:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar disponibilidad",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkBusinessNameAvailability = async (req, res) => {
    try {
      const { businessName, excludeId, tipoEntidad = "juridica" } = req.query;

      if (!businessName) {
        return res.status(400).json({
          success: false,
          message:
            tipoEntidad === "juridica"
              ? "La razón social es requerida"
              : "El nombre es requerido",
        });
      }

      const result = await this.providersService.checkBusinessNameAvailability(
        businessName,
        excludeId,
        tipoEntidad
      );

      res.json({
        success: true,
        available: result.available,
        message: result.available
          ? tipoEntidad === "juridica"
            ? "Razón social disponible"
            : "Nombre disponible"
          : result.message,
      });
    } catch (error) {
      console.error("Error checking business name availability:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar disponibilidad",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkEmailAvailability = async (req, res) => {
    try {
      const { email, excludeId } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "El email es requerido",
        });
      }

      const result = await this.providersService.checkEmailAvailability(
        email,
        excludeId
      );

      res.json({
        success: true,
        available: result.available,
        message: result.available ? "Email disponible" : result.message,
      });
    } catch (error) {
      console.error("Error checking email availability:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar disponibilidad del email",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkContactAvailability = async (req, res) => {
    try {
      const { contact, excludeId } = req.query;

      if (!contact) {
        return res.status(400).json({
          success: false,
          message: "El nombre de contacto es requerido",
        });
      }

      const result = await this.providersService.checkContactAvailability(
        contact,
        excludeId
      );

      res.json({
        success: true,
        available: result.available,
        message: result.available
          ? "Nombre de contacto disponible"
          : result.message,
      });
    } catch (error) {
      console.error("Error checking contact availability:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar disponibilidad del contacto",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getProviderStats = async (req, res) => {
    try {
      const result = await this.providersService.getProviderStats();

      res.json({
        success: true,
        data: result.data,
        message: "Estadísticas obtenidas exitosamente.",
      });
    } catch (error) {
      console.error("Error in getProviderStats controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getDocumentTypes = async (req, res) => {
    try {
      const result = await this.providersService.getDocumentTypes();

      res.json({
        success: true,
        data: result.data,
        message: "Tipos de documento obtenidos exitosamente.",
      });
    } catch (error) {
      console.error("Error in getDocumentTypes controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener tipos de documento",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getReferenceData = async (req, res) => {
    try {
      const result = await this.providersService.getReferenceData();

      res.json({
        success: true,
        data: result.data,
        message: "Datos de referencia obtenidos exitosamente.",
      });
    } catch (error) {
      console.error("Error in getReferenceData controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener datos de referencia",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkIdentificationAvailability = async (req, res) => {
    try {
      const { identification, excludeUserId } = req.query;
      const result =
        await this.providersService.checkIdentificationAvailability(
          identification,
          excludeUserId
        );

      res.json({
        success: true,
        available: result.available,
        message: result.available
          ? "Identificación disponible."
          : result.message,
      });
    } catch (error) {
      console.error("Error checking identification availability:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al verificar identificación.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getDocumentValidationRules = async (req, res) => {
    try {
      const result = await this.providersService.getDocumentValidationRules();

      res.json({
        success: true,
        data: result.data,
        message: "Reglas de validación obtenidas exitosamente.",
      });
    } catch (error) {
      console.error("Error in getDocumentValidationRules controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener reglas de validación",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default new ProvidersController();
