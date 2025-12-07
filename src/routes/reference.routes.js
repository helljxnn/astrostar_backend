import { Router } from "express";
import prisma from "../config/database.js";

const router = Router();

// Cache simple en memoria (se limpia al reiniciar servidor)
let cache = {
  documentTypes: null,
  sportsCategories: null,
  lastUpdate: {
    documentTypes: null,
    sportsCategories: null,
  },
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// GET /api/reference/document-types
router.get("/document-types", async (req, res) => {
  try {
    const now = Date.now();
    
    // Usar cache si existe y no ha expirado
    if (
      cache.documentTypes &&
      cache.lastUpdate.documentTypes &&
      now - cache.lastUpdate.documentTypes < CACHE_DURATION
    ) {
      return res.json({
        success: true,
        data: cache.documentTypes,
        cached: true,
      });
    }

    // Obtener de BD
    const documentTypes = await prisma.documentType.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Actualizar cache
    cache.documentTypes = documentTypes;
    cache.lastUpdate.documentTypes = now;

    return res.json({
      success: true,
      data: documentTypes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET /api/reference/sports-categories
router.get("/sports-categories", async (req, res) => {
  try {
    const now = Date.now();
    
    // Usar cache si existe y no ha expirado
    if (
      cache.sportsCategories &&
      cache.lastUpdate.sportsCategories &&
      now - cache.lastUpdate.sportsCategories < CACHE_DURATION
    ) {
      return res.json({
        success: true,
        data: cache.sportsCategories,
        cached: true,
      });
    }

    // Obtener de BD
    const categories = await prisma.sportsCategory.findMany({
      where: {
        estado: "Activo",
      },
      select: {
        id: true,
        nombre: true,
        edadMinima: true,
        edadMaxima: true,
        descripcion: true,
      },
      orderBy: {
        edadMinima: "asc",
      },
    });

    // Transformar al formato esperado
    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.nombre,
      ageMin: cat.edadMinima,
      ageMax: cat.edadMaxima,
      description: cat.descripcion,
    }));

    // Actualizar cache
    cache.sportsCategories = formattedCategories;
    cache.lastUpdate.sportsCategories = now;

    return res.json({
      success: true,
      data: formattedCategories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
