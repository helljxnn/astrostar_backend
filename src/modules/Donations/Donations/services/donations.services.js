import DonationsRepository from "../repository/donations.repository.js";
import cloudinary from "../../../../services/shared/cloudinary.js";
import movementsRepository from "../../../Materials/repository/movements.repository.js";
import materialsRepository from "../../../Materials/repository/materials.repository.js";
import { PrismaClient } from "../../../../../generated/prisma/index.js";
import { CertificateService } from "./certificate.service.js";

const ALLOWED_MIME = ["application/pdf", "image/jpeg", "image/png"];
const ALLOWED_FILE_TYPES = ["comprobante", "soporte", "factura", "evidencia"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

  async create(payload, userId = 1, userName = "Sistema") {
    const resolved = {
      ...payload,
      serviceId: payload?.serviceId || payload?.eventId || null,
    };
    const data = await DonationsRepository.create(resolved);

    // Auto-convert and assign to event if it's ESPECIE type with event
    if (data.type === "ESPECIE" && data.serviceId) {
      try {
        await this.autoConvertAndAssignToEvent(
          data.id,
          data.serviceId,
          userId,
          userName,
        );
      } catch {
        // Don't fail the donation creation if auto-assignment fails
      }
    }

    return { success: true, data };
  }

  /**
   * Automatically convert donation items to materials and assign to event
   * This is called internally when creating ESPECIE donations with events
   */
  async autoConvertAndAssignToEvent(donationId, eventoId, userId, userName) {
    try {
      const prisma = new PrismaClient();

      // Get donation with details
      const donation = await DonationsRepository.findById(donationId);
      if (!donation || !donation.details || donation.details.length === 0) {
        await prisma.$disconnect();
        return;
      }

      // Get event
      const event = await prisma.service.findUnique({
        where: { id: parseInt(eventoId) },
        select: { id: true, name: true },
      });

      if (!event) {
        await prisma.$disconnect();
        return;
      }

      // Process each detail item
      for (const detail of donation.details) {
        if (detail.recordType !== "item" || !detail.materialId) {
          continue;
        }

        try {
          // Get material by ID
          const material = await prisma.material.findUnique({
            where: { id: parseInt(detail.materialId) },
          });

          if (!material || material.estado !== "Activo") {
            continue;
          }

          const cantidad = parseInt(detail.quantity || 1);

          // Execute in transaction: Assign DIRECTLY to event (NO stock increment)
          await prisma.$transaction(async (tx) => {
            // 1. Create movement record (for traceability, but NO stock change)
            await tx.materialMovement.create({
              data: {
                materialId: material.id,
                materialNombre: material.nombre,
                categoria: material.categoria,
                tipoMovimiento: "ASIGNACION_EVENTO",
                cantidad: cantidad,
                inventarioDestino: "EVENTO_DIRECTO",
                donacionId: parseInt(donationId),
                eventoId: parseInt(eventoId),
                observaciones: `Donación ${donation.code} asignada directamente al evento ${event.name}`,
                fechaIngreso: donation.donationAt,
                stockAnterior: material.stockEventos,
                stockNuevo: material.stockEventos, // NO CHANGE
                createdBy: userId,
                createdByName: userName || null,
              },
            });

            // 2. Assign to event (locked, cannot be removed easily)
            await tx.eventMaterial.create({
              data: {
                materialId: material.id,
                eventoId: parseInt(eventoId),
                cantidad: cantidad,
                tipo: "CONSUMIBLE",
                donacionId: parseInt(donationId),
                bloqueado: true, // Locked - from donation
                observaciones: `Donación ${donation.code} - Asignación directa`,
                createdBy: userId,
                createdByName: userName || null,
              },
            });
          });
        } catch (error) {
          console.error(
            `Error processing material ${detail.materialId}:`,
            error,
          );
          // Continue with next item
        }
      }

      await prisma.$disconnect();
    } catch (error) {
      console.error("Error in autoConvertAndAssignToEvent:", error);
      throw error;
    }
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
          "fileType invalido. Use comprobante, soporte, factura o evidencia.",
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
          },
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
          message:
            "Solo donaciones de tipo ESPECIE pueden convertirse en materiales",
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
            userId,
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

  /**
   * Convert donation to materials and assign to event in one operation
   * This is the recommended way to link donations to events
   */
  async convertAndAssignToEvent(donationId, eventoId, items, userId, userName) {
    try {
      const { PrismaClient } =
        await import("../../../../generated/prisma/index.js");
      const prisma = new PrismaClient();

      // 1. Validate donation
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
          message:
            "Solo donaciones de tipo ESPECIE pueden convertirse en materiales",
        };
      }

      // 2. Validate event exists
      const event = await prisma.service.findUnique({
        where: { id: parseInt(eventoId) },
        select: { id: true, name: true, startDate: true },
      });

      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "Evento no encontrado",
        };
      }

      // 3. Process each item in a transaction
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

          const cantidad = parseInt(item.cantidad);

          // Execute in transaction: Assign DIRECTLY to event (NO stock increment)
          const result = await prisma.$transaction(async (tx) => {
            // 1. Create movement record (for traceability, but NO stock change)
            const movement = await tx.materialMovement.create({
              data: {
                materialId: item.materialId,
                materialNombre: material.nombre,
                categoria: material.categoria,
                tipoMovimiento: "ASIGNACION_EVENTO",
                cantidad: cantidad,
                inventarioDestino: "EVENTO_DIRECTO",
                donacionId: parseInt(donationId),
                eventoId: parseInt(eventoId),
                observaciones:
                  item.observaciones ||
                  `Donación ${donation.code} asignada directamente al evento ${event.name}`,
                fechaIngreso: donation.donationAt,
                stockAnterior: material.stockEventos,
                stockNuevo: material.stockEventos, // NO CHANGE
                createdBy: userId,
                createdByName: userName || null,
              },
            });

            // 2. Assign to event (locked, cannot be removed)
            const assignment = await tx.eventMaterial.create({
              data: {
                materialId: item.materialId,
                eventoId: parseInt(eventoId),
                cantidad: cantidad,
                tipo: "CONSUMIBLE",
                donacionId: parseInt(donationId),
                bloqueado: true, // Locked - from donation
                observaciones:
                  item.observaciones ||
                  `Donación ${donation.code} - Asignación directa`,
                createdBy: userId,
                createdByName: userName || null,
              },
            });

            return { movement, assignment };
          });

          results.push({
            materialId: item.materialId,
            materialNombre: material.nombre,
            cantidad: cantidad,
            movementId: result.movement.id,
            assignmentId: result.assignment.id,
          });
        } catch (error) {
          errors.push({
            item,
            error: error.message,
          });
        }
      }

      await prisma.$disconnect();

      return {
        success: true,
        data: {
          donationId,
          donationCode: donation.code,
          eventoId,
          eventoName: event.name,
          processed: results.length,
          failed: errors.length,
          results,
          errors,
        },
      };
    } catch (error) {
      console.error("Error converting and assigning donation to event:", error);
      throw error;
    }
  }

  /**
   * Generate donation certificate PDF
   */
  async generateCertificate(donationId) {
    try {
      // 1. Get donation with all details
      const donation = await DonationsRepository.findById(donationId);

      if (!donation) {
        return {
          success: false,
          statusCode: 404,
          message: "Donación no encontrada",
        };
      }

      // 2. Verify donation has a responsible
      if (!donation.responsible) {
        return {
          success: false,
          statusCode: 400,
          message:
            "La donación no tiene un responsable asignado. No se puede generar el certificado.",
        };
      }

      // 3. Verify responsible has signature
      if (!donation.responsible.signatureUrl) {
        return {
          success: false,
          statusCode: 400,
          message:
            "El responsable no tiene firma registrada. No se puede generar el certificado.",
        };
      }

      // 4. Generate PDF
      const certificateService = new CertificateService();
      const pdfBuffer = await certificateService.generateCertificate(donation);

      // 5. Generate filename
      const date = new Date(donation.donationAt);
      const dateStr = date.toISOString().split("T")[0].replace(/-/g, "");
      const filename = `${donation.code}_${dateStr}`;

      return {
        success: true,
        pdfBuffer,
        filename,
      };
    } catch (error) {
      console.error("Error generating donation certificate:", error);
      throw error;
    }
  }
}

export default new DonationsService();

