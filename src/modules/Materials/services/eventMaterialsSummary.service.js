import prisma from "../../../config/database.js";

class EventMaterialsSummaryService {
  /**
   * Get aggregated materials summary for event (optimized payload)
   */
  async getSummary(eventoId) {
    try {
      const eventIdInt = parseInt(eventoId);

      // 1. Get event info
      const event = await prisma.service.findUnique({
        where: { id: eventIdInt },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
      });

      if (!event) {
        return {
          success: false,
          statusCode: 404,
          message: "Event not found",
        };
      }

      // 2. Get deliverables (stock EVENTOS) - aggregated by material
      const deliverables = await this._getDeliverablesAggregated(eventIdInt);

      // 3. Get usables (stock FUNDACIÓN) - only planning
      const usables = await this._getUsablesAggregated(eventIdInt);

      return {
        success: true,
        data: {
          deliverables,
          usables,
          meta: {
            event_id: event.id,
            event_name: event.name,
            event_date: event.startDate,
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get deliverables aggregated by material (stock EVENTOS)
   * Includes: donated + manual
   */
  async _getDeliverablesAggregated(eventoId) {
    // Get all consumable materials for this event
    const materials = await prisma.eventMaterial.findMany({
      where: {
        eventoId: eventoId,
        tipo: "CONSUMIBLE",
      },
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            stockEventos: true,
            unidadMedida: true,
          },
        },
        donacion: {
          select: {
            id: true,
            code: true,
          },
        },
      },
    });

    // Aggregate by material_id
    const aggregated = {};

    materials.forEach((item) => {
      const materialId = item.materialId;

      if (!aggregated[materialId]) {
        aggregated[materialId] = {
          material_id: materialId,
          material_name: item.material.nombre,
          unit: item.material.unidadMedida || "unidad",
          stock_available: item.material.stockEventos,
          qty_donated: 0,
          qty_manual: 0,
          qty_total: 0,
          is_locked: false,
          assignments: [], // Track individual assignments for editing
        };
      }

      // Separate donated vs manual
      if (item.donacionId && item.bloqueado) {
        aggregated[materialId].qty_donated += item.cantidad;
        aggregated[materialId].is_locked = true;
      } else {
        aggregated[materialId].qty_manual += item.cantidad;
        aggregated[materialId].assignments.push({
          id: item.id,
          qty: item.cantidad,
          note: item.observaciones,
          donation_code: item.donacion?.code || null,
        });
      }

      aggregated[materialId].qty_total =
        aggregated[materialId].qty_donated + aggregated[materialId].qty_manual;
    });

    return Object.values(aggregated);
  }

  /**
   * Get usables aggregated by material (stock FUNDACIÓN)
   * Only planning, no stock deduction
   */
  async _getUsablesAggregated(eventoId) {
    const materials = await prisma.eventMaterialReusable.findMany({
      where: {
        eventoId: eventoId,
      },
      include: {
        material: {
          select: {
            id: true,
            nombre: true,
            stockFundacion: true,
            unidadMedida: true,
          },
        },
      },
    });

    return materials.map((item) => ({
      id: item.id,
      material_id: item.materialId,
      material_name: item.material.nombre,
      unit: item.material.unidadMedida || "unidad",
      stock_available: item.material.stockFundacion,
      qty_planned: item.cantidad,
      note: item.observaciones,
    }));
  }
}

export default new EventMaterialsSummaryService();
