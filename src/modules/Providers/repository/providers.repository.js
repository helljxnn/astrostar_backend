import prisma from "../../../config/database.js";

export class ProvidersRepository {
  async getDocumentTypes() {
    try {
      // Excluir "Registro Civil" - solo para deportistas
      const documentTypes = await prisma.documentType.findMany({
        where: {
          NOT: {
            name: "Registro Civil",
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: { name: "asc" },
      });

      return documentTypes.map((docType) => ({
        value: docType.id.toString(),
        label: docType.name,
        id: docType.id,
        name: docType.name,
        description: docType.description,
      }));
    } catch (error) {
      console.error("Repository error - getDocumentTypes:", error);
      throw error;
    }
  }

  async findAll({ page = 1, limit = 10, search = "", status, entityType }) {
    const skip = (page - 1) * limit;

    const entityTypeMap = {
      juridica: "legal",
      natural: "natural",
    };

    const conditions = [];

    if (search && search.trim()) {
      conditions.push({
        OR: [
          { businessName: { contains: search, mode: "insensitive" } },
          { nit: { contains: search, mode: "insensitive" } },
          { mainContact: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    if (status && status.trim()) {
      conditions.push({
        status: status === "Activo" ? "Active" : "Inactive",
      });
    }

    if (entityType && entityType.trim()) {
      conditions.push({
        entityType: entityTypeMap[entityType] || entityType,
      });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

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
      this.transformToFrontend(provider),
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
      },
    });

    return provider ? this.transformToFrontend(provider) : null;
  }

  async findByNit(nit) {
    if (!nit) return null;

    const cleanedNit = nit.replace(/[.\-\s]/g, "");

    const provider = await prisma.provider.findUnique({
      where: { nit: cleanedNit },
      include: { documentType: true },
    });

    return provider ? this.transformToFrontend(provider) : null;
  }

  async findByEmail(email) {
    const provider = await prisma.provider.findUnique({
      where: { email },
      include: { documentType: true },
    });

    return provider ? this.transformToFrontend(provider) : null;
  }

  async findByBusinessName(
    businessName,
    excludeId = null,
    tipoEntidad = "juridica",
  ) {
    // Para personas naturales, permitir duplicados de nombre
    if (tipoEntidad === "natural") {
      return null;
    }

    // Para personas jurídicas, mantener validación de unicidad
    const where = {
      businessName: {
        equals: businessName,
        mode: "insensitive",
      },
      entityType: "legal",
    };

    if (excludeId) {
      where.NOT = { id: parseInt(excludeId) };
    }

    const provider = await prisma.provider.findFirst({
      where,
      include: { documentType: true },
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
      include: { documentType: true },
    });
    return provider ? this.transformToFrontend(provider) : null;
  }

  async create(providerData) {
    const transformedData = this.transformToBackend(providerData);

    const { documentTypeId, ...providerInfo } = transformedData;

    const data = { ...providerInfo };

    if (providerData.tipoEntidad === "natural" && documentTypeId) {
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

    if (documentTypeId !== undefined) {
      if (documentTypeId) {
        data.documentType = { connect: { id: documentTypeId } };
      } else if (providerData.tipoEntidad === "juridica") {
        data.documentType = { disconnect: true };
      }
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

      // Verificar si el proveedor tiene ingresos asociados
      const hasIngresos = await this.checkHasIngresos(id);
      if (hasIngresos) {
        throw new Error(
          `No se puede eliminar el proveedor "${provider.businessName}" porque está asociado a ingresos.`
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

  async checkHasIngresos(providerId) {
    try {
      // Verificar si el proveedor tiene movimientos de materiales (entradas/ingresos) asociados
      const count = await prisma.materialMovement.count({
        where: { 
          proveedorId: parseInt(providerId),
          tipoMovimiento: 'Entrada' // Entradas = Ingresos de materiales
        },
      });
      return count > 0;
    } catch (error) {
      console.error("Repository error - checkHasIngresos:", error);
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
    const [totalProviders, activeProviders, providersByEntityType] =
      await Promise.all([
        prisma.provider.count(),
        prisma.provider.count({ where: { status: "Active" } }),
        prisma.provider.groupBy({
          by: ["entityType"],
          _count: true,
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
    };
  }

  transformToFrontend(provider) {
    if (!provider) return null;

    // Mapeo de nombres de tipos de documento a códigos
    const documentTypeNameToCode = {
      "Cédula de Ciudadanía": "CC",
      "Tarjeta de Identidad": "TI",
      "Cédula de Extranjería": "CE",
      Pasaporte: "PAS",
      NIT: "NIT",
    };

    // Obtener el código del tipo de documento
    const getDocumentTypeCode = (documentType) => {
      if (!documentType) return "";
      return documentTypeNameToCode[documentType.name] || "";
    };

    return {
      id: provider.id,
      tipoEntidad: provider.entityType === "legal" ? "juridica" : "natural",
      razonSocial: provider.businessName,
      nit: provider.nit,
      tipoDocumento: getDocumentTypeCode(provider.documentType),
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
      documentos: null,
      terminosPago: null,
      servicios: null,
      observaciones: null,
      // Para compatibilidad
      documentTypeId: provider.documentType?.id || null,
    };
  }

  transformToBackend(providerData) {
    let cleanedNit = providerData.nit;

    if (cleanedNit && typeof cleanedNit === "string") {
      cleanedNit = cleanedNit.replace(/[.\-\s]/g, "");
    }

    const documentTypeCodeToName = {
      CC: "Cédula de Ciudadanía",
      TI: "Tarjeta de Identidad",
      CE: "Cédula de Extranjería",
      PAS: "Pasaporte",
      NIT: "NIT",
    };

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

    if (providerData.tipoEntidad === "natural" && providerData.tipoDocumento) {
      const documentTypeName =
        documentTypeCodeToName[providerData.tipoDocumento];
      if (documentTypeName) {
        transformed.documentTypeId =
          this.getDocumentTypeIdByName(documentTypeName);
      }
    }

    return transformed;
  }

  transformToBackendOld(providerData) {
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
      status:
        providerData.status === "Inactive" || providerData.estado === "Inactivo"
          ? "Inactive"
          : "Active",
    };

    if (providerData.tipoEntidad === "natural" && providerData.tipoDocumento) {
      if (typeof providerData.tipoDocumento === "number") {
        transformed.documentTypeId = providerData.tipoDocumento;
      } else if (typeof providerData.tipoDocumento === "string") {
        const parsedId = parseInt(providerData.tipoDocumento);
        if (!isNaN(parsedId)) {
          transformed.documentTypeId = parsedId;
        }
      }
    }

    return transformed;
  }

  getDocumentTypeIdByName(documentTypeName) {
    const documentTypeMap = {
      "Cédula de Ciudadanía": 1,
      "Tarjeta de Identidad": 2,
      "Cédula de Extranjería": 3,
      Pasaporte: 4,
      NIT: 5,
    };
    return documentTypeMap[documentTypeName] || null;
  }
}

/**
 * Función auxiliar para obtener el nombre del tipo de documento
 */
export const getDocumentTypeName = async (documentTypeId) => {
  try {
    const documentType = await prisma.documentType.findUnique({
      where: { id: parseInt(documentTypeId) },
      select: { name: true },
    });
    return documentType?.name || null;
  } catch (error) {
    console.error("Error getting document type name:", error);
    return null;
  }
};

export default new ProvidersRepository();
