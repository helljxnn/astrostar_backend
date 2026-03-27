import express from "express";
import rateLimit from "express-rate-limit";
import DonorsSponsorsController from "../controllers/donorsSponsors.controller.js";
import {
  donorsSponsorsValidators,
  handleValidationErrors,
} from "../validators/donorsSponsors.validators.js";
import { authenticateToken } from "../../../../middlewares/auth.js";
import { checkPermissions } from "../../../../middlewares/checkPermissions.js";
import { rateLimitKeyGenerator } from "../../../../middlewares/rateLimitKeyGenerator.js";

const router = express.Router();
const controller = DonorsSponsorsController;

const landingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Demasiadas solicitudes. Intenta m\u00e1s tarde.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKeyGenerator,
});

router.post(
  "/landing",
  landingLimiter,
  donorsSponsorsValidators.createFromLanding,
  handleValidationErrors,
  controller.createFromLanding
);

router.get(
  "/stats",
  authenticateToken,
  checkPermissions("donorsSponsors", "Ver"),
  controller.getStats
);

router.get(
  "/reference-data",
  authenticateToken,
  checkPermissions("donorsSponsors", "Ver"),
  controller.getReferenceData
);

router.get(
  "/check-identification",
  authenticateToken,
  checkPermissions("donorsSponsors", "Ver"),
  donorsSponsorsValidators.checkIdentification,
  handleValidationErrors,
  controller.checkIdentification
);

router.get(
  "/check-email",
  authenticateToken,
  checkPermissions("donorsSponsors", "Ver"),
  donorsSponsorsValidators.checkEmail,
  handleValidationErrors,
  controller.checkEmail
);

router.get(
  "/",
  authenticateToken,
  checkPermissions("donorsSponsors", "Ver"),
  donorsSponsorsValidators.list,
  handleValidationErrors,
  controller.getAll
);

router.post(
  "/",
  authenticateToken,
  checkPermissions("donorsSponsors", "Crear"),
  donorsSponsorsValidators.create,
  handleValidationErrors,
  controller.create
);

router.get(
  "/:id",
  authenticateToken,
  checkPermissions("donorsSponsors", "Ver"),
  donorsSponsorsValidators.getById,
  handleValidationErrors,
  controller.getById
);

router.put(
  "/:id",
  authenticateToken,
  checkPermissions("donorsSponsors", "Editar"),
  donorsSponsorsValidators.update,
  handleValidationErrors,
  controller.update
);

router.patch(
  "/:id/status",
  authenticateToken,
  checkPermissions("donorsSponsors", "Editar"),
  donorsSponsorsValidators.changeStatus,
  handleValidationErrors,
  controller.changeStatus
);

router.delete(
  "/:id",
  authenticateToken,
  checkPermissions("donorsSponsors", "Eliminar"),
  donorsSponsorsValidators.delete,
  handleValidationErrors,
  controller.delete
);

export default router;
