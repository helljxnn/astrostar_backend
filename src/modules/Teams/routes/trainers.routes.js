import express from "express";
import { TrainersController } from "../controllers/trainers.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();
const trainersController = new TrainersController();

router.get(
  "/",
  authenticateToken,
  checkPermissions("temporaryTeams", "Ver"),
  trainersController.getTrainers,
);

export default router;
