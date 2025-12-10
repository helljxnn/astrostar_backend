import prisma from "../../../config/database.js";
import { athletesRepository } from "../repository/athletes.repository.new.js";
import { enrollmentsRepository } from "../../Enrollments/repository/enrollments.repository.js";

export const athletesService = {
  async findAll(filters) {
    return await athletesRepository.findAll(filters);
  },

  async findById(id) {
    const athlete = await athletesRepository.findById(id);
    if (!athlete) {
      throw new Error("Deportista no encontrada");
    }
    return athlete;
  },

  async update(id, data) {
    const { shouldUpdateEnrollment, ...athleteData } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Obtener deportista actual
      const currentAthlete = await tx.athlete.findUnique({
        where: { id: parseInt(id) },
      });

      if (!currentAthlete) {
        throw new Error("Deportista no encontrada");
      }

      const oldEstado = currentAthlete.estado;
      const newEstado = athleteData.estado;

      // 2. Actualizar deportista
      const updatedAthlete = await tx.athlete.update({
        where: { id: parseInt(id) },
        data: athleteData,
        include: {
          documentType: true,
          guardian: true,
          enrollments: {
            orderBy: { createdAt: "desc" },
          },
        },
      });

      // 3. Si cambió el estado y se solicita actualizar matrícula
      if (shouldUpdateEnrollment && oldEstado !== newEstado) {
        // Si cambió a Inactivo
        if (newEstado === "Inactivo" && oldEstado === "Activo") {
          const enrollment = await tx.enrollment.findFirst({
            where: {
              athleteId: parseInt(id),
              estado: "Vigente",
            },
          });

          if (enrollment) {
            await tx.enrollment.update({
              where: { id: enrollment.id },
              data: { estado: "Suspendida" },
            });
          }
        }

        // Si cambió a Activo
        if (newEstado === "Activo" && oldEstado === "Inactivo") {
          const enrollment = await tx.enrollment.findFirst({
            where: {
              athleteId: parseInt(id),
              estado: "Suspendida",
            },
            orderBy: { updatedAt: "desc" },
          });

          if (enrollment) {
            await tx.enrollment.update({
              where: { id: enrollment.id },
              data: { estado: "Vigente" },
            });
          }
        }
      }

      return updatedAthlete;
    });
  },

  async delete(id) {
    await this.findById(id);
    return await athletesRepository.delete(id);
  },

  async getStats() {
    return await athletesRepository.getStats();
  },
};
