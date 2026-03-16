import { SportsCategoryService } from "../services/sportsCategory.service.js";
import { uploadToCloudinary } from "../../../../services/shared/cloudinary.service.js";

export class SportsCategoryController {
  constructor() {
    this.sportsCategoryService = new SportsCategoryService();
  }

  /**
   * GET: Obtener todas las categorías (con paginación y filtros)
   */
  getAllSportsCategories = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;

      const result = await this.sportsCategoryService.getAllSportsCategories({
        page: parseInt(page),
        limit: parseInt(limit),
        search: search.trim(),
        status: status.trim(),
      });

      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en getAllSportsCategories:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor al obtener categorías.",
        statusCode: 500,
      });
    }
  };

  /**
   * GET: Obtener categorías públicas para el landing
   * Retorna categorías activas y publicadas con sus imágenes
   */
  getPublicCategories = async (req, res) => {
    try {
      const result = await this.sportsCategoryService.getPublicCategories();
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en getPublicCategories:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener categorías públicas.",
        statusCode: 500,
      });
    }
  };

  /**
   * GET: Obtener categoría por ID
   */
  getSportsCategoryById = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.sportsCategoryService.getSportsCategoryById(id);
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en getSportsCategoryById:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener la categoría.",
        statusCode: 500,
      });
    }
  };

  /**
   * GET: Verificar disponibilidad de nombre
   */
  checkCategoryNameAvailability = async (req, res) => {
    try {
      const { name, excludeId } = req.query;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "El nombre es obligatorio.",
          statusCode: 400,
        });
      }

      const result = await this.sportsCategoryService.checkCategoryNameExists(
        name.trim(),
        excludeId ? Number(excludeId) : null
      );

      res.json(result);
    } catch (error) {
      console.error("Error en checkCategoryNameAvailability:", error);
      res.status(500).json({
        success: false,
        message: "Error al verificar disponibilidad.",
        statusCode: 500,
      });
    }
  };

  /**
   * GET: Estadísticas de categorías
   */
  getSportsCategoryStats = async (req, res) => {
    try {
      const result = await this.sportsCategoryService.getSportsCategoryStats();
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en getSportsCategoryStats:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadísticas.",
        statusCode: 500,
      });
    }
  };

  /**
   * POST: Crear nueva categoría
   * Soporta carga de imagen a Cloudinary
   */
  createSportsCategory = async (req, res) => {
    try {
      const {
        name,
        description,
        minAge,
        maxAge,
        status = "Activo",
        publicar = false,
      } = req.body;

      // Validaciones básicas
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "El nombre de la categoría es obligatorio.",
          statusCode: 400,
        });
      }

      const hasMin =
        minAge !== undefined && minAge !== null && String(minAge).trim() !== "";
      const hasMax =
        maxAge !== undefined && maxAge !== null && String(maxAge).trim() !== "";

      if (!hasMin || !hasMax) {
        return res.status(400).json({
          success: false,
          message: "Las edades mínima y máxima son obligatorias.",
          statusCode: 400,
        });
      }

      const minAgeNum = Number(minAge);
      const maxAgeNum = Number(maxAge);
      if (!Number.isFinite(minAgeNum) || !Number.isFinite(maxAgeNum)) {
        return res.status(400).json({
          success: false,
          message: "Las edades deben ser números válidos.",
          statusCode: 400,
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "La imagen es obligatoria para crear una categoría.",
          statusCode: 400,
        });
      }

      // Subir imagen a Cloudinary
      let imageUrl = null;
      try {
        imageUrl = await uploadToCloudinary(
          req.file.buffer,
          `sports-category-${name.trim().replace(/\s+/g, "-").toLowerCase()}`,
          { folder: "astrostar/sports-categories" }
        );
      } catch (uploadError) {
        console.error("Error al subir a Cloudinary:", uploadError);
        return res.status(500).json({
          success: false,
          message:
            "Error al subir la imagen. Verifica tus credenciales de Cloudinary.",
          statusCode: 500,
        });
      }

      // Preparar datos
      const categoryData = {
        nombre: name.trim(),
        descripcion: description || null,
        edadMinima: Number(minAge),
        edadMaxima: Number(maxAge),
        estado: status || "Activo",
        publicar: publicar === "true" || publicar === true,
        archivo: imageUrl, // URL de Cloudinary
      };

      // Crear categoría
      const result = await this.sportsCategoryService.createSportsCategory(
        categoryData
      );
      res.status(result.statusCode || 201).json(result);
    } catch (error) {
      console.error("Error en createSportsCategory:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al crear la categoría.",
        statusCode: 500,
      });
    }
  };

  /**
   * PUT: Actualizar categoría
   * Permite cambiar imagen o mantener la existente
   */
  updateSportsCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, minAge, maxAge, status, publicar } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es requerido.",
          statusCode: 400,
        });
      }

      // Preparar datos de actualización
      const updateData = {};

      if (name !== undefined && name.trim()) updateData.nombre = name.trim();
      if (description !== undefined) updateData.descripcion = description;
      if (minAge !== undefined) updateData.edadMinima = Number(minAge);
      if (maxAge !== undefined) updateData.edadMaxima = Number(maxAge);
      if (status !== undefined) updateData.estado = status;
      if (publicar !== undefined)
        updateData.publicar = publicar === "true" || publicar === true;

      // Si se proporciona nueva imagen, subirla a Cloudinary
      if (req.file) {
        try {
          const imageUrl = await uploadToCloudinary(
            req.file.buffer,
            `sports-category-${(name || "update")
              .trim()
              .replace(/\s+/g, "-")
              .toLowerCase()}`,
            { folder: "astrostar/sports-categories" }
          );
          updateData.archivo = imageUrl;
        } catch (uploadError) {
          console.error("Error al subir a Cloudinary:", uploadError);
          return res.status(500).json({
            success: false,
            message: "Error al subir la imagen a Cloudinary.",
            statusCode: 500,
          });
        }
      }

      // Si se debe eliminar la imagen existente
      if (req.body.removeImage === "true") {
        updateData.archivo = null;
      }

      // Actualizar categoría
      const result = await this.sportsCategoryService.updateSportsCategory(
        id,
        updateData
      );
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en updateSportsCategory:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al actualizar la categoría.",
        statusCode: 500,
      });
    }
  };

  /**
   * DELETE: Eliminar categoría
   */
  deleteSportsCategory = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es requerido.",
          statusCode: 400,
        });
      }

      const result = await this.sportsCategoryService.deleteSportsCategory(id);
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en deleteSportsCategory controller:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al eliminar la categoría.",
        statusCode: 500,
      });
    }
  };

  /**
   * GET: Obtener atletas de una categoría
   */
  getAthletesByCategory = async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "El ID de la categoría es requerido.",
          statusCode: 400,
        });
      }

      const result = await this.sportsCategoryService.getAthletesByCategory(id);
      res.status(result.statusCode || 200).json(result);
    } catch (error) {
      console.error("Error en getAthletesByCategory:", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener atletas.",
        statusCode: 500,
      });
    }
  };
}


