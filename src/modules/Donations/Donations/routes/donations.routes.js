import { Router } from "express";
import multer from "multer";
import DonationsController from "../controllers/donations.controller.js";
import {
  donationValidators,
  handleDonationValidation,
} from "../validators/donations.validators.js";

const router = Router();

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(
    new Error("Archivo invalido. Solo PDF, JPG o PNG de maximo 5MB."),
    false
  );
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get(
  "/",
  donationValidators.list,
  handleDonationValidation,
  DonationsController.list
);

router.get(
  "/:id",
  donationValidators.getById,
  handleDonationValidation,
  DonationsController.getById
);

router.post(
  "/",
  donationValidators.create,
  handleDonationValidation,
  DonationsController.create
);

router.put(
  "/:id",
  donationValidators.update,
  handleDonationValidation,
  DonationsController.update
);

router.patch(
  "/:id/status",
  donationValidators.changeStatus,
  handleDonationValidation,
  DonationsController.changeStatus
);

router.delete(
  "/:id",
  donationValidators.softDelete,
  handleDonationValidation,
  DonationsController.softDelete
);

router.post(
  "/:id/files",
  donationValidators.uploadFiles,
  handleDonationValidation,
  upload.array("files"),
  DonationsController.uploadFiles
);

router.post(
  "/:id/convert-to-materials",
  donationValidators.getById,
  handleDonationValidation,
  DonationsController.convertToMaterials
);

router.get(
  "/:id/materials",
  donationValidators.getById,
  handleDonationValidation,
  DonationsController.getMaterials
);

export default router;
