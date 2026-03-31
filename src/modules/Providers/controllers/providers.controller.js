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

      const result = await this.providersService.createProvider(req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      if (/ya est.* registrado/i.test(error.message || "")) {
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
      if (/ya est.* registrado/i.test(error.message || "")) {
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
res.status(500).json({
        success: false,
        message: "Error interno del servidor al cambiar estado",
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
res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener reglas de validación",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkHasIngresos = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de proveedor inválido",
        });
      }

      const result = await this.providersService.checkHasIngresos(id);

      res.json({
        success: true,
        hasIngresos: result.hasIngresos,
      });
    } catch (error) {
res.status(500).json({
        success: false,
        message: "Error al verificar ingresos asociados",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

    /**
     * GET /api/providers/report
     * Obtener todos los proveedores para reporte (SIN PAGINACIÓN)
     */
    getAllProvidersForReport = async (req, res) => {
      try {
        const { search = "", status, entityType } = req.query;

        const result = await this.providersService.getAllProvidersForReport({
          search,
          status,
          entityType,
        });

        return res.json(result);
      } catch (error) {
return res.status(500).json({
          success: false,
          message: "Error interno del servidor al obtener proveedores para reporte",
          error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
      }
    };
}

export default new ProvidersController();


