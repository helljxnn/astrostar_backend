// src/modules/Providers/routes/providers.routes.js
import express from 'express';
import { ProvidersController } from '../controllers/providers.controller.js';
import { providersValidators, handleValidationErrors } from '../validators/providers.validator.js';

const router = express.Router();
const providersController = new ProvidersController();

/**
 * IMPORTANTE: Las rutas de verificación deben ir ANTES de las rutas con parámetros dinámicos
 * para evitar conflictos de routing
 */

/**
 * @swagger
 * /api/providers/check-nit:
 *   get:
 *     summary: Check if NIT is available
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: nit
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
 *         description: NIT availability
 */
router.get('/check-nit',
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
router.get('/check-business-name',
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
router.get('/check-email',
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
router.get('/check-contact',
  providersValidators.checkContact,
  handleValidationErrors,
  providersController.checkContactAvailability
);

/**
 * @swagger
 * /api/providers/stats:
 *   get:
 *     summary: Get provider statistics
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Provider statistics
 */
router.get('/stats', providersController.getProviderStats);

/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: Get list of providers
 *     tags: [Providers]
 */
router.get('/',
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
router.get('/:id/active-purchases',
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
router.get('/:id',
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
 */
router.post('/',
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
 */
router.put('/:id',
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
router.patch('/:id/status',
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
 */
router.delete('/:id',
  providersValidators.delete,
  handleValidationErrors,
  providersController.deleteProvider
);

export default router;