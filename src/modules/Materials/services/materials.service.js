import materialsRepository from "../repository/materials.repository.js";
import categoriesRepository from "../repository/categories.repository.js";

class MaterialsService {
  /**
   * Obtener todos los materiales con paginación
   */
  async getAll({
    page = 1,
    limit = 10,
    search = "",
    estado = null,
    categoriaId = null,
    stockType = null,
  }) {
    try {
      const result = await materialsRepository.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search: search.toString().trim(),
        estado,
        categoriaId,
        stockType,
      });

      return {
        success: true,
        data: result.materials,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.pages,
        },
      };
    } catch (error) {
      console.error("Service error - getAll:", error);
      throw error;
    }
  }

  /**
   * Obtener material por ID
   */
  async getById(id) {
    try {
      const material = await materialsRepository.findById(id);

      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: "Material no encontrado",
        };
      }

      return {
        success: true,
        data: material,
      };
    } catch (error) {
      console.error("Service error - getById:", error);
      throw error;
    }
  }

  /**
   * Crear material
   */
  async create(data, userId) {
    try {
      // Validar datos
      this.validateMaterialData(data);

      // Verificar que la categoría existe y está activa
      const category = await categoriesRepository.findById(data.categoria_id);
      if (!category) {
        return {
          success: false,
          statusCode: 404,
          message: "La categoría no existe",
        };
      }

      if (category.estado !== "Activo") {
        return {
          success: false,
          statusCode: 400,
          message: "No se pueden crear materiales en categorías inactivas",
        };
      }

      // Verificar nombre único por categoría
      const exists = await materialsRepository.existsByNameAndCategory(
        data.nombre,
        data.categoria_id,
      );

      if (exists) {
        return {
          success: false,
          statusCode: 400,
          message: "Ya existe un material con este nombre en esta categoría",
        };
      }

      // Crear material (stock inicial = 0, se actualiza con movimientos)
      const material = await materialsRepository.create(data, userId);

      return {
        success: true,
        data: material,
        message: `Material "${material.nombre}" creado exitosamente`,
      };
    } catch (error) {
      console.error("Service error - create:", error);
      throw error;
    }
  }

  /**
   * Actualizar material
   * IMPORTANTE: No permite cambiar nombre ni categoría si tiene movimientos
   */
  async update(id, data, userId) {
    try {
      // Validar datos
      this.validateMaterialData(data);

      // Verificar que el material existe
      const existingMaterial = await materialsRepository.findById(id);
      if (!existingMaterial) {
        return {
          success: false,
          statusCode: 404,
          message: "Material no encontrado",
        };
      }

      // Si se cambia el nombre o categoría, validar unicidad
      if (data.nombre || data.categoria_id) {
        const nombre = data.nombre || existingMaterial.nombre;
        const categoriaId = data.categoria_id || existingMaterial.categoriaId;

        const exists = await materialsRepository.existsByNameAndCategory(
          nombre,
          categoriaId,
          id,
        );

        if (exists) {
          return {
            success: false,
            statusCode: 400,
            message: "Ya existe un material con este nombre en esta categoría",
          };
        }
      }

      // Si se cambia la categoría, verificar que existe
      if (data.categoria_id) {
        const category = await categoriesRepository.findById(data.categoria_id);
        if (!category) {
          return {
            success: false,
            statusCode: 404,
            message: "La categoría no existe",
          };
        }
      }

      // Actualizar material (el repository valida si tiene movimientos)
      const material = await materialsRepository.update(id, data, userId);

      return {
        success: true,
        data: material,
        message: `Material "${material.nombre}" actualizado exitosamente`,
      };
    } catch (error) {
      // Errores específicos de validación
      if (error.message.includes("tiene movimientos registrados")) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }
      console.error("Service error - update:", error);
      throw error;
    }
  }

  /**
   * Cambiar estado del material
   */
  async toggleStatus(id, userId) {
    try {
      const material = await materialsRepository.toggleStatus(id, userId);

      return {
        success: true,
        data: material,
        message: `Estado actualizado a "${material.estado}"`,
      };
    } catch (error) {
      console.error("Service error - toggleStatus:", error);
      throw error;
    }
  }

  /**
   * Eliminar material (solo si no tiene stock ni movimientos)
   */
  async delete(id) {
    try {
      await materialsRepository.delete(id);

      return {
        success: true,
        message: "Material eliminado exitosamente",
      };
    } catch (error) {
      // Errores de validación de negocio
      if (error.message.includes("tiene stock registrado")) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
          reason: "HAS_STOCK",
        };
      }

      if (error.message.includes("movimiento(s) histórico(s)")) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
          reason: "HAS_MOVEMENTS",
        };
      }

      if (error.message.includes("no encontrado")) {
        return {
          success: false,
          statusCode: 404,
          message: error.message,
        };
      }

      console.error("Service error - delete:", error);
      throw error;
    }
  }

  /**
   * Obtener historial de movimientos de un material
   */
  async getMovementHistory(materialId, limit = 10) {
    try {
      const history = await materialsRepository.getMovementHistory(
        materialId,
        limit,
      );

      return {
        success: true,
        data: history,
      };
    } catch (error) {
      console.error("Service error - getMovementHistory:", error);
      throw error;
    }
  }

  /**
   * Verificar disponibilidad de nombre en categoría
   */
  async checkNameAvailability(nombre, categoriaId, excludeId = null) {
    try {
      const exists = await materialsRepository.existsByNameAndCategory(
        nombre,
        categoriaId,
        excludeId,
      );

      return {
        success: true,
        available: !exists,
        message: exists
          ? "El nombre ya está en uso en esta categoría"
          : "Nombre disponible",
      };
    } catch (error) {
      console.error("Service error - checkNameAvailability:", error);
      throw error;
    }
  }

  /**
   * Validar datos del material
   */
  validateMaterialData(data) {
    if (!data.nombre || !data.nombre.trim()) {
      throw new Error("El nombre es obligatorio");
    }

    if (data.nombre.trim().length < 3) {
      throw new Error("El nombre debe tener al menos 3 caracteres");
    }

    if (data.nombre.trim().length > 255) {
      throw new Error("El nombre no puede exceder 255 caracteres");
    }

    if (!data.categoria_id) {
      throw new Error("La categoría es obligatoria");
    }

    if (data.descripcion && data.descripcion.length > 1000) {
      throw new Error("La descripción no puede exceder 1000 caracteres");
    }

    // La unidad de medida siempre será "unidad" por defecto
    // No se requiere validación adicional
  }

  /**
   * Register material discharge
   */
  async registerDischarge(id, data, userId, userName) {
    try {
      // Validate discharge data
      this.validateDischargeData(data);

      // Verify material exists
      const existingMaterial = await materialsRepository.findById(id);
      if (!existingMaterial) {
        return {
          success: false,
          statusCode: 404,
          message: "Material no encontrado",
        };
      }

      if (existingMaterial.estado !== "Activo") {
        return {
          success: false,
          statusCode: 400,
          message: "No se pueden registrar bajas en materiales inactivos",
        };
      }

      // Determine which inventory to deduct from
      const inventoryType = data.inventario_origen || "FUNDACION";
      const availableStock =
        inventoryType === "FUNDACION"
          ? existingMaterial.stockFundacion
          : existingMaterial.stockEventos;

      // Validate sufficient stock
      if (availableStock < data.cantidad) {
        const inventoryLabel =
          inventoryType === "FUNDACION" ? "Fundación" : "Eventos";
        return {
          success: false,
          statusCode: 400,
          message: `Stock insuficiente en ${inventoryLabel}. Disponible: ${availableStock}, Solicitado: ${data.cantidad}`,
        };
      }

      // Register discharge (atomic transaction)
      const material = await materialsRepository.registerDischarge(
        id,
        data,
        userId,
        userName,
      );

      return {
        success: true,
        data: material,
        message: `Baja registrada exitosamente. ${data.cantidad} unidad(es) de "${material.nombre}" dadas de baja.`,
      };
    } catch (error) {
      console.error("Service error - registerDischarge:", error);

      // Specific errors
      if (
        error.message.includes("Stock insuficiente") ||
        error.message.includes("insuficiente")
      ) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }

      throw error;
    }
  }

  /**
   * Validate discharge data
   */
  validateDischargeData(data) {
    // Quantity
    if (!data.cantidad) {
      throw new Error("La cantidad es obligatoria");
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error("La cantidad debe ser un número positivo");
    }

    // Discharge type
    if (!data.tipo_baja) {
      throw new Error("El tipo de baja es obligatorio");
    }

    const validTypes = [
      "Daño o Deterioro",
      "Pérdida",
      "Robo",
      "Ajuste de Inventario",
      "Otro",
    ];
    if (!validTypes.includes(data.tipo_baja)) {
      throw new Error(
        `Tipo de baja inválido. Debe ser uno de: ${validTypes.join(", ")}`,
      );
    }

    // Description
    if (!data.descripcion || !data.descripcion.trim()) {
      throw new Error("La descripción es obligatoria");
    }

    // If "Otro", validate more detailed description
    if (data.tipo_baja === "Otro" && data.descripcion.trim().length < 10) {
      throw new Error(
        'Para el tipo "Otro", la descripción debe tener al menos 10 caracteres',
      );
    }

    if (data.descripcion.length > 1000) {
      throw new Error("La descripción no puede exceder 1000 caracteres");
    }

    // Inventory origin (optional, defaults to FUNDACION)
    if (
      data.inventario_origen &&
      !["FUNDACION", "EVENTOS"].includes(data.inventario_origen)
    ) {
      throw new Error("El origen del inventario debe ser FUNDACION o EVENTOS");
    }
  }

  /**
   * Check if material has future event assignments
   */
  async checkFutureAssignments(materialId) {
    const prismaInstance = new (
      await import("../../../../generated/prisma/index.js")
    ).PrismaClient();

    try {
      // Get material stock
      const material = await prismaInstance.material.findUnique({
        where: { id: parseInt(materialId) },
        select: {
          stockFundacion: true,
          stockEventos: true,
        },
      });

      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: "Material no encontrado",
        };
      }

      // Get active event assignments (exclude Finalizado and Cancelado)
      const activeAssignments =
        await prismaInstance.eventMaterialReusable.findMany({
          where: {
            materialId: parseInt(materialId),
            evento: {
              NOT: {
                status: {
                  in: ["Finalizado", "Cancelado"],
                },
              },
            },
          },
          include: {
            evento: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                status: true,
              },
            },
          },
        });

      // Calculate total planned (sum all quantities)
      let maxConcurrentUsage = 0;
      if (activeAssignments.length > 0) {
        maxConcurrentUsage = activeAssignments.reduce(
          (sum, assignment) => sum + assignment.cantidad,
          0,
        );
      }

      const availableForDischarge =
        material.stockFundacion - maxConcurrentUsage;

      return {
        success: true,
        data: {
          hasAssignments: activeAssignments.length > 0,
          count: activeAssignments.length,
          totalPlanned: maxConcurrentUsage,
          stockFundacion: material.stockFundacion,
          stockEventos: material.stockEventos,
          availableForDischarge: Math.max(0, availableForDischarge),
        },
      };
    } catch (error) {
      console.error("Service error - checkFutureAssignments:", error);
      throw error;
    } finally {
      await prismaInstance.$disconnect();
    }
  }

  /**
   * Obtener todos los materiales para reporte (SIN PAGINACIÓN)
   */
  async getAllForReport({
    search = "",
    status,
    categoriaId,
    stockMin,
    stockMax,
  }) {
    try {
      const materials = await materialsRepository.findAllForReport({
        search,
        status,
        categoriaId,
        stockMin,
        stockMax,
      });

      return {
        success: true,
        data: materials,
        message: `Se encontraron ${materials.length} materiales para el reporte.`,
      };
    } catch (error) {
      console.error("Error en getAllForReport:", error);
      throw error;
    }
  }
}

export default new MaterialsService();
