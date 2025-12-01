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

router.post('/forgot-password',
  authValidators.forgotPassword,
  handleValidationErrors,
  authController.forgotPassword
);

router.post('/verify-reset-token',
  authValidators.verifyResetToken,
  handleValidationErrors,
  authController.verifyResetToken
);

router.post('/reset-password',
  authValidators.resetPassword,
  handleValidationErrors,
  authController.resetPassword
);

// Refresh token desde cookie HttpOnly
router.post('/refresh',
  authController.refresh
);

// Logout - limpia cookie HttpOnly
router.post('/logout',
  authController.logout
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

router.post('/request-email-change',
  authenticateToken,
  authController.requestEmailChange
);

router.post('/verify-email-change',
  authenticateToken,
  authController.verifyEmailChange
);

router.put('/profile',
  authenticateToken,
  authController.updateProfile
);

router.post('/logout-all',
  authenticateToken,
  authController.logoutAll
);

export default router;