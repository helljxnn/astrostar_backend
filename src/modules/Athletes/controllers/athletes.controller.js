import { AthletesService } from "../services/athletes.service.js";
import { athletesService } from "../services/athletes.service.new.js";

export class AthletesController {
  constructor() {
    this.athletesService = new AthletesService();
  }

  getAllAthletes = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status, // Sin filtro por defecto - mostrar todos
        categoria,
        estadoInscripcion,
      } = req.query;

      const result = await this.athletesService.getAllAthletes(
        {
          page: parseInt(page),
          limit: parseInt(limit),
          search,
          status,
          categoria,
          estadoInscripcion,
        },
        req.user,
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} deportistas.`,
      });
    } catch (error) {
      console.error("Error fetching athletes:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener deportistas",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getAthleteById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de deportista inválido",
        });
      }

      const result = await this.athletesService.getAthleteById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: "Deportista encontrado exitosamente.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener deportista",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  createAthlete = async (req, res) => {
    try {
      const result = await this.athletesService.createAthlete(req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        temporaryPassword:
          process.env.NODE_ENV === "development"
            ? result.temporaryPassword
            : undefined,
        emailSent: result.emailSent,
        message: result.message,
      });
    } catch (error) {
      // Manejar errores de validación
      if (
        error.message.includes("ya está registrado") ||
        error.message.includes("debe tener un acudiente") ||
        error.message.includes("no existe")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Manejar errores de Prisma (duplicados)
      if (error.code === "P2002") {
        const field = error.meta?.target?.[0];
        let message = "Ya existe un registro con estos datos.";

        if (field === "email") {
          message = `El correo electrónico "${req.body.email}" ya está registrado.`;
        } else if (field === "identification") {
          message = `El documento "${req.body.identification}" ya está registrado.`;
        }

        return res.status(400).json({
          success: false,
          message: message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear deportista",
        error: error.message,
      });
    }
  };

  updateAthlete = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de deportista inválido",
        });
      }

      const result = await this.athletesService.updateAthlete(id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      // Manejar errores de validación
      if (
        error.message.includes("ya está registrado") ||
        error.message.includes("debe tener un acudiente") ||
        error.message.includes("no existe")
      ) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // Manejar errores de Prisma (duplicados)
      if (error.code === "P2002") {
        const field = error.meta?.target?.[0];
        let message = "Ya existe un registro con estos datos.";

        if (field === "email") {
          message = `El correo electrónico "${req.body.email}" ya está registrado por otro deportista.`;
        } else if (field === "identification") {
          message = `El documento "${req.body.identification}" ya está registrado por otro deportista.`;
        }

        return res.status(400).json({
          success: false,
          message: message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar deportista",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  deleteAthlete = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de deportista inválido",
        });
      }

      const result = await this.athletesService.deleteAthlete(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar deportista",
      });
    }
  };

  changeAthleteStatus = async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const status = req.body.status ?? req.body.estado;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de deportista inválido",
        });
      }

      if (status === undefined || status === null || status === "") {
        return res.status(400).json({
          success: false,
          message: "El estado es requerido",
        });
      }

      const result = await this.athletesService.changeAthleteStatus(id, status);

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

  getAthleteStats = async (req, res) => {
    try {
      const result = await this.athletesService.getAthleteStats();

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

  getReferenceData = async (req, res) => {
    try {
      const result = await this.athletesService.getReferenceData();

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

  getDocumentTypes = async (req, res) => {
    try {
      const result = await this.athletesService.getDocumentTypes();

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

  checkEmailAvailability = async (req, res) => {
    try {
      const { email, excludeUserId } = req.query;
      const result = await this.athletesService.checkEmailAvailability(
        email,
        excludeUserId,
      );

      res.json({
        success: true,
        available: result.available,
        message: result.available ? "Email disponible." : result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al verificar email.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkIdentificationAvailability = async (req, res) => {
    try {
      const { identification, excludeUserId } = req.query;
      const result = await this.athletesService.checkIdentificationAvailability(
        identification,
        excludeUserId,
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

  removeGuardian = async (req, res) => {
    try {
      const athleteId = parseInt(req.params.id);

      if (isNaN(athleteId)) {
        return res.status(400).json({
          success: false,
          message: "ID de deportista inválido.",
        });
      }

      const result = await this.athletesService.removeGuardian(athleteId);

      if (!result.success) {
        return res.status(result.statusCode || 400).json({
          success: false,
          message: result.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al remover acudiente.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  /**
   * GET /api/athletes/report
   * Obtener todos los deportistas para reporte (SIN PAGINACIÓN)
   */
  getAllAthletesForReport = async (req, res) => {
    try {
      const { search = "", status, minAge, maxAge, category } = req.query;

      const result = await athletesService.findAllForReport({
        search,
        status,
        minAge: minAge ? parseInt(minAge) : undefined,
        maxAge: maxAge ? parseInt(maxAge) : undefined,
        category,
      });

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message:
          "Error interno del servidor al obtener deportistas para reporte",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default new AthletesController();
