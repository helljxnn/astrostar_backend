import { GuardiansService } from "../services/guardians.service.js";

export class GuardiansController {
  constructor() {
    this.guardiansService = new GuardiansService();
  }

  getAllGuardians = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
      } = req.query;

      const result = await this.guardiansService.getAllGuardians({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} acudientes.`,
      });
    } catch (error) {
      console.error("Error in getAllGuardians controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener acudientes",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getGuardianById = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de acudiente inválido",
        });
      }

      const result = await this.guardiansService.getGuardianById(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: "Acudiente encontrado exitosamente.",
      });
    } catch (error) {
      console.error("Error in getGuardianById controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener acudiente",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  createGuardian = async (req, res) => {
    try {

      const result = await this.guardiansService.createGuardian(req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in createGuardian controller:", error);

      if (error.message.includes('ya está registrado')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al crear acudiente",
        error: error.message,
      });
    }
  };

  updateGuardian = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de acudiente inválido",
        });
      }


      const result = await this.guardiansService.updateGuardian(id, req.body);

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.json({
        success: true,
        data: result.data,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in updateGuardian controller:", error);

      if (error.message.includes('ya está registrado')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor al actualizar acudiente",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  deleteGuardian = async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "ID de acudiente inválido",
        });
      }

      const result = await this.guardiansService.deleteGuardian(id);

      if (!result.success) {
        return res.status(result.statusCode || 404).json(result);
      }

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      console.error("Error in deleteGuardian controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al eliminar acudiente",
      });
    }
  };

  getGuardiansWithAthletes = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
      } = req.query;

      // Usar el mismo método getAllGuardians que ya incluye la información de deportistas
      const result = await this.guardiansService.getAllGuardians({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} acudientes con información de deportistas.`,
      });
    } catch (error) {
      console.error("Error in getGuardiansWithAthletes controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener acudientes con información de deportistas",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getGuardiansWithAthletes = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status,
      } = req.query;

      // Usar el mismo método getAllGuardians que ya incluye la información de deportistas
      const result = await this.guardiansService.getAllGuardians({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Se encontraron ${result.pagination?.total || 0} acudientes con información de deportistas.`,
      });
    } catch (error) {
      console.error("Error in getGuardiansWithAthletes controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener acudientes con información de deportistas",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  getGuardianStats = async (req, res) => {
    try {
      const result = await this.guardiansService.getGuardianStats();

      res.json({
        success: true,
        data: result.data,
        message: "Estadísticas obtenidas exitosamente.",
      });
    } catch (error) {
      console.error("Error in getGuardianStats controller:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener estadísticas",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };

  checkEmailAvailability = async (req, res) => {
    try {
      const { email, excludeId } = req.query;
      const result = await this.guardiansService.checkEmailAvailability(email, excludeId);

      res.json({
        success: true,
        available: result.available,
        message: result.available ? 'Email disponible.' : result.message
      });
    } catch (error) {
      console.error('Error checking email availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar email.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  checkIdentificationAvailability = async (req, res) => {
    try {
      const { identification, excludeId } = req.query;
      const result = await this.guardiansService.checkIdentificationAvailability(identification, excludeId);

      res.json({
        success: true,
        available: result.available,
        message: result.available ? 'Identificación disponible.' : result.message
      });
    } catch (error) {
      console.error('Error checking identification availability:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al verificar identificación.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

export default new GuardiansController();


