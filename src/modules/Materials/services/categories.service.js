import categoriesRepository from "../repository/categories.repository.js";

class CategoriesService {
  constructor() {
    this.allowedStatusValues = ["Activo", "Inactivo"];
  }

  createValidationError(message) {
    const validationError = new Error(message);
    validationError.statusCode = 400;
    return validationError;
  }

  normalizeStatusFilter(estado) {
    if (estado === undefined || estado === null || estado === "") {
      return null;
    }

    if (!this.allowedStatusValues.includes(estado)) {
      throw this.createValidationError("El filtro de estado debe ser Activo o Inactivo");
    }

    return estado;
  }

  /**
   * Obtener todas las categorias con paginacion
   */
  async getAll({ page = 1, limit = 10, search = "", estado = null }) {
    const normalizedStatus = this.normalizeStatusFilter(estado);

    const result = await categoriesRepository.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search.toString().trim(),
      estado: normalizedStatus,
    });

    return {
      success: true,
      data: result.categories,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.pages,
      },
    };
  }

  /**
   * Obtener categoria por ID
   */
  async getById(id) {
    const category = await categoriesRepository.findById(id);

    if (!category) {
      return {
        success: false,
        statusCode: 404,
        message: "Categoria no encontrada",
      };
    }

    return {
      success: true,
      data: category,
    };
  }

  /**
   * Crear categoria
   */
  async create(data, userId) {
    try {
      this.validateCategoryData(data);

      const exists = await categoriesRepository.existsByName(data.nombre);
      if (exists) {
        return {
          success: false,
          statusCode: 400,
          message: "Ya existe una categoria con este nombre",
        };
      }

      const category = await categoriesRepository.create(data, userId);
      return {
        success: true,
        data: category,
        message: `Categoria "${category.nombre}" creada exitosamente`,
      };
    } catch (error) {
      if (error?.statusCode) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * Actualizar categoria
   */
  async update(id, data, userId) {
    try {
      this.validateCategoryData(data);

      const exists = await categoriesRepository.findById(id);
      if (!exists) {
        return {
          success: false,
          statusCode: 404,
          message: "Categoria no encontrada",
        };
      }

      const nameExists = await categoriesRepository.existsByName(data.nombre, id);
      if (nameExists) {
        return {
          success: false,
          statusCode: 400,
          message: "Ya existe otra categoria con este nombre",
        };
      }

      const category = await categoriesRepository.update(id, data, userId);
      return {
        success: true,
        data: category,
        message: `Categoria "${category.nombre}" actualizada exitosamente`,
      };
    } catch (error) {
      if (error?.statusCode) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * Cambiar estado de categoria
   */
  async toggleStatus(id, userId) {
    try {
      const category = await categoriesRepository.toggleStatus(id, userId);
      return {
        success: true,
        data: category,
        message: `Estado actualizado a "${category.estado}"`,
      };
    } catch (error) {
      if (error?.statusCode) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
        };
      }
      throw error;
    }
  }

  /**
   * Eliminar categoria
   */
  async delete(id) {
    try {
      await categoriesRepository.delete(id);
      return {
        success: true,
        message: "Categoria eliminada exitosamente",
      };
    } catch (error) {
      if (error?.statusCode) {
        return {
          success: false,
          statusCode: error.statusCode,
          message: error.message,
        };
      }

      if (error.message.includes("material(es) asociado(s)")) {
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
   * Obtener categorias activas (para selectores)
   */
  async getActiveCategories() {
    const categories = await categoriesRepository.findAllActive();
    return {
      success: true,
      data: categories,
    };
  }

  /**
   * Verificar disponibilidad de nombre
   */
  async checkNameAvailability(nombre, excludeId = null) {
    const exists = await categoriesRepository.existsByName(nombre, excludeId);
    return {
      success: true,
      available: !exists,
      message: exists ? "El nombre ya esta en uso" : "Nombre disponible",
    };
  }

  /**
   * Validar datos de la categoria
   */
  validateCategoryData(data) {
    if (!data || typeof data !== "object") {
      throw this.createValidationError("Datos invalidos para la categoria");
    }

    if (typeof data.nombre !== "string") {
      throw this.createValidationError("El nombre debe ser texto");
    }

    if (!data.nombre.trim()) {
      throw this.createValidationError("El nombre es obligatorio");
    }

    if (data.nombre.trim().length < 3) {
      throw this.createValidationError("El nombre debe tener al menos 3 caracteres");
    }

    if (data.nombre.trim().length > 100) {
      throw this.createValidationError("El nombre no puede exceder 100 caracteres");
    }

    if (
      data.descripcion !== undefined &&
      data.descripcion !== null &&
      typeof data.descripcion !== "string"
    ) {
      throw this.createValidationError("La descripcion debe ser texto");
    }

    if (
      typeof data.descripcion === "string" &&
      data.descripcion.trim().length > 500
    ) {
      throw this.createValidationError("La descripcion no puede exceder 500 caracteres");
    }

    if (
      data.estado !== undefined &&
      data.estado !== null &&
      !this.allowedStatusValues.includes(data.estado)
    ) {
      throw this.createValidationError("El estado debe ser Activo o Inactivo");
    }
  }

  /**
   * Obtener todas las categorias para reporte (sin paginacion)
   */
  async getAllForReport({ search = "", estado = null }) {
    const normalizedStatus = this.normalizeStatusFilter(estado);

    const result = await categoriesRepository.findAllForReport({
      search: search.toString().trim(),
      estado: normalizedStatus,
    });

    return {
      success: true,
      data: result.categories,
    };
  }
}

export default new CategoriesService();
