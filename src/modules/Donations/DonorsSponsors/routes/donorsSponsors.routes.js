import express from "express";
import DonorsSponsorsController from "../controllers/donorsSponsors.controller.js";
import {
  donorsSponsorsValidators,
  handleValidationErrors,
} from "../validators/donorsSponsors.validators.js";
import { authenticateToken } from "../../../../middlewares/auth.js";

const router = express.Router();
const controller = DonorsSponsorsController;

router.get(
  "/stats",
  authenticateToken,
  controller.getStats
);

router.get(
  "/reference-data",
  authenticateToken,
  controller.getReferenceData
);

router.get(
  "/check-identification",
  authenticateToken,
  donorsSponsorsValidators.checkIdentification,
  handleValidationErrors,
  controller.checkIdentification
);

router.get(
  "/check-email",
  authenticateToken,
  donorsSponsorsValidators.checkEmail,
  handleValidationErrors,
  controller.checkEmail
);

router.get(
  "/",
  authenticateToken,
  donorsSponsorsValidators.list,
  handleValidationErrors,
  controller.getAll
);

router.post(
  "/",
  authenticateToken,
  donorsSponsorsValidators.create,
  handleValidationErrors,
  controller.create
);

router.get(
  "/:id",
  authenticateToken,
  donorsSponsorsValidators.getById,
  handleValidationErrors,
  controller.getById
);

router.put(
  "/:id",
  authenticateToken,
  donorsSponsorsValidators.update,
  handleValidationErrors,
  controller.update
);

router.patch(
  "/:id/status",
  authenticateToken,
  donorsSponsorsValidators.changeStatus,
  handleValidationErrors,
  controller.changeStatus
);

router.delete(
  "/:id",
  authenticateToken,
  donorsSponsorsValidators.delete,
  handleValidationErrors,
  controller.delete
);

export default router;
