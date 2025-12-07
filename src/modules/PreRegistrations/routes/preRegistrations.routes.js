import { Router } from "express";
import rateLimit from "express-rate-limit";
import { preRegistrationsController } from "../controllers/preRegistrations.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";

const router = Router();

// Rate limiter para endpoint público (prevenir spam)
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 pre-inscripciones por IP cada 15 minutos
  message: {
    success: false,
    message: "Demasiadas solicitudes. Por favor intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para reenvío de correo
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 reenvíos por IP cada hora
  message: {
    success: false,
    message: "Demasiados intentos de reenvío. Por favor intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Público - Sin autenticación (con rate limiting)
router.post("/", createLimiter, preRegistrationsController.create);
router.post("/resend-email", resendLimiter, preRegistrationsController.resendEmail);

// Protegidas - Requieren autenticación
router.get("/", authenticateToken, preRegistrationsController.findAll);
router.get("/:id", authenticateToken, preRegistrationsController.findById);
router.put("/:id/status", authenticateToken, preRegistrationsController.updateStatus);
router.delete("/:id", authenticateToken, preRegistrationsController.delete);

export default router;
