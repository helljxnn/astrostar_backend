import express from "express";
import { AthletesController } from "../controllers/athletes.controller.js";

const router = express.Router();
const athletesController = new AthletesController();

router.get("/", athletesController.getAthletes);

export default router;