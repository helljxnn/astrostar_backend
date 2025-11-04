import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authValidators, handleValidationErrors } from '../validators/auth.validator.js';
import { authenticateToken } from '../../../middlewares/auth.js';

const router = express.Router();
const authController = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Rutas públicas
router.post('/login', 
  authValidators.login, 
  handleValidationErrors, 
  authController.login
);

// Rutas protegidas
router.get('/me', 
  authenticateToken, 
  authController.me
);

router.post('/change-password', 
  authenticateToken,
  authValidators.changePassword, 
  handleValidationErrors, 
  authController.changePassword
);

export default router;