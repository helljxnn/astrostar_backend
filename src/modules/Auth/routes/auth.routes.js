import express from "express";
import { AuthController } from "../controllers/auth.controller.js";
import {
  authValidators,
  handleValidationErrors,
} from "../validators/auth.validator.js";
import { authenticateToken } from "../../../middlewares/auth.js";

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
router.post(
  "/login",
  authValidators.login,
  handleValidationErrors,
  authController.login
);

router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/verify-code",
  handleValidationErrors,
  authController.verifyCode
);
router.post(
  "/forgot-password",
  handleValidationErrors,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  handleValidationErrors,
  authController.resetPassword
);


// Rutas protegidas
router.get("/profile", authController.profile);

router.put("/profile/:id", authenticateToken, authController.updateProfile);

router.post(
  "/change-password",
  authenticateToken,
  authValidators.changePassword,
  handleValidationErrors,
  authController.changePassword
);

export default router;
