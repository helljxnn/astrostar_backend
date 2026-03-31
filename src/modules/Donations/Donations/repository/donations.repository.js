import prisma from "../../../../config/database.js";

const TYPE_MAP = {
  ECONOMICA: "ECONOMICA",
  ESPECIE: "ESPECIE",
  ALIMENTOS: "ALIMENTOS",
};

const STATUS_MAP = {
  Recibida: "Recibida",
  EnProceso: "EnProceso",
  Verificada: "Verificada",
  Ejecutada: "Ejecutada",
  Anulada: "Anulada",
};

export class DonationsRepository {
  mapTypeToDb(type) {
    if (!type) return "ECONOMICA";
    const key = String(type).toUpperCase();
    return TYPE_MAP[key] || "ECONOMICA";
  }

  mapStatusToDb(status) {
    if (!status) return "Recibida";
    return (
      STATUS_MAP[status] ||
      STATUS_MAP[String(status).replace(/\s+/g, "")] ||
      "Recibida"
    );
  }

  mapDonation(record) {
    if (!record) return null;
    return {
      id: record.id,
      code: record.code,
      donorSponsorId: record.donorSponsorId,
      serviceId: record.serviceId,
      responsibleId: record.responsibleId,
      anonymous: record.anonymous,
      type: record.type,
      status: record.status,
      program: record.program,
      donationAt: record.donationAt,
      notes: record.notes,
      cancelReason: record.cancelReason,
      cancelAt: record.cancelAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt,
      donorSponsor: record.donorSponsor || null,
      responsible: record.responsible || null,
      event: record.service
        ? {
            id: record.service.id,
            name: record.service.name,
            status: record.service.status,
            startDate: record.service.startDate,
            endDate: record.service.endDate,
            location: record.service.location,
          }
        : null,
      details: record.details || [],
      files: record.files || [],
      transactions: record.transactions || [],
    };
  }

  async generateCode() {
    const last = await prisma.donation.findFirst({
      orderBy: { id: "desc" },
      select: { id: true },
    });
    const nextNumber = (last?.id || 0) + 1;
    return `DON-${String(nextNumber).padStart(6, "0")}`;
  }

