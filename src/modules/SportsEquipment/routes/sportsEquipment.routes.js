import express from "express";
import { SportsEquipment } from "../controllers/sportEquipment.controller.js";
import multer from "multer";

const router = express.Router();
const controller = new SportsEquipment();

// Configuración de Multer para manejar la subida de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
 *         quantityInitial:
 *           type: integer
 *           description: Cantidad inicial registrada (histórico).
 *           example: 50
 *         quantityTotal:
 *           type: integer
 *           description: Cantidad actual disponible en inventario.
 *           example: 45
 *         status:
 *           type: string
 *           enum: [Active, Inactive, InRepair]
 *           description: Estado del material deportivo.
 *           example: "Active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización.
 *
 *     CreateSportsEquipmentRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del nuevo material deportivo.
 *           example: "Conos de Entrenamiento"
 *
 *     UpdateSportsEquipmentRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nuevo nombre para el material deportivo.
 *           example: "Balón de Baloncesto"
 *         status:
 *           type: string
 *           enum: [Active, Inactive, InRepair]
 *           description: Nuevo estado para el material deportivo.
 *           example: "Inactive"
 *
 *     CreateDisposalRequest:
 *       type: object
 *       required:
 *         - quantity
 *         - reason
 *       properties:
 *         quantity:
 *           type: integer
 *           description: Cantidad de material a dar de baja.
 *           example: 2
 *         reason:
 *           type: string
 *           description: Motivo de la baja.
 *           example: "Desgaste por uso"
 *         observation:
 *           type: string
 *           description: Observaciones adicionales (opcional).
 *           example: "El material presenta roturas irreparables."
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: "Hasta 5 imágenes como evidencia de la baja."
 */

/**
 * @swagger
 * /api/sports-equipment:
 *   get:
 *     summary: Obtener todos los materiales deportivos
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para filtrar por nombre o estado.
 *     responses:
 *       200:
 *         description: Lista de materiales deportivos obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SportsEquipment'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 *         description: ID del material deportivo a obtener.
 *     responses:
 *       200:
 *         description: Material deportivo encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SportsEquipment'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 *             $ref: '#/components/schemas/CreateSportsEquipmentRequest'
 *     responses:
 *       201:
 *         description: Material deportivo creado exitosamente.
 *       400:
 *         description: Datos inválidos, como nombre duplicado o faltante.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 *         description: ID del material deportivo a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSportsEquipmentRequest'
 *     responses:
 *       200:
 *         description: Material deportivo actualizado exitosamente.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
 *         description: ID del material deportivo a eliminar.
 *     responses:
 *       200:
 *         description: Material deportivo eliminado exitosamente.
 *       400:
 *         description: No se puede eliminar porque tiene registros asociados (compras, bajas).
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete("/:id", controller.Delete);

/**
 * @swagger
 * /api/sports-equipment/{id}/disposals:
 *   post:
 *     summary: Registrar una baja de material deportivo
 *     tags: [SportsEquipment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del material deportivo al que se le dará de baja.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateDisposalRequest'
 *     responses:
 *       201:
 *         description: Baja registrada exitosamente.
 *       400:
 *         description: Datos inválidos, como cantidad insuficiente o campos faltantes.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/:id/disposals",
  upload.array("images", 5),
  controller.CreateDisposal
);

export default router;
