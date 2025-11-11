import express from "express";
import { PurchaseController } from "../controllers/purchase.controller.js";
import multer from "multer";

import { authenticateToken } from "../../../middlewares/auth.js";
const router = express.Router();
const controller = new PurchaseController();

// Configuración de Multer para manejar la subida de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Gestión de compras y facturas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Purchase:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         purchaseNumber:
 *           type: string
 *           example: "PN-A1B2C3D4"
 *         purchaseDate:
 *           type: string
 *           format: date-time
 *         deliveryDate:
 *           type: string
 *           format: date-time
 *         totalAmount:
 *           type: number
 *           format: float
 *           example: 150.50
 *         status:
 *           type: string
 *           enum: [Pending, Received, Partial, Cancelled]
 *           example: "Received"
 *         notes:
 *           type: string
 *           example: "Compra de balones para la temporada."
 *         provider:
 *           type: object
 *           properties:
 *             businessName:
 *               type: string
 *               example: "Deportes ABC"
 *
 *     PurchaseItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         productName:
 *           type: string
 *           example: "Balón de Fútbol"
 *         quantity:
 *           type: integer
 *           example: 10
 *         unitPrice:
 *           type: number
 *           format: float
 *           example: 15.05
 *         subtotal:
 *           type: number
 *           format: float
 *           example: 150.50
 *
 *     PurchaseDetail:
 *       allOf:
 *         - $ref: '#/components/schemas/Purchase'
 *         - type: object
 *           properties:
 *             items:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PurchaseItem'
 *             images:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   url:
 *                     type: string
 *                     format: uri
 *
 *     CreatePurchaseRequest:
 *       type: object
 *       required:
 *         - providerId
 *         - items
 *       properties:
 *         providerId:
 *           type: integer
 *           description: ID del proveedor.
 *           example: 1
 *         purchaseDate:
 *           type: string
 *           format: date
 *           description: Fecha de la compra.
 *           example: "2024-10-20"
 *         deliveryDate:
 *           type: string
 *           format: date
 *           description: Fecha de entrega estimada (opcional).
 *           example: "2024-10-25"
 *         notes:
 *           type: string
 *           description: Notas adicionales sobre la compra.
 *           example: "Factura N° 12345"
 *         items:
 *           type: string
 *           format: json
 *           description: "Un string JSON que contiene un array de objetos, cada uno representando un artículo de la compra."
 *           example: '[{"sportsEquipmentId": 1, "productName": "Balón", "quantity": 10, "unitPrice": 25.50}, {"sportsEquipmentId": 2, "productName": "Cono", "quantity": 50, "unitPrice": 2.00}]'
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: "Hasta 5 imágenes de la factura o evidencia de la compra."
 */

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Obtener todas las compras
 *     tags: [Purchases]
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
 *         description: Cantidad de resultados por página.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por número de compra o nombre de proveedor.
 *     responses:
 *       200:
 *         description: Lista de compras obtenida.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Purchase'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", controller.GetAll);

/**
 * @swagger
 * /api/purchases/providers:
 *   get:
 *     summary: Obtener todos los proveedores con paginación y búsqueda
 *     tags: [Purchases]
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
 *         description: Cantidad de resultados por página.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre de empresa (businessName) o NIT del proveedor.
 *     responses:
 *       200:
 *         description: Lista de proveedores obtenida exitosamente.
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
 *                   example: "Se encontraron 5 de 10 proveedores."
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Provider'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/providers", controller.GetProviders);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Obtener una compra por su ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la compra a obtener.
 *     responses:
 *       200:
 *         description: Detalles de la compra.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PurchaseDetail'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/:id", controller.GetById);

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Crear una nueva compra
 *     tags: [Purchases]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreatePurchaseRequest'
 *     responses:
 *       201:
 *         description: Compra creada exitosamente.
 *       400:
 *         description: Datos inválidos o faltantes.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/", upload.array("images", 5), controller.Create);

/**
 * @swagger
 * /api/purchases/{id}/cancel:
 *   patch:
 *     summary: Anular una compra
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la compra a anular.
 *     responses:
 *       200:
 *         description: Compra anulada y stock revertido.
 *       400:
 *         description: La compra ya ha sido anulada.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch("/:id/cancel", controller.Cancel);

export default router;