  async create(payload) {
    const code = payload.code || (await this.generateCode());

    const created = await prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          code,
          donorSponsorId: payload.donorSponsorId || null,
          serviceId: payload.serviceId || null,
          responsibleId: payload.responsibleId || null,
          anonymous: payload.anonymous || false,
          type: this.mapTypeToDb(payload.type),
          status: this.mapStatusToDb(payload.status),
          program: payload.program || null,
          donationAt: payload.donationAt,
          notes: payload.notes || null,
        },
      });

      if (payload.details && payload.details.length > 0) {
        await tx.donationDetail.createMany({
          data: payload.details.map((d) => ({
            donationId: donation.id,
            kind: this.mapTypeToDb(d.kind),
            recordType: d.recordType,
            description: d.description || null,
            quantity: d.quantity !== undefined ? Number(d.quantity) : null,
            amount: d.amount !== undefined ? Number(d.amount) : null,
            channel: d.channel || null,
            classification: d.classification || null,
            expiresAt: d.expiresAt || null,
            materialId: d.materialId ? Number(d.materialId) : null,
          })),
        });
      }

      await tx.donationTransaction.create({
        data: {
          donationId: donation.id,
          fromStatus: null,
          toStatus: this.mapStatusToDb(payload.status) || "Recibida",
          reason: payload.notes || null,
        },
      });

      return donation;
    });

    return this.findById(created.id);
  }

  async findAll({
    page = 1,
    limit = 10,
    search = "",
    status,
    type,
    month,
    serviceId,
  }) {
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        {
          donorSponsor: {
            name: { contains: search, mode: "insensitive" },
          },
        },
        { program: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = this.mapStatusToDb(status);
    if (type) where.type = this.mapTypeToDb(type);
    if (serviceId) where.serviceId = Number(serviceId);

    if (month) {
      // month formato AAAA-MM
      const [year, monthNum] = month.split("-").map(Number);
      const startDate = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0));
      where.donationAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    const [records, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          donorSponsor: true,
          service: {
            select: {
              id: true,
              name: true,
              status: true,
              startDate: true,
              endDate: true,
              location: true,
            },
          },
          details: true,
          files: true,
          transactions: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      prisma.donation.count({ where }),
    ]);

    return {
      data: records.map((r) => this.mapDonation(r)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findById(id) {
    const record = await prisma.donation.findUnique({
      where: { id: parseInt(id) },
      include: {
        donorSponsor: true,
        service: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
        responsible: {
          select: {
            id: true,
            signatureUrl: true,
            signaturePublicId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
                secondLastName: true,
                email: true,
                identification: true,
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        details: true,
        files: true,
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return this.mapDonation(record);
  }

  async update(id, payload) {
    const donationId = parseInt(id);
    const updated = await prisma.$transaction(async (tx) => {
      const previousStatus = payload.status
        ? (
            await tx.donation.findUnique({
              where: { id: donationId },
              select: { status: true },
            })
          )?.status || null
        : null;

      const donation = await tx.donation.update({
        where: { id: donationId },
        data: {
          donorSponsorId:
            payload.donorSponsorId !== undefined
              ? payload.donorSponsorId
              : undefined,
          serviceId:
            payload.serviceId !== undefined ? payload.serviceId : undefined,
          responsibleId:
            payload.responsibleId !== undefined
              ? payload.responsibleId
              : undefined,
          anonymous: payload.anonymous ?? undefined,
          type: payload.type ? this.mapTypeToDb(payload.type) : undefined,
          status: payload.status
            ? this.mapStatusToDb(payload.status)
            : undefined,
          program: payload.program ?? undefined,
          donationAt: payload.donationAt ?? undefined,
          notes: payload.notes ?? undefined,
          cancelReason: payload.cancelReason ?? undefined,
          cancelAt: payload.cancelAt ?? undefined,
        },
      });

      if (payload.details) {
        await tx.donationDetail.deleteMany({ where: { donationId } });
        if (payload.details.length > 0) {
          await tx.donationDetail.createMany({
            data: payload.details.map((d) => ({
              donationId,
              kind: this.mapTypeToDb(d.kind),
              recordType: d.recordType,
              description: d.description || null,
              quantity: d.quantity !== undefined ? Number(d.quantity) : null,
              amount: d.amount !== undefined ? Number(d.amount) : null,
              channel: d.channel || null,
              classification: d.classification || null,
              expiresAt: d.expiresAt || null,
              materialId: d.materialId ? Number(d.materialId) : null,
            })),
          });
        }
      }

      if (payload.status) {
        await tx.donationTransaction.create({
          data: {
            donationId,
            fromStatus: previousStatus,
            toStatus: this.mapStatusToDb(payload.status),
            reason: payload.statusReason || null,
          },
        });
      }

      return donation;
    });

    return this.findById(updated.id);
  }

  async changeStatus(id, status, reason) {
    const donationId = parseInt(id);
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.donation.findUnique({
        where: { id: donationId },
        select: { status: true },
      });

      const donation = await tx.donation.update({
        where: { id: donationId },
        data: {
          status: this.mapStatusToDb(status),
          cancelReason: status === "Anulada" ? reason || null : undefined,
          cancelAt: status === "Anulada" ? new Date() : undefined,
        },
      });

      await tx.donationTransaction.create({
        data: {
          donationId,
          fromStatus: current?.status || null,
          toStatus: this.mapStatusToDb(status),
          reason: reason || null,
        },
      });

      return donation;
    });

    return this.findById(updated.id);
  }

  async softDelete(id) {
    const donation = await prisma.donation.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });
    return this.mapDonation(donation);
  }

  async addFiles(donationId, files) {
    if (!files || files.length === 0) return [];
    await prisma.donationFile.createMany({
      data: files.map((f) => ({
        donationId,
        detailId: f.detailId || null,
        fileType: f.fileType,
        url: f.url,
        publicId: f.publicId,
        mimeType: f.mimeType,
        size: f.size,
        originalName: f.originalName,
      })),
    });
    return this.findById(donationId);
  }
}

export default new DonationsRepository();
