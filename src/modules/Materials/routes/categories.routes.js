import express from 'express';
import categoriesController from '../controllers/categories.controller.js';
import { authenticateToken } from '../../../middlewares/auth.js';
import { checkPermissions } from '../../../middlewares/checkPermissions.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Material Categories
 *   description: Gestión de categorías de materiales deportivos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MaterialCategory:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         id:
 *           type: integer
 *           description: ID auto-generado de la categoría
 *         nombre:
 *           type: string
 *           maxLength: 100
 *           description: Nombre de la categoría
 *         descripcion:
 *           type: string
 *           description: Descripción de la categoría
 *         estado:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           description: Estado de la categoría
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *         _count:
 *           type: object
 *           properties:
 *             materials:
 *               type: integer
 *               description: Cantidad de materiales asociados
 *     MaterialCategoryInput:
 *       type: object
 *       required:
 *         - nombre
 *       properties:
 *         nombre:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Nombre de la categoría
 *         descripcion:
 *           type: string
 *           description: Descripción de la categoría
 *         estado:
 *           type: string
 *           enum: [Activo, Inactivo]
 *           description: Estado de la categoría
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * /api/materials/categories/report:
 *   get:
 *     summary: Obtener todas las categorías para reporte (sin paginación)
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o descripción
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filtrar por estado
 *     responses:
 *       200:
 *         description: Lista completa de categorías para reporte
 */
router.get(
  '/report',
  checkPermissions('materialCategories', 'Ver'),
  categoriesController.getAllForReport
);

/**
 * @swagger
 * /api/materials/categories/active:
 *   get:
 *     summary: Obtener categorías activas
 *     description: Obtiene solo las categorías con estado Activo (útil para selectores)
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías activas
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
 *                       nombre:
 *                         type: string
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/active',
  checkPermissions('materialCategories', 'Ver'),
  categoriesController.getActive
);

/**
 * @swagger
 * /api/materials/categories/check-name:
 *   get:
 *     summary: Verificar disponibilidad de nombre
 *     description: Verifica si un nombre de categoría está disponible
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: nombre
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre a verificar
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: ID de categoría a excluir (para edición)
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 available:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Nombre disponible"
 *       400:
 *         description: Nombre no proporcionado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/check-name',
  checkPermissions('materialCategories', 'Ver'),
  categoriesController.checkName
);

/**
 * @swagger
 * /api/materials/categories:
 *   get:
 *     summary: Listar todas las categorías
 *     description: Obtiene todas las categorías con paginación y filtros
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
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
 *         description: Elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre o descripción
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
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
 *                     $ref: '#/components/schemas/MaterialCategory'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/',
  checkPermissions('materialCategories', 'Ver'),
  categoriesController.getAll
);

/**
 * @swagger
 * /api/materials/categories/{id}:
 *   get:
 *     summary: Obtener categoría por ID
 *     description: Obtiene los detalles de una categoría específica
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
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
 *                   $ref: '#/components/schemas/MaterialCategory'
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error del servidor
 */
router.get(
  '/:id',
  checkPermissions('materialCategories', 'Ver'),
  categoriesController.getById
);

/**
 * @swagger
 * /api/materials/categories:
 *   post:
 *     summary: Crear nueva categoría
 *     description: Crea una nueva categoría de material
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialCategoryInput'
 *           example:
 *             nombre: "Balones"
 *             descripcion: "Balones deportivos de diferentes disciplinas"
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
 *                   $ref: '#/components/schemas/MaterialCategory'
 *                 message:
 *                   type: string
 *                   example: "Categoría \"Balones\" creada exitosamente"
 *       400:
 *         description: Datos inválidos o nombre duplicado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error del servidor
 */
router.post(
  '/',
  checkPermissions('materialCategories', 'Crear'),
  categoriesController.create
);

/**
 * @swagger
 * /api/materials/categories/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     description: Actualiza los datos de una categoría existente
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MaterialCategoryInput'
 *           example:
 *             nombre: "Balones Deportivos"
 *             descripcion: "Balones para diferentes deportes"
 *             estado: "Activo"
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
 *                   $ref: '#/components/schemas/MaterialCategory'
 *                 message:
 *                   type: string
 *                   example: "Categoría \"Balones Deportivos\" actualizada exitosamente"
 *       400:
 *         description: Datos inválidos o nombre duplicado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put(
  '/:id',
  checkPermissions('materialCategories', 'Editar'),
  categoriesController.update
);

/**
 * @swagger
 * /api/materials/categories/{id}/status:
 *   patch:
 *     summary: Cambiar estado de categoría
 *     description: Alterna el estado de una categoría entre Activo e Inactivo
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MaterialCategory'
 *                 message:
 *                   type: string
 *                   example: "Estado actualizado a \"Inactivo\""
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error del servidor
 */
router.patch(
  '/:id/status',
  checkPermissions('materialCategories', 'Editar'),
  categoriesController.toggleStatus
);

/**
 * @swagger
 * /api/materials/categories/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     description: Elimina una categoría (solo si no tiene materiales asociados)
 *     tags: [Material Categories]
 *     security:
 *       - bearerAuth: []
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
 *                   example: "Categoría eliminada exitosamente"
 *       400:
 *         description: ID inválido o categoría tiene materiales asociados
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete(
  '/:id',
  checkPermissions('materialCategories', 'Eliminar'),
  categoriesController.delete
);

export default router;

