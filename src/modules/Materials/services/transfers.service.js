import materialsRepository from "../repository/materials.repository.js";

class TransfersService {
  /**
   * Transfer stock between inventories (ATOMIC TRANSACTION)
   */
  async transferStock(materialId, data, userId, userName) {
    try {
      // 1. Validate transfer data
      this.validateTransferData(data);

      // 2. Get material for validations
      const material = await materialsRepository.findById(materialId);
      if (!material) {
        return {
          success: false,
          statusCode: 404,
          message: "Material not found",
        };
      }

      if (material.estado !== "Activo") {
        return {
          success: false,
          statusCode: 400,
          message: "Cannot transfer stock on inactive materials",
        };
      }

      // 3. Validate different inventories
      if (data.from === data.to) {
        return {
          success: false,
          statusCode: 400,
          message: "Source and destination inventories must be different",
        };
      }

      // 4. Validate sufficient stock in source
      const sourceStock =
        data.from === "FUNDACION"
          ? material.stockFundacion
          : material.stockEventos;

      if (sourceStock < data.cantidad) {
        return {
          success: false,
          statusCode: 400,
          message: `Insufficient stock in ${data.from}. Available: ${sourceStock}, Requested: ${data.cantidad}`,
        };
      }

      // 5. Prepare transfer data
      const transferData = {
        from: data.from,
        to: data.to,
        cantidad: parseInt(data.cantidad),
        observaciones:
          data.observaciones || `Transfer from ${data.from} to ${data.to}`,
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
        message: `Successfully transferred ${data.cantidad} units from ${data.from} to ${data.to}`,
      };
    } catch (error) {
      console.error("❌ Error transferring stock:", error.message);

      // Specific errors
      if (
        error.message.includes("Insufficient stock") ||
        error.message.includes("insuficiente")
      ) {
        return {
          success: false,
          statusCode: 400,
          message: error.message,
        };
      }

      if (
        error.message.includes("not found") ||
        error.message.includes("no encontrado")
      ) {
        return {
          success: false,
          statusCode: 404,
          message: error.message,
        };
      }

      if (error.message.includes("must be different")) {
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
   * Validate transfer data
   */
  validateTransferData(data) {
    // Source inventory
    if (!data.from) {
      throw new Error("Source inventory is required");
    }

    if (!["FUNDACION", "EVENTOS"].includes(data.from)) {
      throw new Error("Source must be FUNDACION or EVENTOS");
    }

    // Destination inventory
    if (!data.to) {
      throw new Error("Destination inventory is required");
    }

    if (!["FUNDACION", "EVENTOS"].includes(data.to)) {
      throw new Error("Destination must be FUNDACION or EVENTOS");
    }

    // Quantity
    if (!data.cantidad) {
      throw new Error("Quantity is required");
    }

    const cantidad = parseInt(data.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      throw new Error("Quantity must be a positive number");
    }

    // Observations
    if (data.observaciones && data.observaciones.length > 1000) {
      throw new Error("Observations cannot exceed 1000 characters");
    }
  }
}

export default new TransfersService();
