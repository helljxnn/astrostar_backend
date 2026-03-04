import prisma from "../../../../config/database.js";

export class DonorsSponsorsRepository {
  mapStatusToDb(status) {
    if (!status) return undefined;
    if (status === "Activo") return "Active";
    if (status === "Por confirmar" || status === "Pendiente") return "Pending";
    return "Inactive";
  }

  mapStatusFromDb(status) {
    if (status === "Active") return "Activo";
    if (status === "Pending") return "Por confirmar";
    return "Inactivo";
  }

  mapTypeToDb(tipo) {
    if (!tipo) return undefined;
    return tipo === "Patrocinador" ? "Sponsor" : "Donor";
  }

  mapTypeFromDb(type) {
    return type === "Sponsor" ? "Patrocinador" : "Donante";
  }

  mapPersonTypeToDb(tipoPersona) {
    if (!tipoPersona) return undefined;
    return tipoPersona === "Juridica" ? "Juridica" : "Natural";
  }

  mapPersonTypeFromDb(personType) {
    return personType === "Juridica" ? "Juridica" : "Natural";
  }

  transformToFrontend(record) {
    if (!record) return null;

    const tipoPersona = this.mapPersonTypeFromDb(record.personType);
    const tipo = this.mapTypeFromDb(record.type);
    const identificacion = record.identification || "";

    return {
      id: record.id,
      nombre: record.name,
      razonSocial: tipoPersona === "Juridica" ? record.name : null,
      nombreCompleto: tipoPersona === "Natural" ? record.name : null,
      tipo,
      tipoPersona,
      tipoDocumento: record.documentType,
      identificacion,
      numeroDocumento: tipoPersona === "Natural" ? identificacion : null,
      nit: tipoPersona === "Juridica" ? identificacion : null,
      personaContacto: record.contactName,
      representanteLegal: record.contactName,
      telefono: record.phone,
      correo: record.contactEmail,
      direccion: record.address,
      ciudad: record.city,
      pais: record.country,
      descripcion: record.description,
      estado: this.mapStatusFromDb(record.status),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  buildCreateData(payload) {
    const baseName =
      payload.nombre ||
      payload.razonSocial ||
      payload.nombreCompleto ||
      "";
    let identification =
      payload.identificacion || payload.nit || payload.numeroDocumento || "";
    if (!identification) {
      identification = `landing-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    }

    return {
      name: baseName.trim(),
      type: this.mapTypeToDb(payload.tipo) || "Donor",
      personType: this.mapPersonTypeToDb(payload.tipoPersona) || "Natural",
      documentType: payload.tipoDocumento || null,
      identification: identification.trim(),
      contactName:
        payload.personaContacto?.trim() ||
        payload.representanteLegal?.trim() ||
        null,
      description: payload.descripcion ? payload.descripcion.trim() : null,
      contactEmail: payload.correo ? payload.correo.toLowerCase().trim() : null,
      phone: payload.telefono ? payload.telefono.trim() : null,
      address: payload.direccion ? payload.direccion.trim() : null,
      city: payload.ciudad ? payload.ciudad.trim() : null,
      country: payload.pais ? payload.pais.trim() : null,
      status: this.mapStatusToDb(payload.estado || payload.status) || "Active",
    };
  }

  buildUpdateData(payload) {
    const updateData = {};
    const hasName =
      payload.nombre || payload.razonSocial || payload.nombreCompleto;
    if (hasName) {
      const name =
        payload.nombre ||
        payload.razonSocial ||
        payload.nombreCompleto ||
        "";
      updateData.name = name.trim();
    }

    if (payload.tipo) {
      updateData.type = this.mapTypeToDb(payload.tipo);
    }

    if (payload.tipoPersona) {
      updateData.personType = this.mapPersonTypeToDb(payload.tipoPersona);
    }

    if (payload.tipoDocumento !== undefined) {
      updateData.documentType = payload.tipoDocumento || null;
    }

    if (
      payload.identificacion ||
      payload.nit ||
      payload.numeroDocumento
    ) {
      const identification =
        payload.identificacion || payload.nit || payload.numeroDocumento || "";
      updateData.identification = identification.trim();
    }

    if (
      payload.personaContacto !== undefined ||
      payload.representanteLegal !== undefined
    ) {
      updateData.contactName =
        payload.personaContacto?.trim() ||
        payload.representanteLegal?.trim() ||
        null;
    }

    if (payload.descripcion !== undefined) {
      updateData.description = payload.descripcion
        ? payload.descripcion.trim()
        : null;
    }

    if (payload.correo !== undefined) {
      updateData.contactEmail = payload.correo
        ? payload.correo.toLowerCase().trim()
        : null;
    }

    if (payload.telefono !== undefined) {
      updateData.phone = payload.telefono ? payload.telefono.trim() : null;
    }

    if (payload.direccion !== undefined) {
      updateData.address = payload.direccion ? payload.direccion.trim() : null;
    }

    if (payload.ciudad !== undefined) {
      updateData.city = payload.ciudad ? payload.ciudad.trim() : null;
    }

    if (payload.pais !== undefined) {
      updateData.country = payload.pais ? payload.pais.trim() : null;
    }

    if (payload.estado !== undefined || payload.status !== undefined) {
      updateData.status = this.mapStatusToDb(
        payload.estado || payload.status
      );
    }

    return updateData;
  }

  async findAll({ page = 1, limit = 10, search = "", status, tipo, tipoPersona }) {
    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { identification: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = this.mapStatusToDb(status);
    }

    if (tipo) {
      where.type = this.mapTypeToDb(tipo);
    }

    if (tipoPersona) {
      where.personType = this.mapPersonTypeToDb(tipoPersona);
    }

    const [records, total] = await Promise.all([
      prisma.sponsor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.sponsor.count({ where }),
    ]);

    return {
      data: records.map((item) => this.transformToFrontend(item)),
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
    const record = await prisma.sponsor.findUnique({
      where: { id: parseInt(id) },
    });

    return this.transformToFrontend(record);
  }

  async findByIdentification(identification, excludeId = null) {
    if (!identification) return null;
    const where = {
      identification: identification.trim(),
    };

    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }

    return prisma.sponsor.findFirst({ where });
  }

  async findByEmail(email, excludeId = null) {
    if (!email) return null;
    const where = {
      contactEmail: email.toLowerCase().trim(),
    };

    if (excludeId) {
      where.id = { not: parseInt(excludeId) };
    }

    return prisma.sponsor.findFirst({ where });
  }

  async create(payload) {
    const data = this.buildCreateData(payload);
    const created = await prisma.sponsor.create({ data });
    return this.transformToFrontend(created);
  }

  async update(id, payload) {
    const data = this.buildUpdateData(payload);
    const updated = await prisma.sponsor.update({
      where: { id: parseInt(id) },
      data,
    });

    return this.transformToFrontend(updated);
  }

  async delete(id) {
    const hasRelations = await prisma.serviceSponsor.count({
      where: { sponsorId: parseInt(id) },
    });

    if (hasRelations > 0) {
      throw new Error(
        "No se puede eliminar porque est\u00e1 asociado a eventos o servicios"
      );
    }

    const deleted = await prisma.sponsor.delete({
      where: { id: parseInt(id) },
    });

    return this.transformToFrontend(deleted);
  }

  async changeStatus(id, status) {
    const updated = await prisma.sponsor.update({
      where: { id: parseInt(id) },
      data: { status: this.mapStatusToDb(status) },
    });

    return this.transformToFrontend(updated);
  }

  async getStats() {
    const [total, activos, inactivos, donantes, patrocinadores, naturales, juridicas] =
      await Promise.all([
        prisma.sponsor.count(),
        prisma.sponsor.count({ where: { status: "Active" } }),
        prisma.sponsor.count({ where: { status: "Inactive" } }),
        prisma.sponsor.count({ where: { type: "Donor" } }),
        prisma.sponsor.count({ where: { type: "Sponsor" } }),
        prisma.sponsor.count({ where: { personType: "Natural" } }),
        prisma.sponsor.count({ where: { personType: "Juridica" } }),
      ]);

    return {
      total,
      activos,
      inactivos,
      porTipo: {
        donantes: donantes,
        patrocinadores: patrocinadores,
      },
      porPersona: {
        naturales,
        juridicas,
      },
    };
  }

  async getReferenceData() {
    const documentTypes = await prisma.documentType.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });

    return {
      documentTypes,
      tipos: [
        { value: "Donante", label: "Donante" },
        { value: "Patrocinador", label: "Patrocinador" },
      ],
      tiposPersona: [
        { value: "Natural", label: "Persona Natural" },
        { value: "Juridica", label: "Persona Juridica" },
      ],
      estados: [
        { value: "Activo", label: "Activo" },
        { value: "Por confirmar", label: "Por confirmar" },
        { value: "Inactivo", label: "Inactivo" },
      ],
    };
  }
}
