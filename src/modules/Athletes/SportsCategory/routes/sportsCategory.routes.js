import express from 'express';
import { SportsCategoryController } from '../controllers/sportsCategory.controller.js';
import { sportsCategoryValidators, handleValidationErrors } from '../validators/sportsCategory.Validation.js';
import multer from 'multer';
import { authenticateToken } from '../../../../middlewares/auth.js';
import { checkPermissions } from '../../../../middlewares/checkPermissions.js';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!file || ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error("INVALID_IMAGE_TYPE"));
  },
});

const uploadSportsCategoryImage = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({
        success: false,
        message: "La imagen no puede superar 5MB.",
      });
      return;
    }

    if (error.message === "INVALID_IMAGE_TYPE") {
      res.status(400).json({
        success: false,
        message: "Solo se permiten imagenes JPG, PNG o WEBP.",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: "Archivo de imagen invalido.",
    });
  });
};

const router = express.Router();
const sportsCategoryController = new SportsCategoryController();

/* ========================================================== */
/* ⚠️ RUTAS ESPECÍFICAS PRIMERO (orden es crítico)          */
/* ========================================================== */

/**
 * @swagger
 * /api/sports-categories/validate-name:
 *   get:
 *     summary: Verificar si el nombre está disponible
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: excludeId
 *         schema: { type: integer }
 */
router.get(
  '/validate-name',
  authenticateToken,
  checkPermissions('sportsCategory', 'Ver'),
  sportsCategoryValidators.checkName,
  handleValidationErrors,
  (req, res) => sportsCategoryController.checkCategoryNameAvailability(req, res)
);

/**
 * @swagger
 * /api/sports-categories/public:
 *   get:
 *     summary: Obtener categorías públicas (para landing)
 *     tags: [SportsCategories]
 *     responses:
 *       200:
 *         description: Lista de categorías públicas con imágenes
 */
router.get(
  '/public',
  (req, res) => sportsCategoryController.getPublicCategories(req, res)
);

/**
 * @swagger
 * /api/sports-categories/stats:
 *   get:
 *     summary: Estadísticas de categorías
 *     tags: [SportsCategories]
 */
router.get(
  '/stats',
  authenticateToken,
  checkPermissions('sportsCategory', 'Ver'),
  (req, res) => sportsCategoryController.getSportsCategoryStats(req, res)
);

/* ========================================================== */
/* 📊 RUTAS CON PARÁMETROS (GET por ID, etc.)              */
/* ========================================================== */

/**
 * @swagger
 * /api/sports-categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.get(
  '/:id',
  authenticateToken,
  checkPermissions('sportsCategory', 'Ver'),
  sportsCategoryValidators.getById,
  handleValidationErrors,
  (req, res) => sportsCategoryController.getSportsCategoryById(req, res)
);

/**
 * @swagger
 * /api/sports-categories/{id}/athletes:
 *   get:
 *     summary: Obtener atletas de una categoría
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.get(
  '/:id/athletes',
  authenticateToken,
  checkPermissions('sportsCategory', 'Listar deportistas'),
  sportsCategoryValidators.getById,
  handleValidationErrors,
  (req, res) => sportsCategoryController.getAthletesByCategory(req, res)
);

/* ========================================================== */
/* 📚 RUTAS SIN PARÁMETROS (GET todo, POST, PUT, DELETE)   */
/* ========================================================== */

/**
 * @swagger
 * /api/sports-categories:
 *   get:
 *     summary: Obtener todas las categorías (con filtros)
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: ["Activo", "Inactivo"] }
 */
router.get(
  '/',
  authenticateToken,
  checkPermissions('sportsCategory', 'Ver'),
  sportsCategoryValidators.getAll,
  handleValidationErrors,
  (req, res) => sportsCategoryController.getAllSportsCategories(req, res)
);

/**
 * @swagger
 * /api/sports-categories:
 *   post:
 *     summary: Crear nueva categoría deportiva
 *     tags: [SportsCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, minAge, maxAge]
 *             properties:
 *               name: { type: string, example: "Sub 12" }
 *               description: { type: string }
 *               minAge: { type: integer }
 *               maxAge: { type: integer }
 *               status: { type: string, enum: ["Activo", "Inactivo"] }
 *               publicar: { type: boolean }
 *               file: { type: string, format: binary }
 */
router.post(
  '/',
  authenticateToken,
  checkPermissions('sportsCategory', 'Crear'),
  uploadSportsCategoryImage,
  sportsCategoryValidators.create,
  handleValidationErrors,
  (req, res) => sportsCategoryController.createSportsCategory(req, res)
);

/**
 * @swagger
 * /api/sports-categories/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               minAge: { type: integer }
 *               maxAge: { type: integer }
 *               status: { type: string }
 *               publicar: { type: boolean }
 *               file: { type: string, format: binary }
 */
router.put(
  '/:id',
  authenticateToken,
  checkPermissions('sportsCategory', 'Editar'),
  uploadSportsCategoryImage,
  sportsCategoryValidators.update,
  handleValidationErrors,
  (req, res) => sportsCategoryController.updateSportsCategory(req, res)
);

/**
 * @swagger
 * /api/sports-categories/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 */
router.delete(
  '/:id',
  authenticateToken,
  checkPermissions('sportsCategory', 'Eliminar'),
  sportsCategoryValidators.delete,
  handleValidationErrors,
  (req, res) => sportsCategoryController.deleteSportsCategory(req, res)
);

export default router;
