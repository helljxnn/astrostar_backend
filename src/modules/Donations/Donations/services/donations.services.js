import DonationsRepository from "../repository/donations.repository.js";
import cloudinary from "../../../../services/shared/cloudinary.js";
import movementsRepository from "../../../Materials/repository/movements.repository.js";
import materialsRepository from "../../../Materials/repository/materials.repository.js";

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_FILE_TYPES = ["comprobante", "soporte", "factura", "evidencia"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export class DonationsService {
  async list(params) {
    const resolved = {
      ...params,
      serviceId: params?.serviceId || params?.eventId || undefined,
    };
    return DonationsRepository.findAll(resolved);
  }

  async getById(id) {
    const data = await DonationsRepository.findById(id);
    if (!data) {
      return {
        success: false,
        statusCode: 404,
        message: "Donacion no encontrada",
      };
    }
    return { success: true, data };
  }

  async create(payload) {
    const resolved = {
      ...payload,
      serviceId: payload?.serviceId || payload?.eventId || null,
    };
    const data = await DonationsRepository.create(resolved);
    return { success: true, data };
  }

  async update(id, payload) {
    const resolved = {
      ...payload,
      serviceId: payload?.serviceId || payload?.eventId || undefined,
    };
    const data = await DonationsRepository.update(id, resolved);
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

      const resolvedType = file.fileType || fileTypeDefault || "soporte";
      if (!ALLOWED_FILE_TYPES.includes(resolvedType)) {
        throw new Error(
          "fileType invalido. Use comprobante, soporte, factura o evidencia."
        );
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

  /**
   * Convert donation details to material entries
   * Links donation items (ESPECIE type) to material inventory
   */
  async convertToMaterials(donationId, items, userId, userName) {
    try {
      // 1. Validate donation exists and is type ESPECIE
      const donation = await DonationsRepository.findById(donationId);
      if (!donation) {
        return {
          success: false,
          statusCode: 404,
          message: "Donación no encontrada",
        };
      }

      if (donation.type !== "ESPECIE") {
        return {
          success: false,
          statusCode: 400,
          message: "Solo donaciones de tipo ESPECIE pueden convertirse en materiales",
        };
      }

      // 2. Process each item
      const results = [];
      const errors = [];

      for (const item of items) {
        try {
          // Validate required fields
          if (!item.materialId || !item.cantidad) {
            errors.push({
              item,
              error: "materialId y cantidad son requeridos",
            });
            continue;
          }

          // Get material info
          const material = await materialsRepository.findById(item.materialId);
          if (!material) {
            errors.push({
              item,
              error: `Material con ID ${item.materialId} no encontrado`,
            });
            continue;
          }

          if (material.estado !== "Activo") {
            errors.push({
              item,
              error: `Material ${material.nombre} no está activo`,
            });
            continue;
          }

          // Create material movement (entry)
          const movementData = {
            material_id: item.materialId,
            material_nombre: material.nombre,
            categoria: material.categoria,
            tipo_movimiento: "Entrada",
            cantidad: parseInt(item.cantidad),
            inventario_destino: item.inventarioDestino || "FUNDACION",
            donacion_id: parseInt(donationId),
            observaciones: item.observaciones || `Donación ${donation.code}`,
            fecha_ingreso: donation.donationAt,
            created_by_name: userName || null,
          };

          const movement = await movementsRepository.registerMovement(
            movementData,
            userId
          );

          results.push({
            materialId: item.materialId,
            materialNombre: material.nombre,
            cantidad: item.cantidad,
            movementId: movement.id,
          });
        } catch (error) {
          errors.push({
            item,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        data: {
          donationId,
          donationCode: donation.code,
          processed: results.length,
          failed: errors.length,
          results,
          errors,
        },
      };
    } catch (error) {
      console.error("Error converting donation to materials:", error);
      throw error;
    }
  }

  /**
   * Get materials linked to a donation
   */
  async getMaterialsByDonation(donationId) {
    try {
      const donation = await DonationsRepository.findById(donationId);
      if (!donation) {
        return {
          success: false,
          statusCode: 404,
          message: "Donación no encontrada",
        };
      }

      const movements = await movementsRepository.findByDonationId(donationId);

      return {
        success: true,
        data: {
          donation: {
            id: donation.id,
            code: donation.code,
            type: donation.type,
            status: donation.status,
            donationAt: donation.donationAt,
          },
          materials: movements,
        },
      };
    } catch (error) {
      console.error("Error getting materials by donation:", error);
      throw error;
    }
  }
}

export default new DonationsService();
