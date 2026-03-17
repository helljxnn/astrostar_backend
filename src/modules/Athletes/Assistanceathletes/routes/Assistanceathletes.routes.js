import express from "express";
import { AssistanceathletesController } from "../controllers/Assistanceathletes.controller.js";
import {
  assistanceathletesValidators,
  handleValidationErrors,
} from "../validators/Assistanceathletes.validators.js";
import { authenticateToken } from "../../../../middlewares/auth.js";
import { checkPermissions } from "../../../../middlewares/checkPermissions.js";

const router = express.Router();
const controller = new AssistanceathletesController();

router.get(
  "/",
  authenticateToken,
  checkPermissions("athletesAssistance", "Ver"),
  assistanceathletesValidators.getByDate,
  handleValidationErrors,
  (req, res) => controller.getAttendanceByDate(req, res)
);

router.get(
  "/history/summary",
  authenticateToken,
  checkPermissions("athletesAssistance", "Ver"),
  assistanceathletesValidators.getHistorySummary,
  handleValidationErrors,
  (req, res) => controller.getHistorySummary(req, res)
);

router.get(
  "/history",
  authenticateToken,
  checkPermissions("athletesAssistance", "Ver"),
  assistanceathletesValidators.getHistory,
  handleValidationErrors,
  (req, res) => controller.getAthleteHistory(req, res)
);

router.put(
  "/bulk",
  authenticateToken,
  checkPermissions("athletesAssistance", "Editar"),
  assistanceathletesValidators.saveBulk,
  handleValidationErrors,
  (req, res) => controller.saveAttendanceBulk(req, res)
);

export default router;
