import DonationsRepository from "../repository/donations.repository.js";
import cloudinary from "../../../../services/shared/cloudinary.service.js";

const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];
const ALLOWED_FILE_TYPES = ["comprobante", "soporte", "factura", "evidencia"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export class DonationsService {
  async list(params) {
    return DonationsRepository.findAll(params);
  }

  async getById(id) {
    const data = await DonationsRepository.findById(id);
    if (!data) {
      return { success: false, statusCode: 404, message: "Donacion no encontrada" };
    }
    return { success: true, data };
  }

  async create(payload) {
    const data = await DonationsRepository.create(payload);
    return { success: true, data };
  }

  async update(id, payload) {
    const data = await DonationsRepository.update(id, payload);
    return { success: true, data };
  }

  async changeStatus(id, status, reason) {
    const data = await DonationsRepository.changeStatus(id, status, reason);
    return { success: true, data };
  }

  async softDelete(id) {
    const data = await DonationsRepository.softDelete(id);
    return { success: true, data };
  }

  validateFile(file) {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new Error("El archivo debe ser PDF, JPG o PNG");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error("El archivo supera el limite de 5MB");
    }
  }

  async uploadFiles(donationId, files = [], fileTypeDefault = "soporte") {
    const uploads = [];

    for (const file of files) {
      this.validateFile(file);

      const resolvedType =
        file.fileType || fileTypeDefault || "soporte";
      if (!ALLOWED_FILE_TYPES.includes(resolvedType)) {
        throw new Error("fileType invalido. Use comprobante, soporte, factura o evidencia.");
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "astrostar/donations",
            resource_type: "auto",
            public_id: undefined,
          },
          (error, uploaded) => {
            if (error) return reject(error);
            resolve(uploaded);
          }
        );
        stream.end(file.buffer);
      });

      uploads.push({
        donationId: donationId,
        detailId: null,
        fileType: resolvedType,
        url: result.secure_url,
        publicId: result.public_id,
        mimeType: file.mimetype,
        size: file.size,
        originalName: file.originalname,
      });
    }

    const data = await DonationsRepository.addFiles(donationId, uploads);
    return { success: true, data };
  }
}

export default new DonationsService();
