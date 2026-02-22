import express from "express";
import { AssistanceathletesController } from "../controllers/Assistanceathletes.controller.js";
import {
  assistanceathletesValidators,
  handleValidationErrors,
} from "../validators/Assistanceathletes.validators.js";

const router = express.Router();
const controller = new AssistanceathletesController();

router.get(
  "/",
  assistanceathletesValidators.getByDate,
  handleValidationErrors,
  (req, res) => controller.getAttendanceByDate(req, res)
);

router.get(
  "/history",
  assistanceathletesValidators.getHistory,
  handleValidationErrors,
  (req, res) => controller.getAthleteHistory(req, res)
);

router.put(
  "/bulk",
  assistanceathletesValidators.saveBulk,
  handleValidationErrors,
  (req, res) => controller.saveAttendanceBulk(req, res)
);

export default router;
