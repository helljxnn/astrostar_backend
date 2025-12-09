import { Router } from "express";
import { enrollmentsController } from "../controllers/enrollments.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.post("/", enrollmentsController.create);
router.get("/", enrollmentsController.findAll);
router.get("/:id", enrollmentsController.findById);
router.put("/:id", enrollmentsController.update);
router.delete("/:id", enrollmentsController.delete);
router.get("/athlete/:athleteId", enrollmentsController.findByAthleteId);

export default router;
