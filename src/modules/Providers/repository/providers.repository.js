import prisma from '../../../config/database.js';

export class ProvidersRepository {
  /**
   * Obtener todos los proveedores con paginación y filtros
   */
  async findAll({ page = 1, limit = 10, search = '', status, entityType }) {
    const skip = (page - 1) * limit;
    
    // Mapear entityType de frontend a backend
    const entityTypeMap = {
      'juridica': 'legal',
      'natural': 'natural'
    };

    const where = {
      AND: [
        search ? {
          OR: [
            { businessName: { contains: search, mode: 'insensitive' } },
            { nit: { contains: search, mode: 'insensitive' } },
            { mainContact: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        status ? { 
          status: status === 'Activo' ? 'Active' : 'Inactive' 
        } : {},
        entityType ? { 
          entityType: entityTypeMap[entityType] || entityType 
        } : {}
      ].filter(condition => Object.keys(condition).length > 0)
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
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.provider.count({ where })
    ]);

    // Transformar datos para el frontend
    const transformedProviders = providers.map(provider => this.transformToFrontend(provider));

    return {
      providers: transformedProviders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener proveedor por ID
   */
  async findById(id) {
    const provider = await prisma.provider.findUnique({
      where: { id },
      include: {
        documentType: true,
        purchases: {
          include: {
            items: true
          }
        }
      }
    });

    return provider ? this.transformToFrontend(provider) : null;
  }

  /**
   * Obtener proveedor por NIT
   */
  async findByNit(nit) {
    return prisma.provider.findUnique({
      where: { nit }
    });
  }

  /**
   * Obtener proveedor por email
   */
  async findByEmail(email) {
    return prisma.provider.findUnique({
      where: { email }
    });
  }

  /**
   * Buscar por razón social/nombre (case insensitive)
   */
  async findByBusinessName(businessName, excludeId = null) {
    const where = {
      businessName: { 
        equals: businessName,
        mode: 'insensitive'
      }
    };
    
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    return prisma.provider.findFirst({ where });
  }

  /**
   * Buscar por nombre caso insensitive
   */
  async findByNameCaseInsensitive(name, excludeId = null) {
    const where = {
      OR: [
        { businessName: { equals: name, mode: 'insensitive' } },
        { mainContact: { equals: name, mode: 'insensitive' } }
      ]
    };
    
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    return prisma.provider.findFirst({ where });
  }

  /**
   * Verificar si tiene compras activas
   */
  async hasActivePurchases(providerId) {
    const purchases = await prisma.purchase.count({
      where: {
        providerId: providerId,
        status: {
          in: ['Pending', 'InProgress', 'Completed']
        }
      }
    });
    
    return purchases > 0;
  }

  /**
   * Crear nuevo proveedor
   */
  async create(providerData) {
    // Transformar datos del frontend al backend
    const transformedData = this.transformToBackend(providerData);
    
    const { documentTypeId, ...providerInfo } = transformedData;
    
    const data = { ...providerInfo };
    if (documentTypeId) {
      data.documentType = { connect: { id: documentTypeId } };
    }

    const provider = await prisma.provider.create({
      data,
      include: {
        documentType: true
      }
    });

    return this.transformToFrontend(provider);
  }

  /**
   * Actualizar proveedor
   */
  async update(id, providerData) {
    const transformedData = this.transformToBackend(providerData);
    const { documentTypeId, ...providerInfo } = transformedData;
    const data = { ...providerInfo };

    if (documentTypeId) {
      data.documentType = { connect: { id: documentTypeId } };
    }

    const provider = await prisma.provider.update({
      where: { id },
      data,
      include: {
        documentType: true
      }
    });

    return this.transformToFrontend(provider);
  }

  /**
   * Eliminar proveedor
   */
  async delete(id) {
    const provider = await prisma.provider.update({
      where: { id },
      data: { status: 'Inactive' },
      include: {
        documentType: true
      }
    });

    return this.transformToFrontend(provider);
  }

  /**
   * Cambiar estado de proveedor
   */
  async changeStatus(id, status) {
    const provider = await prisma.provider.update({
      where: { id },
      data: { 
        status: status === 'Activo' ? 'Active' : 'Inactive' 
      },
      include: {
        documentType: true
      }
    });

    return this.transformToFrontend(provider);
  }

  /**
   * Verificar disponibilidad de NIT
   */
  async isNitAvailable(nit, excludeId = null) {
    const where = { nit };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const existingProvider = await prisma.provider.findFirst({ where });
    return !existingProvider;
  }

  /**
   * Verificar disponibilidad de email
   */
  async isEmailAvailable(email, excludeId = null) {
    const where = { email };
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const existingProvider = await prisma.provider.findFirst({ where });
    return !existingProvider;
  }

  /**
   * Obtener estadísticas de proveedores
   */
  async getStats() {
    const [
      totalProviders,
      activeProviders,
      providersByEntityType,
      providersWithPurchases
    ] = await Promise.all([
      prisma.provider.count(),
      prisma.provider.count({ where: { status: 'Active' } }),
      prisma.provider.groupBy({
        by: ['entityType'],
        _count: true
      }),
      prisma.provider.count({
        where: {
          purchases: {
            some: {}
          }
        }
      })
    ]);

    return {
      totalProviders,
      activeProviders,
      inactiveProviders: totalProviders - activeProviders,
      providersByEntityType: providersByEntityType.map(item => ({
        entityType: item.entityType === 'legal' ? 'juridica' : 'natural',
        count: item._count
      })),
      providersWithPurchases,
      providersWithoutPurchases: totalProviders - providersWithPurchases
    };
  }

  /**
   * Transformar datos del backend al frontend
   */
  transformToFrontend(provider) {
    return {
      id: provider.id,
      tipoEntidad: provider.entityType === 'legal' ? 'juridica' : 'natural',
      razonSocial: provider.businessName,
      nit: provider.nit,
      tipoDocumento: provider.documentType?.name || '',
      contactoPrincipal: provider.mainContact,
      correo: provider.email,
      telefono: provider.phone,
      direccion: provider.address,
      ciudad: provider.city,
      descripcion: provider.description,
      estado: provider.status === 'Active' ? 'Activo' : 'Inactivo',
      fechaRegistro: provider.createdAt,
      // Campos adicionales para compatibilidad
      documentos: null,
      terminosPago: null,
      servicios: null,
      observaciones: null
    };
  }

  /**
   * Transformar datos del frontend al backend
   */
  transformToBackend(providerData) {
    // Mapear tipos de documento
    const documentTypeMap = {
      'CC': 1, // Cédula
      'TI': 2, // Tarjeta Identidad  
      'CE': 3, // Cédula Extranjería
      'PAS': 4 // Pasaporte
    };

    return {
      entityType: providerData.tipoEntidad === 'juridica' ? 'legal' : 'natural',
      businessName: providerData.razonSocial,
      nit: providerData.nit,
      documentTypeId: providerData.tipoDocumento ? 
        documentTypeMap[providerData.tipoDocumento] : null,
      mainContact: providerData.contactoPrincipal,
      email: providerData.correo,
      phone: providerData.telefono,
      address: providerData.direccion,
      city: providerData.ciudad,
      description: providerData.descripcion,
      status: providerData.estado === 'Activo' ? 'Active' : 'Inactive'
    };
  }
}

export default new ProvidersRepository();