import { Router } from "express";
import { enrollmentsController } from "../controllers/enrollments.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de matrículas
router.post(
  "/legacy-import/preview",
  checkPermissions("enrollments", "Aceptar"),
  enrollmentsController.previewLegacyImport
);
router.post(
  "/legacy-import/batch/preview",
  checkPermissions("enrollments", "Aceptar"),
  enrollmentsController.previewLegacyImportBatch
);
router.post(
  "/legacy-import",
  checkPermissions("enrollments", "Aceptar"),
  enrollmentsController.createLegacyImport
);
router.post(
  "/legacy-import/batch",
  checkPermissions("enrollments", "Aceptar"),
  enrollmentsController.createLegacyImportBatch
);
router.post("/", checkPermissions("enrollments", "Aceptar"), enrollmentsController.create);
router.get("/report", checkPermissions("enrollments", "Ver"), enrollmentsController.findAllForReport); // ANTES de /:id
router.get("/", checkPermissions("enrollments", "Ver"), enrollmentsController.findAll);
router.get("/:id", checkPermissions("enrollments", "Ver"), enrollmentsController.findById);
router.put("/:id", checkPermissions("enrollments", "Aceptar"), enrollmentsController.update);
router.delete("/:id", checkPermissions("enrollments", "Rechazar"), enrollmentsController.delete); // Bloqueada - devuelve error 403
router.get("/athlete/:athleteId", checkPermissions("enrollments", "Ver"), enrollmentsController.findByAthleteId);
router.get("/athlete/:athleteId/history", checkPermissions("enrollments", "Ver"), enrollmentsController.getAthleteHistory);

// Rutas para procesamiento de vencimientos (solo admin)
router.post("/process-expired", checkPermissions("enrollments", "Aceptar"), enrollmentsController.processExpired);
// NOTA: La renovación se maneja automáticamente a través del sistema de pagos
// Endpoint: POST /api/payments/athletes/:athleteId/enrollment-renewal

export default router;

