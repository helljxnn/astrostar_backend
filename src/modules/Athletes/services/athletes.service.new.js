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
    const { shouldUpdateEnrollment, emailChanged, ...athleteData } = data;

    return await prisma.$transaction(async (tx) => {
      // 1. Obtener deportista actual
      const currentAthlete = await tx.athlete.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      if (!currentAthlete) {
        throw new Error("Deportista no encontrada");
      }

      const oldEstado = currentAthlete.estado;
      const newEstado = athleteData.estado;
      const oldEmail = currentAthlete.user?.email;

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

      // 3. Si cambió el email, enviar notificación (no bloqueante)
      if (emailChanged && athleteData.email && oldEmail !== athleteData.email) {
        // Importar emailService al inicio del archivo
        const emailService = require('../../services/emailService.js').default;
        
        emailService.sendEmailUpdateNotification({
          newEmail: athleteData.email,
          oldEmail: oldEmail,
          firstName: currentAthlete.user?.firstName || athleteData.firstName,
          lastName: currentAthlete.user?.lastName || athleteData.lastName,
        }).catch((error) => {
          console.error("Error enviando correo de actualización de email:", error);
        });
      }

      // 4. Si cambió el estado y se solicita actualizar matrícula
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
              data: { estado: "Vencida" },
            });
          }
          
          // Suspender obligaciones MONTHLY pendientes
          const pendingObligations = await tx.paymentObligation.findMany({
            where: {
              athleteId: parseInt(id),
              type: 'MONTHLY',
              payments: {
                none: { status: 'APPROVED' }
              }
            }
          });
          
          const now = new Date();
          for (const obligation of pendingObligations) {
            // Calcular mora actual para congelarla
            const lateDays = Math.max(0, Math.ceil((now - new Date(obligation.dueEnd)) / (1000 * 60 * 60 * 24)));
            const lateFee = lateDays * 2000; // Usar constante de mora diaria
            
            await tx.paymentObligation.update({
              where: { id: obligation.id },
              data: {
                metadata: {
                  ...obligation.metadata,
                  suspended: true,
                  suspendedAt: now.toISOString(),
                  moraAtSuspension: lateFee
                }
              }
            });
          }
        }

        // Si cambió a Activo
        if (newEstado === "Activo" && oldEstado === "Inactivo") {
          const enrollment = await tx.enrollment.findFirst({
            where: {
              athleteId: parseInt(id),
              estado: "Vencida",
            },
            orderBy: { updatedAt: "desc" },
          });

          if (enrollment) {
            await tx.enrollment.update({
              where: { id: enrollment.id },
              data: { estado: "Vigente" },
            });
          }
          
          // Reactivar obligaciones MONTHLY suspendidas
          const suspendedObligations = await tx.paymentObligation.findMany({
            where: {
              athleteId: parseInt(id),
              type: 'MONTHLY',
              payments: {
                none: { status: 'APPROVED' }
              }
            }
          });
          
          for (const obligation of suspendedObligations) {
            if (obligation.metadata?.suspended) {
              await tx.paymentObligation.update({
                where: { id: obligation.id },
                data: {
                  metadata: {
                    ...obligation.metadata,
                    suspended: false,
                    reactivatedAt: new Date().toISOString()
                  }
                }
              });
            }
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

  /**
   * Obtener todos los deportistas para reporte (SIN PAGINACIÓN)
   */
  async findAllForReport(filters) {
    const athletes = await athletesRepository.findAllForReport(filters);
    return {
      success: true,
      data: athletes,
      message: `Se encontraron ${athletes.length} deportistas para el reporte.`,
    };
  },
};
