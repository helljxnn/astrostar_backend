import express from "express";
import { ClassesController } from "./classes.controller.js";
import { authenticateToken } from "../../middlewares/auth.js";

const router = express.Router();
const classesController = new ClassesController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas principales de clases
router.get("/", (req, res) => classesController.getAllClasses(req, res));
router.get("/calendar", (req, res) =>
  classesController.getClassesByDateRange(req, res)
);
router.get("/stats", (req, res) => classesController.getStats(req, res));
router.get("/:id", (req, res) => classesController.getClassById(req, res));
router.post("/", (req, res) => classesController.createClass(req, res));
router.put("/:id", (req, res) => classesController.updateClass(req, res));
router.delete("/:id", (req, res) => classesController.deleteClass(req, res));

// Rutas de gestión de deportistas en clases
router.post("/:classId/athletes/:athleteId", (req, res) =>
  classesController.assignAthlete(req, res)
);
router.delete("/:classId/athletes/:athleteId", (req, res) =>
  classesController.removeAthlete(req, res)
);

// Rutas de asistencia
router.post("/:classId/athletes/:athleteId/confirm", (req, res) =>
  classesController.confirmAttendance(req, res)
);
router.put("/:classId/athletes/:athleteId/attendance", (req, res) =>
  classesController.updateAttendanceStatus(req, res)
);

// Rutas de consulta por deportista
router.get("/athlete/:athleteId", (req, res) =>
  classesController.getAthleteClasses(req, res)
);

// Estadísticas de asistencia de una clase
router.get("/:id/attendance/stats", (req, res) =>
  classesController.getClassAttendanceStats(req, res)
);

export default router;
