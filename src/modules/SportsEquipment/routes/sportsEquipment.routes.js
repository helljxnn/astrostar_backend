import express from "express";
import { SportsEquipment } from "../controllers/sportEquipment.controller.js";
// import { authenticateToken } from "../../../middlewares/checkToken.js"; // Descomenta para proteger rutas
// import { checkPermissions } from "../../../middlewares/checkPermissions.js"; // Descomenta para permisos

const router = express.Router();
const controller = new SportsEquipment();

/**
 * @swagger
 * tags:
 *   name: SportsEquipment
 *   description: Gestión de material deportivo
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SportsEquipment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del material deportivo.
 *           example: 1
 *         name:
 *           type: string
 *           description: Nombre del material deportivo.
 *           example: "Balón de Fútbol"
 *         state:
 *           type: string
 *           enum: [Disponible, EnUso, Mantenimiento, DeBaja]
 *           description: Estado actual del material.
 *           example: "Disponible"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del registro.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de la última actualización.
 *
 *     SportsEquipmentResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SportsEquipment'
 *         pagination:
 *           $ref: '#/components/schemas/Pagination'
 */

/**
 * @swagger
 * /api/sports-equipment:
 *   get:
 *     summary: Obtener todos los materiales deportivos con paginación y búsqueda
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda por nombre o estado.
 *     responses:
 *       200:
 *         description: Lista de materiales deportivos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SportsEquipmentResponse'
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/", controller.GetAll);

/**
 * @swagger
 * /api/sports-equipment/{id}:
 *   get:
 *     summary: Obtener un material deportivo por su ID
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del material deportivo.
 *     responses:
 *       200:
 *         description: Detalles del material deportivo.
 *       404:
 *         description: Material deportivo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.get("/:id", controller.GetById);

/**
 * @swagger
 * /api/sports-equipment:
 *   post:
 *     summary: Crear un nuevo material deportivo
 *     tags: [SportsEquipment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Conos de Entrenamiento"
 *     responses:
 *       201:
 *         description: Material deportivo creado exitosamente.
 *       400:
 *         description: Datos inválidos (ej. nombre duplicado o vacío).
 *       500:
 *         description: Error interno del servidor.
 */
router.post("/", controller.Create);

/**
 * @swagger
 * /api/sports-equipment/{id}:
 *   put:
 *     summary: Actualizar un material deportivo
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Balón de Baloncesto"
 *               state:
 *                 type: string
 *                 enum: [Disponible, EnUso, Mantenimiento, DeBaja]
 *                 example: "Mantenimiento"
 *     responses:
 *       200:
 *         description: Material deportivo actualizado.
 *       404:
 *         description: Material deportivo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.put("/:id", controller.Update);

/**
 * @swagger
 * /api/sports-equipment/{id}:
 *   delete:
 *     summary: Eliminar un material deportivo
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Material deportivo eliminado.
 *       400:
 *         description: No se puede eliminar porque tiene registros asociados.
 *       404:
 *         description: Material deportivo no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */
router.delete("/:id", controller.Delete);

export default router;

