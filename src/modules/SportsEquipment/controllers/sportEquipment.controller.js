import prisma from "../../../config/database.js";

export class SportsEquipment {
  // 1. Crear Material Deportivo (solo nombre)
  Create = async (req, res) => {
    try {
      const { name } = req.body;

      if (!name || name.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Por favor, proporcione el nombre del material deportivo.",
        });
      }

      const newEquipment = await prisma.sportsEquipment.create({
        data: {
          name: name.trim(),
          // El estado por defecto será 'Disponible' según el schema.prisma
        },
      });

      res.status(201).json({
        success: true,
        message: "Material deportivo creado exitosamente.",
        data: newEquipment,
      });
    } catch (error) {
      console.error("Error al crear material deportivo:", error);
      if (error.code === "P2002") {
        return res.status(400).json({
          success: false,
          message: `El material deportivo con el nombre "${req.body.name}" ya existe.`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error interno del servidor. Por favor, inténtelo de nuevo.",
      });
    }
  };

  // 2. Obtener un Material Deportivo por ID
  GetById = async (req, res) => {
    try {
      const { id } = req.params;
      const equipment = await prisma.sportsEquipment.findUnique({
        where: { id: parseInt(id) },
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `No se encontró material deportivo con el ID ${id}.`,
        });
      }

      res.status(200).json({
        success: true,
        message: "Material deportivo encontrado.",
        data: equipment,
      });
    } catch (error) {
      console.error("Error al obtener material deportivo por ID:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
      });
    }
  };

  // 3. Obtener Todos los Materiales (con paginación y búsqueda)
  GetAll = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = "" } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { state: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [equipments, total] = await prisma.$transaction([
        prisma.sportsEquipment.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { id: "desc" },
        }),
        prisma.sportsEquipment.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        message: `Se encontraron ${equipments.length} de ${total} materiales deportivos.`,
        data: equipments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error al obtener todos los materiales deportivos:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
      });
    }
  };

  // 4. Actualizar Material Deportivo (nombre y estado)
  Update = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, state } = req.body;

      const updatedEquipment = await prisma.sportsEquipment.update({
        where: { id: parseInt(id) },
        data: {
          name: name ? name.trim() : undefined,
          state: state,
        },
      });

      res.status(200).json({
        success: true,
        message: "Material deportivo actualizado exitosamente.",
        data: updatedEquipment,
      });
    } catch (error) {
      console.error("Error al actualizar material deportivo:", error);
      if (error.code === "P2025") {
        // Prisma error for record not found
        return res.status(404).json({
          success: false,
          message: `No se encontró material deportivo con el ID ${req.params.id}.`,
        });
      }
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
      });
    }
  };

  // 5. Eliminar Material Deportivo (con validación de relaciones)
  Delete = async (req, res) => {
    try {
      const { id } = req.params;

      const equipment = await prisma.sportsEquipment.findUnique({
        where: { id: parseInt(id) },
        include: { purchases_item: true }, // Cambia 'purchaseDetails' si es necesario
      });

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: `No se encontró material deportivo con el ID ${id}.`,
        });
      }

      // Validación de la relación
      if (equipment.purchaseDetails && equipment.purchaseDetails.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "No se puede eliminar este material deportivo porque está asociado a registros de compras. Elimine primero esas asociaciones.",
        });
      }

      await prisma.sportsEquipment.delete({
        where: { id: parseInt(id) },
      });

      res.status(200).json({
        success: true,
        message: "Material deportivo eliminado exitosamente.",
      });
    } catch (error) {
      console.error("Error al eliminar material deportivo:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor.",
      });
    }
  };
}
