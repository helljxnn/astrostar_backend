// src/modules/Providers/routes/providers.routes.js
import express from "express";
import { ProvidersController } from "../controllers/providers.controller.js";
import {
  providersValidators,
  handleValidationErrors,
} from "../validators/providers.validator.js";

const router = express.Router();
const providersController = new ProvidersController();

/**
 * @swagger
 * tags:
 *   name: Providers
 *   description: Gestión de proveedores
 */

/**
 * IMPORTANTE: Las rutas de verificación deben ir ANTES de las rutas con parámetros dinámicos
 * para evitar conflictos de routing
 */

// ============================================
// NUEVO: Ruta para obtener tipos de documento
// ============================================
/**
 * @swagger
 * /api/providers/document-types:
 *   get:
 *     summary: Get available document types
 *     description: Retrieves all available document types for natural persons
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Document types retrieved successfully
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
 *                     $ref: '#/components/schemas/DocumentType'
 *                 message:
 *                   type: string
 *                   example: "Tipos de documento obtenidos exitosamente."
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/document-types", providersController.getDocumentTypes);

/**
 * @swagger
 * /api/providers/reference-data:
 *   get:
 *     summary: Get reference data for forms
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Reference data retrieved successfully
 */
router.get("/reference-data", providersController.getReferenceData);

/**
 * @swagger
 * /api/providers/document-validation-rules:
 *   get:
 *     summary: Get document validation rules by type
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Document validation rules retrieved successfully
 */
router.get(
  "/document-validation-rules",
  providersController.getDocumentValidationRules
);

/**
 * @swagger
 * /api/providers/check-nit:
 *   get:
 *     summary: Check if NIT/document is available
 *     description: Validates if a NIT (for juridica) or identification document (for natural) is available for use
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: nit
 *         required: true
 *         schema:
 *           type: string
 *         description: NIT for juridica (10 digits) or identification document for natural
 *         example: "1234567890"
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *         description: Provider ID to exclude from validation (for updates)
 *         example: 1
 *       - in: query
 *         name: tipoEntidad
 *         schema:
 *           type: string
 *           enum: [juridica, natural]
 *           default: juridica
 *         description: Entity type to determine validation rules
 *     responses:
 *       200:
 *         description: NIT/document availability check result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailabilityCheck'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.get(
  "/check-nit",
  providersValidators.checkNit,
  handleValidationErrors,
  providersController.checkNitAvailability
);

/**
 * @swagger
 * /api/providers/check-business-name:
 *   get:
 *     summary: Check if business name is available
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: businessName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: tipoEntidad
 *         schema:
 *           type: string
 *           enum: [juridica, natural]
 *           default: juridica
 *     responses:
 *       200:
 *         description: Business name availability
 */
router.get(
  "/check-business-name",
  providersValidators.checkBusinessName,
  handleValidationErrors,
  providersController.checkBusinessNameAvailability
);

/**
 * @swagger
 * /api/providers/check-email:
 *   get:
 *     summary: Check if email is available
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Email availability
 */
router.get(
  "/check-email",
  providersValidators.checkEmail,
  handleValidationErrors,
  providersController.checkEmailAvailability
);

/**
 * @swagger
 * /api/providers/check-contact:
 *   get:
 *     summary: Check if contact name is available
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: contact
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Contact name availability
 */
router.get(
  "/check-contact",
  providersValidators.checkContact,
  handleValidationErrors,
  providersController.checkContactAvailability
);

/**
 * @swagger
 * /api/providers/check-identification:
 *   get:
 *     summary: Check if identification is available
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: identification
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: excludeUserId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Identification availability
 */
router.get(
  "/check-identification",
  providersValidators.checkIdentification,
  handleValidationErrors,
  providersController.checkIdentificationAvailability
);

