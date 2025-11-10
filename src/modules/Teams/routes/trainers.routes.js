import express from "express";
import { TrainersController } from "../controllers/trainers.controller.js";

const router = express.Router();
const trainersController = new TrainersController();

router.get("/", trainersController.getTrainers);

export default router;