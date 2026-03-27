import { Router } from "express";
import rateLimit from "express-rate-limit";
import { preRegistrationsController } from "../controllers/preRegistrations.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";
import { rateLimitKeyGenerator } from "../../../middlewares/rateLimitKeyGenerator.js";

const router = Router();

// Rate limiter para endpoint público (prevenir spam)
// En desarrollo: más permisivo para pruebas
// En producción: más restrictivo para seguridad
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 3 : 20, // 3 en prod, 20 en dev
  message: {
    success: false,
    message: "Demasiadas solicitudes. Por favor intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKeyGenerator,
  skipSuccessfulRequests: true, // Solo contar requests exitosas (permite reintentos si hay error)
});

// Rate limiter para reenvío de correo
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: process.env.NODE_ENV === 'production' ? 3 : 10, // 3 en prod, 10 en dev
  message: {
    success: false,
    message: "Demasiados intentos de reenvío. Por favor intenta más tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKeyGenerator,
});

// Público - Sin autenticación (con rate limiting)
router.post("/", createLimiter, preRegistrationsController.create);
router.post("/resend-email", resendLimiter, preRegistrationsController.resendEmail);
router.get("/check-document/:identification", preRegistrationsController.checkDocument);
router.get("/check-email/:email", preRegistrationsController.checkEmail);

// Protegidas - Requieren autenticación
router.get("/report", authenticateToken, checkPermissions("enrollments", "Ver"), preRegistrationsController.findAllForReport); // ANTES de /:id
router.get("/", authenticateToken, checkPermissions("enrollments", "Ver"), preRegistrationsController.findAll);
router.get("/:id", authenticateToken, checkPermissions("enrollments", "Ver"), preRegistrationsController.findById);
router.put(
  "/:id/status",
  authenticateToken,
  (req, res, next) => {
    const normalizedStatus = String(req.body?.status || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const isRejectAction =
      normalizedStatus.includes("reject") ||
      normalizedStatus.includes("rechaz");
    const action = isRejectAction ? "Rechazar" : "Aceptar";
    return checkPermissions("enrollments", action)(req, res, next);
  },
  preRegistrationsController.updateStatus,
);
router.delete("/:id", authenticateToken, checkPermissions("enrollments", "Rechazar"), preRegistrationsController.delete);

export default router;

