import express from "express";
import { AuthController } from "../controllers/auth.controller.js";
import {
  authValidators,
  handleValidationErrors,
} from "../validators/auth.validator.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { authLimiter } from "../../../middlewares/rateLimiter.js";

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

// Rutas públicas (con rate limiting estricto)
router.post(
  "/login",
  authLimiter, // Rate limiting: 5 intentos por 15 minutos
  authValidators.login,
  handleValidationErrors,
  authController.login,
);

router.post(
  "/forgot-password",
  authLimiter, // Rate limiting: 5 intentos por 15 minutos
  authValidators.forgotPassword,
  handleValidationErrors,
  authController.forgotPassword,
);

router.post(
  "/verify-reset-token",
  authLimiter, // Rate limiting: 5 intentos por 15 minutos
  authValidators.verifyResetToken,
  handleValidationErrors,
  authController.verifyResetToken,
);

router.post(
  "/reset-password",
  authLimiter, // Rate limiting: 5 intentos por 15 minutos
  authValidators.resetPassword,
  handleValidationErrors,
  authController.resetPassword,
);

// Refresh token desde cookie HttpOnly
router.post("/refresh", authController.refresh);

// Logout - limpia cookie HttpOnly
router.post("/logout", authController.logout);

// Rutas protegidas
router.get("/me", authenticateToken, authController.me);
router.get("/permissions", authenticateToken, authController.getPermissions);

router.post(
  "/change-password",
  authenticateToken,
  authValidators.changePassword,
  handleValidationErrors,
  authController.changePassword,
);

router.post(
  "/request-email-change",
  authenticateToken,
  authController.requestEmailChange,
);

router.post(
  "/verify-email-change",
  authenticateToken,
  authController.verifyEmailChange,
);

router.put("/profile", authenticateToken, authController.updateProfile);

router.post("/logout-all", authenticateToken, authController.logoutAll);

export default router;

