import { Router } from "express";
import multer from "multer";
import DonationsController from "../controllers/donations.controller.js";
import {
  donationValidators,
  handleDonationValidation,
} from "../validators/donations.validators.js";
import { authenticateToken } from "../../../../middlewares/auth.js";
import { checkPermissions } from "../../../../middlewares/checkPermissions.js";

const router = Router();

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  return cb(
    new Error("Archivo invalido. Solo PDF, JPG o PNG de maximo 10MB."),
    false,
  );
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get(
  "/",
  checkPermissions("donations", "Ver"),
  donationValidators.list,
  handleDonationValidation,
  DonationsController.list,
);

router.get(
  "/:id",
  checkPermissions("donations", "Ver"),
  donationValidators.getById,
  handleDonationValidation,
  DonationsController.getById,
);

router.post(
  "/",
  checkPermissions("donations", "Crear"),
  donationValidators.create,
  handleDonationValidation,
  DonationsController.create,
);

router.put(
  "/:id",
  checkPermissions("donations", "Editar"),
  donationValidators.update,
  handleDonationValidation,
  DonationsController.update,
);

router.patch(
  "/:id/status",
  checkPermissions("donations", "Editar"),
  donationValidators.changeStatus,
  handleDonationValidation,
  DonationsController.changeStatus,
);

router.delete(
  "/:id",
  checkPermissions("donations", "Eliminar"),
  donationValidators.softDelete,
  handleDonationValidation,
  DonationsController.softDelete,
);

router.post(
  "/:id/files",
  checkPermissions("donations", "Editar"),
  donationValidators.uploadFiles,
  handleDonationValidation,
  upload.array("files"),
  DonationsController.uploadFiles,
);

router.post(
  "/:id/convert-to-materials",
  checkPermissions("donations", "Editar"),
  donationValidators.getById,
  handleDonationValidation,
  DonationsController.convertToMaterials,
);

router.post(
  "/:id/convert-and-assign-to-event",
  checkPermissions("donations", "Editar"),
  donationValidators.getById,
  handleDonationValidation,
  DonationsController.convertAndAssignToEvent,
);

router.get(
  "/:id/materials",
  checkPermissions("donations", "Ver"),
  donationValidators.getById,
  handleDonationValidation,
  DonationsController.getMaterials,
);

router.get(
  "/:id/certificate",
  checkPermissions("donations", "Ver"),
  donationValidators.getById,
  handleDonationValidation,
  DonationsController.generateCertificate,
);

export default router;

