import express from 'express';
import providersController from '../controllers/providers.controller.js';
import { providersValidators, handleValidationErrors } from '../validators/providers.validator.js';
// import { checkPermission } from '../../../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Providers
 *   description: Gestión de proveedores
 */

/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: Obtener lista de proveedores
 *     tags: [Providers]
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
 *         schema: { type: string, enum: [Activo, Inactivo] }
 *       - in: query
 *         name: entityType
 *         schema: { type: string, enum: [juridica, natural] }
 *     responses:
 *       200:
 *         description: Lista de proveedores obtenida exitosamente
 */
router.get('/', 
  providersValidators.getAll, 
  handleValidationErrors, 
  providersController.getProviders
);

/**
 * @swagger
 * /api/providers/stats:
 *   get:
 *     summary: Obtener estadísticas de proveedores
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 */
router.get('/stats', 
  providersController.getProviderStats
);

/**
 * @swagger
 * /api/providers/check-nit:
 *   get:
 *     summary: Verificar disponibilidad de NIT
 *     tags: [Providers]
 *     parameters:
 *       - in: query
 *         name: nit
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: excludeId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Disponibilidad verificada
 */
router.get('/check-nit', 
  providersValidators.checkNit, 
  handleValidationErrors, 
  providersController.checkNitAvailability
);

/**
 * @swagger
 * /api/providers/{id}:
 *   get:
 *     summary: Obtener proveedor por ID
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Proveedor encontrado
 *       404:
 *         description: Proveedor no encontrado
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
 *     summary: Crear nuevo proveedor
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
 *               - correo
 *               - telefono
 *               - direccion
 *               - ciudad
 *               - estado
 *             properties:
 *               tipoEntidad:
 *                 type: string
 *                 enum: [juridica, natural]
 *               razonSocial:
 *                 type: string
 *                 maxLength: 200
 *               nit:
 *                 type: string
 *                 maxLength: 50
 *               tipoDocumento:
 *                 type: string
 *                 enum: [CC, TI, CE, PAS]
 *               contactoPrincipal:
 *                 type: string
 *                 maxLength: 150
 *               correo:
 *                 type: string
 *                 maxLength: 150
 *               telefono:
 *                 type: string
 *                 maxLength: 20
 *               direccion:
 *                 type: string
 *                 maxLength: 200
 *               ciudad:
 *                 type: string
 *                 maxLength: 100
 *               descripcion:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *     responses:
 *       201:
 *         description: Proveedor creado exitosamente
 *       400:
 *         description: Datos inválidos
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
 *     summary: Actualizar proveedor
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
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
 *                 maxLength: 200
 *               nit:
 *                 type: string
 *                 maxLength: 50
 *               tipoDocumento:
 *                 type: string
 *                 enum: [CC, TI, CE, PAS]
 *               contactoPrincipal:
 *                 type: string
 *                 maxLength: 150
 *               correo:
 *                 type: string
 *                 maxLength: 150
 *               telefono:
 *                 type: string
 *                 maxLength: 20
 *               direccion:
 *                 type: string
 *                 maxLength: 200
 *               ciudad:
 *                 type: string
 *                 maxLength: 100
 *               descripcion:
 *                 type: string
 *               estado:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *     responses:
 *       200:
 *         description: Proveedor actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Proveedor no encontrado
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
 *     summary: Cambiar estado de proveedor
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Activo, Inactivo]
 *     responses:
 *       200:
 *         description: Estado cambiado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Proveedor no encontrado
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
 *     summary: Eliminar proveedor (cambiar estado a Inactivo)
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Proveedor eliminado exitosamente
 *       404:
 *         description: Proveedor no encontrado
 */
router.delete('/:id', 
  providersValidators.delete, 
  handleValidationErrors, 
  providersController.deleteProvider
);

export default router;