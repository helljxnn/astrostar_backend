import prisma from "../../../config/database.js";

export class ProvidersRepository {
  async getDocumentTypes() {
    const documentTypes = await prisma.documentType.findMany({
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });

    // Transformar para el frontend
    return documentTypes.map(docType => ({
      value: docType.id.toString(),
      label: docType.name,
      id: docType.id,
      name: docType.name,
      description: docType.description
    }));
  }

  async findAll({ page = 1, limit = 10, search = "", status, entityType }) {
    const skip = (page - 1) * limit;

    const entityTypeMap = {
      juridica: "legal",
      natural: "natural",
    };

    const where = {
      AND: [
        search
          ? {
              OR: [
                { businessName: { contains: search, mode: "insensitive" } },
                { nit: { contains: search, mode: "insensitive" } },
                { mainContact: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        status
          ? {
              status: status === "Activo" ? "Active" : "Inactive",
            }
          : {},
        entityType
          ? {
              entityType: entityTypeMap[entityType] || entityType,
            }
          : {},
      ].filter((condition) => Object.keys(condition).length > 0),
    };

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          documentType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.provider.count({ where }),
    ]);

    const transformedProviders = providers.map((provider) =>
      this.transformToFrontend(provider)
    );

    return {
      providers: transformedProviders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id) {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        documentType: true,
        purchases: {
          include: {
            items: true,
          },
        },
      },
    });

