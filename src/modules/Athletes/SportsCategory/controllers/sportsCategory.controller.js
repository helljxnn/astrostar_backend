import { SportsCategoryService } from "../services/sportsCategory.service.js";
import { uploadToCloudinary } from "../../../../shared/cloudinary.service.js";

export class SportsCategoryController {
  constructor() {
    this.sportsCategoryService = new SportsCategoryService();
  }

  /* --------------------------------------------------------
   🟢 OBTENER TODAS LAS CATEGORÍAS
  -------------------------------------------------------- */
  getAllSportsCategories = async (req, res) => {
    try {
      const result = await this.sportsCategoryService.getAllSportsCategories(req.query);
      res.json(result);
    } catch (error) {
      console.error("❌ Error al obtener categorías:", error);
      res.status(500).json({ success: false, message: "Error al obtener categorías." });
    }
  };

  /* --------------------------------------------------------
   🟢 OBTENER DETALLE DE UNA CATEGORÍA
  -------------------------------------------------------- */
  getSportsCategoryById = async (req, res) => {
    try {
      const { id } = req.params;

      const result = await this.sportsCategoryService.getSportsCategoryById(id);

      // Si el servicio devuelve error o no encuentra la categoría
      if (!result.success) {
        return res.status(result.statusCode).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error("❌ Error al obtener la categoría:", error);
      res.status(500).json({ success: false, message: "Error al obtener la categoría." });
    }
  };

  /* --------------------------------------------------------
   🟢 ESTADÍSTICAS DE CATEGORÍAS
  -------------------------------------------------------- */
  getSportsCategoryStats = async (req, res) => {
    try {
      const result = await this.sportsCategoryService.getSportsCategoryStats();
      res.json(result);
    } catch (error) {
      console.error("❌ Error al obtener estadísticas:", error);
      res.status(500).json({ success: false, message: "Error al obtener estadísticas." });
    }
  };

  /* --------------------------------------------------------
   🟢 VALIDAR DISPONIBILIDAD DE NOMBRE
  -------------------------------------------------------- */
  checkCategoryNameAvailability = async (req, res) => {
    try {
      const result = await this.sportsCategoryService.checkCategoryNameExists(
        req.query.name,
        req.query.excludeId
      );
      res.json(result);
    } catch (error) {
      console.error("❌ Error al verificar nombre:", error);
      res.status(500).json({ success: false, message: "Error al verificar nombre." });
    }
  };

  /* --------------------------------------------------------
   🟢 CREAR NUEVA CATEGORÍA
  -------------------------------------------------------- */
  createSportsCategory = async (req, res) => {
    try {
      const { name, description, minAge, maxAge, status = "Active", publicar = false } = req.body;
      const statusMap = { Active: "Activo", Inactive: "Inactivo" };

      let archivo = null;
      if (req.file) {
        archivo = await uploadToCloudinary(req.file.buffer, "sports-categories", {
          folder: "sports-categories",
        });
      }

      const data = {
        nombre: name.trim(),
        descripcion: description?.trim() || null,
        edadMinima: +minAge,
        edadMaxima: +maxAge,
        estado: statusMap[status] || "Activo",
        publicar: Boolean(publicar),
        ...(archivo && { archivo }),
      };

      const result = await this.sportsCategoryService.createSportsCategory(data);
      res.status(result.statusCode).json(result);
    } catch (error) {
      console.error("❌ Error creando categoría:", error);
      res.status(500).json({ success: false, message: error.message || "Error interno." });
    }
  };

  /* --------------------------------------------------------
   🟢 ACTUALIZAR CATEGORÍA EXISTENTE
  -------------------------------------------------------- */
  updateSportsCategory = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, minAge, maxAge, status, publicar } = req.body;
      const statusMap = { Active: "Activo", Inactive: "Inactivo" };

      let archivo = null;
      if (req.file) {
        archivo = await uploadToCloudinary(req.file.buffer, "sports-categories", {
          folder: "sports-categories",
        });
      }

      const data = {};
      if (name !== undefined) data.nombre = name.trim();
      if (description !== undefined) data.descripcion = description?.trim() || null;
      if (minAge !== undefined) data.edadMinima = +minAge;
      if (maxAge !== undefined) data.edadMaxima = +maxAge;
      if (status !== undefined) data.estado = statusMap[status] || "Activo";
      if (publicar !== undefined) data.publicar = Boolean(publicar);
      if (archivo) data.archivo = archivo;

      const result = await this.sportsCategoryService.updateSportsCategory(id, data);
      res.status(result.statusCode).json(result);
    } catch (error) {
      console.error("❌ Error actualizando categoría:", error);
      res.status(500).json({ success: false, message: error.message || "Error interno." });
    }
  };

  /* --------------------------------------------------------
   🟢 ELIMINAR CATEGORÍA
  -------------------------------------------------------- */
  deleteSportsCategory = async (req, res) => {
    try {
      const result = await this.sportsCategoryService.deleteSportsCategory(req.params.id);
      res.status(result.statusCode).json(result);
    } catch (error) {
      console.error("❌ Error al eliminar categoría:", error);
      res.status(500).json({ success: false, message: "Error al eliminar categoría." });
    }
  };

  /* --------------------------------------------------------
   🔴 NO IMPLEMENTADO AÚN
  -------------------------------------------------------- */
  getAthletesByCategory = async (req, res) => {
    res.status(501).json({ success: false, message: "Endpoint no implementado aún." });
  };
}
