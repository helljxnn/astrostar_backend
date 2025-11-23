// src/features/sports-categories/routes/sportsCategory.routes.js
import express from 'express';
import { SportsCategoryController } from '../controllers/sportsCategory.controller.js';
import { sportsCategoryValidators, handleValidationErrors } from '../validators/sportsCategory.Validation.js';

// Middleware para subida de archivos
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();
const sportsCategoryController = new SportsCategoryController();

// =============================================================================
// 📚 Swagger: Documentación API
// =============================================================================

/**
 * @swagger
 * tags:
 *   name: SportsCategories
 *   description: Gestión de categorías deportivas (API pública)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SportsCategory:
 *       type: object
 *       required:
 *         - name
 *         - minAge
 *         - maxAge
 *         - status
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la categoría
 *           example: 1
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Nombre único de la categoría
 *           example: "Sub 12"
 *         description:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           description: Descripción opcional
 *           example: "Niños entre 10 y 12 años"
 *         minAge:
 *           type: integer
 *           minimum: 5
 *           description: Edad mínima (inclusive)
 *           example: 10
 *         maxAge:
 *           type: integer
 *           maximum: 80
 *           description: Edad máxima (inclusive)
 *           example: 12
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           description: Estado de la categoría
 *           example: "Active"
 *         fileUrl:
 *           type: string
 *           nullable: true
 *           description: URL del archivo (imagen/PDF) en Cloudinary
 *           example: "https://res.cloudinary.com/.../sports-categories/image.jpg"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-03-10T08:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-03-10T08:00:00Z"
 *     
 *     CreateSportsCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *         - minAge
 *         - maxAge
 *         - status
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: "Sub 14"
 *         description:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *           example: "Niños entre 12 y 14 años"
 *         minAge:
 *           type: integer
 *           minimum: 5
 *           example: 12
 *         maxAge:
 *           type: integer
 *           maximum: 80
 *           example: 14
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *           default: "Active"
 *           example: "Active"
 *         file:
 *           type: string
 *           format: binary
 *           description: Imagen o PDF (opcional)
 *     
 *     UpdateSportsCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *           nullable: true
 *         minAge:
 *           type: integer
 *           minimum: 5
 *         maxAge:
 *           type: integer
 *           maximum: 80
 *         status:
 *           type: string
 *           enum: [Active, Inactive]
 *         file:
 *           type: string
 *           format: binary
 *           description: Nuevo archivo (opcional)
 *     
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 7
 *         pages:
 *           type: integer
 *           example: 1
 *   
 *   responses:
 *     BadRequest:
 *       description: Solicitud incorrecta
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "El nombre es obligatorio."
 *               field:
 *                 type: string
 *                 example: "name"
 *               value:
 *                 type: string
 *                 example: ""
 *     
 *     NotFound:
 *       description: Recurso no encontrado
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "No se encontró la categoría con ID 999."
 *     
 *     Conflict:
 *       description: Conflicto (nombre duplicado)
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "Ya existe una categoría con ese nombre."
 */

// =============================================================================
// 📊 Rutas públicas (sin parámetros)
// =============================================================================

/**
 * @swagger
 * /api/sports-categories/stats:
 *   get:
 *     summary: Obtener estadísticas generales de categorías
 *     tags: [SportsCategories]
 *     responses:
 *       200:
 *         description: Estadísticas recuperadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 8
 *                     active:
 *                       type: integer
 *                       example: 6
 *                     inactive:
 *                       type: integer
 *                       example: 2
 *                 message:
 *                   type: string
 *                   example: "Estadísticas de categorías recuperadas exitosamente."
 */
router.get('/stats', sportsCategoryController.getSportsCategoryStats);

/**
 * @swagger
 * /api/sports-categories/active-for-select:
 *   get:
 *     summary: Obtener categorías activas para select
 *     tags: [SportsCategories]
 *     responses:
 *       200:
 *         description: Categorías activas para select
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Sub 12"
 */
router.get('/active-for-select', sportsCategoryController.getActiveCategoriesForSelect);

/**
 * @swagger
 * /api/sports-categories/check-name:
 *   get:
 *     summary: Verificar disponibilidad de nombre de categoría
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre a verificar
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: ID a excluir (para edición)
 *     responses:
 *       200:
 *         description: Verificación completada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Nombre disponible."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get(
  '/check-name',
  sportsCategoryValidators.checkName,
  handleValidationErrors,
  sportsCategoryController.checkCategoryNameAvailability
);

// =============================================================================
// 🧾 Operaciones CRUD básicas
// =============================================================================

/**
 * @swagger
 * /api/sports-categories:
 *   get:
 *     summary: Listar todas las categorías (con paginación y filtros)
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite por página (máx. 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o descripción
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Inactive]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SportsCategory'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *                   example: "Categorías recuperadas exitosamente."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get(
  '/',
  sportsCategoryValidators.getAll,
  handleValidationErrors,
  sportsCategoryController.getAllSportsCategories
);

/**
 * @swagger
 * /api/sports-categories:
 *   post:
 *     summary: Crear una nueva categoría deportiva
 *     tags: [SportsCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateSportsCategoryRequest'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SportsCategory'
 *                 message:
 *                   type: string
 *                   example: "Categoría creada exitosamente."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.post(
  '/',
  upload.single('file'), // ← Soporte para archivo
  sportsCategoryValidators.create,
  handleValidationErrors,
  sportsCategoryController.createSportsCategory
);

// =============================================================================
// 🎯 Rutas con parámetros (ID)
// =============================================================================

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
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SportsCategory'
 *                 message:
 *                   type: string
 *                   example: "Categoría recuperada exitosamente."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  sportsCategoryValidators.getById,
  handleValidationErrors,
  sportsCategoryController.getSportsCategoryById
);

/**
 * @swagger
 * /api/sports-categories/{id}/athletes:
 *   get:
 *     summary: Obtener atletas inscritos en una categoría
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Lista de atletas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       fullName:
 *                         type: string
 *                       age:
 *                         type: integer
 *                       gender:
 *                         type: string
 *                       enrollmentDate:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *                   example: "Atletas recuperados exitosamente."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id/athletes',
  sportsCategoryValidators.getById,
  handleValidationErrors,
  sportsCategoryController.getAthletesByCategory
);

/**
 * @swagger
 * /api/sports-categories/{id}:
 *   put:
 *     summary: Actualizar categoría por ID
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSportsCategoryRequest'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SportsCategory'
 *                 message:
 *                   type: string
 *                   example: "Categoría actualizada exitosamente."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.put(
  '/:id',
  upload.single('file'), // ← Soporte para archivo
  sportsCategoryValidators.update,
  handleValidationErrors,
  sportsCategoryController.updateSportsCategory
);

/**
 * @swagger
 * /api/sports-categories/{id}:
 *   delete:
 *     summary: Eliminar categoría por ID
 *     tags: [SportsCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Categoría eliminada exitosamente."
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:id',
  sportsCategoryValidators.delete,
  handleValidationErrors,
  sportsCategoryController.deleteSportsCategory
);

export default router;