/**
 * @swagger
 * /api/providers/stats:
 *   get:
 *     summary: Get provider statistics
 *     description: Retrieves statistical information about providers
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Provider statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProviderStats'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/stats", providersController.getProviderStats);

/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: Get list of providers with pagination and filters
 *     tags: [Providers]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Activo, Inactivo]
 *         description: Filter by status
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [juridica, natural]
 *         description: Filter by entity type
 *     responses:
 *       200:
 *         description: List of providers retrieved successfully
 *       400:
 *         description: Invalid parameters
 */
router.get(
  "/",
  providersValidators.getAll,
  handleValidationErrors,
  providersController.getAllProviders
);

/**
 * @swagger
 * /api/providers/{id}/active-purchases:
 *   get:
 *     summary: Check if provider has active purchases
 *     tags: [Providers]
 */
router.get(
  "/:id/active-purchases",
  providersValidators.getById,
  handleValidationErrors,
  providersController.checkActivePurchases
);

/**
 * @swagger
 * /api/providers/{id}:
 *   get:
 *     summary: Get provider by ID
 *     tags: [Providers]
 */
router.get(
  "/:id",
  providersValidators.getById,
  handleValidationErrors,
  providersController.getProviderById
);

/**
 * @swagger
 * /api/providers:
 *   post:
 *     summary: Create new provider
 *     tags: [Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipoEntidad
 *               - razonSocial
 *               - nit
 *               - contactoPrincipal
 *               - telefono
 *               - direccion
 *               - ciudad
 *             properties:
 *               tipoEntidad:
 *                 type: string
 *                 enum: [juridica, natural]
 *                 description: Entity type
 *               razonSocial:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 description: Business name or full name
 *               nit:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *                 description: Tax ID or identification document
 *               tipoDocumento:
 *                 type: string
 *                 enum: [CC, TI, CE, PAS]
 *                 description: Document type (required for natural persons)
 *               contactoPrincipal:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 150
 *                 description: Main contact person
 *               correo:
 *                 type: string
 *                 format: email
 *                 maxLength: 150
 *                 description: Email address (optional)
 *               telefono:
 *                 type: string
 *                 minLength: 7
 *                 maxLength: 20
 *                 description: Phone number
 *               direccion:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *                 description: Address
 *               ciudad:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: City
 *               descripcion:
 *                 type: string
 *                 maxLength: 500
 *                 description: Description (optional)
 *               estado:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *                 default: Activo
 *                 description: Status
 *     responses:
 *       201:
 *         description: Provider created successfully
 *       400:
 *         description: Validation error
 */
router.post(
  "/",
  providersValidators.create,
  handleValidationErrors,
  providersController.createProvider
);

/**
 * @swagger
 * /api/providers/{id}:
 *   put:
 *     summary: Update provider
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Provider ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipoEntidad:
 *                 type: string
 *                 enum: [juridica, natural]
 *               razonSocial:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               nit:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *               tipoDocumento:
 *                 type: string
 *                 enum: [CC, TI, CE, PAS]
 *               contactoPrincipal:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 150
 *               correo:
 *                 type: string
 *                 format: email
 *                 maxLength: 150
 *               telefono:
 *                 type: string
 *                 minLength: 7
 *                 maxLength: 20
 *               direccion:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *               ciudad:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               descripcion:
 *                 type: string
 *                 maxLength: 500
 *               estado:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *     responses:
 *       200:
 *         description: Provider updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Provider not found
 */
router.put(
  "/:id",
  providersValidators.update,
  handleValidationErrors,
  providersController.updateProvider
);

/**
 * @swagger
 * /api/providers/{id}/status:
 *   patch:
 *     summary: Change provider status
 *     tags: [Providers]
 */
router.patch(
  "/:id/status",
  providersValidators.changeStatus,
  handleValidationErrors,
  providersController.changeProviderStatus
);

/**
 * @swagger
 * /api/providers/{id}:
 *   delete:
 *     summary: Delete provider (changes to Inactive)
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Provider deleted successfully
 *       400:
 *         description: Cannot delete provider with active purchases
 *       404:
 *         description: Provider not found
 */
router.delete(
  "/:id",
  providersValidators.delete,
  handleValidationErrors,
  providersController.deleteProvider
);

export default router;
