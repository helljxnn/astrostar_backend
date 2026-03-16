import express from "express";
import { AthletesController } from "../controllers/athletes.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = express.Router();
const athletesController = new AthletesController();

router.get(
  "/",
  authenticateToken,
  checkPermissions("temporaryTeams", "Ver"),
  athletesController.getAthletes,
);

export default router;