    return provider ? this.transformToFrontend(provider) : null;
  }

  async findByNit(nit) {
    if (!nit) return null;

    const cleanedNit = nit.replace(/[.\-\s]/g, "");

    const provider = await prisma.provider.findUnique({
      where: { nit: cleanedNit },
      include: { documentType: true }
    });

    return provider ? this.transformToFrontend(provider) : null;
  }

  async findByEmail(email) {
    const provider = await prisma.provider.findUnique({
      where: { email },
      include: { documentType: true }
    });

    return provider ? this.transformToFrontend(provider) : null;
  }

  async findByBusinessName(businessName, excludeId = null, tipoEntidad = "juridica") {
    const where = {
      businessName: {
        equals: businessName,
        mode: "insensitive",
      },
      entityType: tipoEntidad === "juridica" ? "legal" : "natural",
    };

    if (excludeId) {
      where.NOT = { id: parseInt(excludeId) };
    }

    const provider = await prisma.provider.findFirst({ 
      where,
      include: { documentType: true }
    });
    return provider ? this.transformToFrontend(provider) : null;
  }

  async findByNameCaseInsensitive(name, excludeId = null) {
    const where = {
      OR: [
        { businessName: { equals: name, mode: "insensitive" } },
        { mainContact: { equals: name, mode: "insensitive" } },
      ],
    };

    if (excludeId) {
      where.NOT = { id: parseInt(excludeId) };
    }

    const provider = await prisma.provider.findFirst({ 
      where,
      include: { documentType: true }
    });
    return provider ? this.transformToFrontend(provider) : null;
  }

  async hasActivePurchases(providerId) {
    const purchases = await prisma.purchase.count({
      where: {
        providerId: providerId,
        status: {
          in: ["Pending", "Received", "Partial"],
        },
      },
    });

    return purchases > 0;
  }

  async create(providerData) {
    const transformedData = this.transformToBackend(providerData);

    const { documentTypeId, ...providerInfo } = transformedData;

    const data = { ...providerInfo };
    
    // Solo conectar documentType si es persona natural Y tiene documentTypeId
    if (providerData.tipoEntidad === 'natural' && documentTypeId) {
      data.documentType = { connect: { id: documentTypeId } };
    }

    const provider = await prisma.provider.create({
      data,
      include: {
        documentType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.transformToFrontend(provider);
  }

  async update(id, providerData) {
    const transformedData = this.transformToBackend(providerData);
    const { documentTypeId, ...providerInfo } = transformedData;
    const data = { ...providerInfo };

    // Manejar documentType según el tipo de entidad
    if (providerData.tipoEntidad === "natural" && documentTypeId) {
      // Persona natural: conectar documentType
      data.documentType = { connect: { id: documentTypeId } };
    } else if (providerData.tipoEntidad === "juridica") {
      // Persona jurídica: desconectar documentType
      data.documentType = { disconnect: true };
    }

    const provider = await prisma.provider.update({
      where: { id },
      data,
      include: {
        documentType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.transformToFrontend(provider);
  }

  async delete(id) {
    try {
      const provider = await prisma.provider.findUnique({
        where: { id: parseInt(id) },
        include: { documentType: true },
      });

      if (!provider) {
        return false;
      }

      if (provider.status === "Active") {
        throw new Error(
          `No se puede eliminar el proveedor "${provider.businessName}" porque está en estado "Activo". Primero cambie el estado a "Inactivo".`
        );
      }

      await prisma.provider.delete({
        where: { id: parseInt(id) },
      });

      return this.transformToFrontend(provider);
    } catch (error) {
      if (error.code === "P2025") {
        return false;
      }
      throw error;
    }
  }

  async changeStatus(id, status) {
    const provider = await prisma.provider.update({
      where: { id },
      data: {
        status: status === "Activo" ? "Active" : "Inactive",
        statusAssignedAt: new Date(),
      },
      include: {
        documentType: true,
      },
    });

    return this.transformToFrontend(provider);
  }

  async getStats() {
    const [
      totalProviders,
      activeProviders,
      providersByEntityType,
      providersWithPurchases,
    ] = await Promise.all([
      prisma.provider.count(),
      prisma.provider.count({ where: { status: "Active" } }),
      prisma.provider.groupBy({
        by: ["entityType"],
        _count: true,
      }),
      prisma.provider.count({
        where: {
          purchases: {
            some: {},
          },
        },
      }),
    ]);

    return {
      totalProviders,
      activeProviders,
      inactiveProviders: totalProviders - activeProviders,
      providersByEntityType: providersByEntityType.map((item) => ({
        entityType: item.entityType === "legal" ? "juridica" : "natural",
        count: item._count,
      })),
      providersWithPurchases,
      providersWithoutPurchases: totalProviders - providersWithPurchases,
    };
  }

  /**
   * 🔥 TRANSFORMACIÓN FRONTEND - Corregida
   * Convierte datos de la BD al formato del frontend
   */
  transformToFrontend(provider) {
    if (!provider) return null;

    // Determinar el valor de tipoDocumento
    let tipoDocumento = "";
    if (provider.documentType?.id) {
      tipoDocumento = provider.documentType.id.toString();
    } else if (provider.documentTypeId) {
      tipoDocumento = provider.documentTypeId.toString();
    }

    return {
      id: provider.id,
      tipoEntidad: provider.entityType === "legal" ? "juridica" : "natural",
      razonSocial: provider.businessName,
      nit: provider.nit,
      tipoDocumento: tipoDocumento, // ✅ Ahora siempre retorna el valor correcto
      documentTypeId: provider.documentTypeId || null,
      documentTypeName: provider.documentType?.name || "",
      contactoPrincipal: provider.mainContact,
      correo: provider.email,
      telefono: provider.phone,
      direccion: provider.address,
      ciudad: provider.city,
      descripcion: provider.description,
      estado: provider.status === "Active" ? "Activo" : "Inactivo",
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      statusAssignedAt: provider.statusAssignedAt,
      fechaRegistro: provider.createdAt,
    };
  }

  /**
   * 🔥 TRANSFORMACIÓN BACKEND - Corregida
   * Convierte datos del frontend al formato de la BD
   */
  transformToBackend(providerData) {
    let cleanedNit = providerData.nit;

    if (cleanedNit && typeof cleanedNit === "string") {
      cleanedNit = cleanedNit.replace(/[.\-\s]/g, "");
    }

    const transformed = {
      entityType: providerData.tipoEntidad === "juridica" ? "legal" : "natural",
      businessName: providerData.razonSocial,
      ...(cleanedNit && { nit: cleanedNit }),
      mainContact: providerData.contactoPrincipal,
      email: providerData.correo,
      phone: providerData.telefono,
      address: providerData.direccion,
      city: providerData.ciudad,
      description: providerData.descripcion || "",
      status: providerData.estado === "Activo" ? "Active" : "Inactive",
    };

    // ✅ Solo incluir documentTypeId si es persona natural Y tiene valor
    if (providerData.tipoEntidad === 'natural' && providerData.tipoDocumento) {
      transformed.documentTypeId = parseInt(providerData.tipoDocumento);
    } else if (providerData.tipoEntidad === 'juridica') {
      // Asegurar que sea null para jurídica
      transformed.documentTypeId = null;
    }

    return transformed;
  }
}

export default new ProvidersRepository();