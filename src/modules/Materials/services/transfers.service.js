import materialsRepository from "../repository/materials.repository.js";

class TransfersService {
  isNotFoundMessage(message = "") {
    const normalized = message.toLowerCase();
    return normalized.includes("material not found") || normalized.includes("material no encontrado");
  }

  isBusinessValidationMessage(message = "") {
    const normalized = message.toLowerCase();
    const validationHints = [
      "stock insuficiente",
      "insufficient stock",
      "no se puede transferir",
      "cannot transfer stock",
      "source and destination",
      "inventarios origen y destino",
      "must be fundacion or eventos",
      "debe ser fundacion o eventos",
      "quantity is required",
      "la cantidad es obligatoria",
      "quantity must be a positive number",
      "la cantidad debe ser un numero positivo",
      "source inventory is required",
      "destination inventory is required",
      "el inventario origen es obligatorio",
      "el inventario destino es obligatorio",
      "observations cannot exceed",
      "las observaciones no pueden exceder",
    ];

    return validationHints.some((hint) => normalized.includes(hint));
  }

  normalizeTransferMessage(message = "") {
    const trimmed = String(message || "").trim();
    if (!trimmed) {
      return "Error al transferir stock";
    }

    const exactMap = {
      "Material not found": "Material no encontrado",
      "Cannot transfer stock on inactive materials":
        "No se puede transferir stock en materiales inactivos",
      "Source and destination inventories must be different":
        "Los inventarios origen y destino deben ser diferentes",
      "Source inventory is required": "El inventario origen es obligatorio",
      "Source must be FUNDACION or EVENTOS":
        "El inventario origen debe ser FUNDACION o EVENTOS",
      "Destination inventory is required": "El inventario destino es obligatorio",
      "Destination must be FUNDACION or EVENTOS":
        "El inventario destino debe ser FUNDACION o EVENTOS",
      "Quantity is required": "La cantidad es obligatoria",
      "Quantity must be a positive number":
        "La cantidad debe ser un numero positivo",
      "Observations cannot exceed 1000 characters":
        "Las observaciones no pueden exceder 1000 caracteres",
    };

    if (exactMap[trimmed]) {
      return exactMap[trimmed];
    }

    if (trimmed.startsWith("Insufficient stock in")) {
      return trimmed
        .replace("Insufficient stock in", "Stock insuficiente en")
        .replace("Available:", "Disponible:")
        .replace("Requested:", "Solicitado:");
    }

    return trimmed;
  }

  /**
   * Transfer stock between inventories (ATOMIC TRANSACTION)
   */
  async transferStock(materialId, data, userId, userName) {
    try {
      // 1. Validate transfer data
      this.validateTransferData(data);
      const cantidad = parseInt(data.cantidad, 10);

      // 2. Get material for validations
      const material = await materialsRepository.findById(materialId);
      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: "Material no encontrado",
        };
      }

      if (material.estado !== "Activo") {
        return {
          success: false,
          statusCode: 400,
          message: "No se puede transferir stock en materiales inactivos",
        };
      }

      // 3. Validate different inventories
      if (data.from === data.to) {
        return {
          success: false,
          statusCode: 400,
          message: "Los inventarios origen y destino deben ser diferentes",
        };
      }

      // 4. Validate sufficient stock in source
      const sourceStock =
        data.from === "FUNDACION"
          ? material.stockFundacion
          : material.stockEventos;

      if (sourceStock < cantidad) {
        return {
          success: false,
          statusCode: 400,
          message: `Stock insuficiente en ${data.from}. Disponible: ${sourceStock}, Solicitado: ${cantidad}`,
        };
      }

      // 5. Prepare transfer data
      const transferData = {
        from: data.from,
        to: data.to,
        cantidad,
        observaciones:
          data.observaciones || `Transferencia de ${data.from} hacia ${data.to}`,
      };

      // 6. Execute transfer (atomic transaction)
      const updatedMaterial = await materialsRepository.transferStock(
        materialId,
        transferData,
        userId,
        userName,
      );

      return {
        success: true,
        data: updatedMaterial,
        message: `Se transfirieron ${cantidad} unidades desde ${data.from} hacia ${data.to}`,
      };
    } catch (error) {
      const normalizedMessage = this.normalizeTransferMessage(error?.message);

      if (this.isNotFoundMessage(normalizedMessage)) {
        return {
          success: false,
          statusCode: 404,
          message: normalizedMessage,
        };
      }

      if (this.isBusinessValidationMessage(normalizedMessage)) {
        return {
          success: false,
          statusCode: 400,
          message: normalizedMessage,
        };
      }

      throw error;
    }
  }

  /**
   * Validate transfer data
   */
  validateTransferData(data) {
    // Source inventory
    if (!data.from) {
      throw new Error("El inventario origen es obligatorio");
    }

    if (!["FUNDACION", "EVENTOS"].includes(data.from)) {
      throw new Error("El inventario origen debe ser FUNDACION o EVENTOS");
    }

    // Destination inventory
    if (!data.to) {
      throw new Error("El inventario destino es obligatorio");
    }

    if (!["FUNDACION", "EVENTOS"].includes(data.to)) {
      throw new Error("El inventario destino debe ser FUNDACION o EVENTOS");
    }

    // Quantity
    if (!data.cantidad) {
      throw new Error("La cantidad es obligatoria");
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error("La cantidad debe ser un numero positivo");
    }

    // Observations
    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error("Las observaciones no pueden exceder 1000 caracteres");
    }
  }
}

export default new TransfersService();

