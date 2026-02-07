import express from "express";
import multer from "multer";
import { PurchasesController } from "../controllers/purchases.controller.js";
import {
  purchasesValidators,
  handleValidationErrors,
} from "../validators/purchases.validator.js";
import purchaseNotesRoutes from "../Notes/routes/purchaseNotes.routes.js";

const router = express.Router();
const purchasesController = new PurchasesController();

// Configurar multer para manejar FormData
const upload = multer({
  storage: multer.memoryStorage(), // Guardar en memoria temporalmente
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Gestión de compras
 */

/**
 * @swagger
 * /api/purchases/stats:
 *   get:
 *     summary: Get purchase statistics
 *     description: Retrieves statistical information about purchases
 *     tags: [Purchases]
 *     responses:
 *       200:
 *         description: Purchase statistics retrieved successfully
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
 *                     totalPurchases:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                     totalAmount:
 *                       type: number
 *       500:
 *         description: Internal server error
 */
router.get("/stats", purchasesController.getPurchaseStats);

/**
 * @swagger
 * /api/purchases/{id}/download:
 *   get:
 *     summary: Download purchase invoice
 *     description: Downloads the invoice file for a specific purchase
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Purchase ID
 *     responses:
 *       200:
 *         description: Invoice file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Purchase or invoice not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id/download", purchasesController.downloadInvoice);

/**
 * @swagger
 * /api/purchases/{id}/invoice:
 *   post:
 *     summary: Upload invoice for a purchase
 *     description: Uploads an invoice file to Cloudinary for a specific purchase
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Purchase ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - invoice
 *             properties:
 *               invoice:
 *                 type: string
 *                 format: binary
 *                 description: Invoice file (PDF, max 5MB)
 *     responses:
 *       200:
 *         description: Invoice uploaded successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Purchase not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/:id/invoice",
  upload.single("invoice"),
  purchasesController.uploadInvoice
);

/**
 * @swagger
 * /api/purchases/{id}/invoice:
 *   delete:
 *     summary: Delete invoice from a purchase
 *     description: Deletes the invoice file from Cloudinary for a specific purchase
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Purchase ID
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *       404:
 *         description: Purchase or invoice not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id/invoice", purchasesController.deleteInvoice);

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Get list of purchases with pagination and filters
 *     tags: [Purchases]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search term
 *       - in: query
 *         name: providerId
 *         schema:
 *           type: integer
 *         description: Filter by provider ID
 *     responses:
 *       200:
 *         description: List of purchases retrieved successfully
 *       400:
 *         description: Invalid parameters
 */
router.get(
  "/",
  purchasesValidators.getAll,
  handleValidationErrors,
  purchasesController.getAllPurchases
);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Get purchase by ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Purchase ID
 *     responses:
 *       200:
 *         description: Purchase found successfully
 *       404:
 *         description: Purchase not found
 */
router.get(
  "/:id",
  purchasesValidators.getById,
  handleValidationErrors,
  purchasesController.getPurchaseById
);

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Create new purchase
 *     tags: [Purchases]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - provider_name
 *               - concept
 *               - purchase_date
 *               - total_amount
 *               - payment_method
 *             properties:
 *               provider_name:
 *                 type: string
 *                 description: Provider name
 *               concept:
 *                 type: string
 *                 description: Purchase concept/description
 *               purchase_date:
 *                 type: string
 *                 format: date
 *                 description: Purchase date
 *               total_amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Total amount
 *               payment_method:
 *                 type: string
 *                 description: Payment method
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Additional notes (optional)
 *               invoice:
 *                 type: string
 *                 format: binary
 *                 description: Invoice file (optional)
 *     responses:
 *       201:
 *         description: Purchase created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  upload.single("invoice"), // Procesar el archivo primero
  purchasesValidators.create,
  handleValidationErrors,
  purchasesController.createPurchase
);

/**
 * @swagger
 * /api/purchases/{id}:
 *   put:
 *     summary: Update purchase
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Purchase ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerId:
 *                 type: integer
 *               concept:
 *                 type: string
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               totalAmount:
 *                 type: number
 *                 minimum: 0
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Purchase updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Purchase not found
 */
router.put(
  "/:id",
  purchasesValidators.update,
  handleValidationErrors,
  purchasesController.updatePurchase
);

// Rutas de notas (deben ir después de las rutas específicas)
router.use("/", purchaseNotesRoutes);

export default router;
