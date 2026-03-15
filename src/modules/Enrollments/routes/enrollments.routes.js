import { Router } from "express";
import { enrollmentsController } from "../controllers/enrollments.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de matrículas
router.post("/", enrollmentsController.create);
router.get("/report", enrollmentsController.findAllForReport); // ANTES de /:id
router.get("/", enrollmentsController.findAll);
router.get("/:id", enrollmentsController.findById);
router.put("/:id", enrollmentsController.update);
router.delete("/:id", enrollmentsController.delete); // Bloqueada - devuelve error 403
router.get("/athlete/:athleteId", enrollmentsController.findByAthleteId);
router.get("/athlete/:athleteId/history", enrollmentsController.getAthleteHistory);

// Rutas para procesamiento de vencimientos (solo admin)
router.post("/process-expired", enrollmentsController.processExpired);
// NOTA: La renovación se maneja automáticamente a través del sistema de pagos
// Endpoint: POST /api/payments/athletes/:athleteId/enrollment-renewal

export default router;
