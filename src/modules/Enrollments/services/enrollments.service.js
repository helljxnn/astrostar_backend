import prisma from "../../../config/database.js";
import { enrollmentsRepository } from "../repository/enrollments.repository.js";
import { athletesRepository } from "../../Athletes/repository/athletes.repository.js";
import { preRegistrationsRepository } from "../../PreRegistrations/repository/preRegistrations.repository.js";
import emailService from "../../../services/emailService.js";

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

export const enrollmentsService = {
  async create({ preRegistrationId, athlete, enrollment }) {
    console.log('📝 [ENROLLMENT SERVICE] preRegistrationId recibido:', preRegistrationId);
    
    return await prisma.$transaction(async (tx) => {
      // 1. Verificar que el documento no exista
      const existingUser = await tx.user.findUnique({
        where: { identification: athlete.identification },
        select: { id: true },
      });

      if (existingUser) {
        throw new Error("Ya existe una deportista con ese documento");
      }

      // 2. Calcular edad
      const age = calculateAge(new Date(athlete.birthDate));

      // 3. Validar acudiente si es menor
      if (age < 18 && !athlete.acudiente) {
        throw new Error("Deportista menor de edad requiere acudiente");
      }

      // 4. Validar que el acudiente exista si se proporciona
      if (athlete.acudiente) {
        const guardian = await tx.guardian.findUnique({
          where: { id: parseInt(athlete.acudiente) },
          select: { id: true },
        });
        if (!guardian) {
          throw new Error("Acudiente no encontrado");
        }
      }

      // 5. Buscar o crear rol de atleta
      let athleteRole = await tx.role.findFirst({
        where: { name: 'Athlete' }
      });

      if (!athleteRole) {
        athleteRole = await tx.role.create({
          data: {
            name: 'Athlete',
            description: 'Rol de deportista',
            status: 'Active'
          }
        });
      }

      // 6. REGLA DE NEGOCIO: Usar documento de identidad como contraseña inicial
      const bcrypt = await import('bcrypt');
      const tempPassword = athlete.identification?.trim();
      const passwordHash = await bcrypt.default.hash(tempPassword, 10);

      // 7. Crear usuario
      const cleanEmail = athlete.email?.trim().toLowerCase();
      
      const newUser = await tx.user.create({
        data: {
          firstName: athlete.firstName?.trim(),
          middleName: athlete.middleName?.trim() || null,
          lastName: athlete.lastName?.trim(),
          secondLastName: athlete.secondLastName?.trim() || null,
          documentTypeId: parseInt(athlete.documentTypeId),
          identification: athlete.identification?.trim(),
          email: cleanEmail,
          phoneNumber: athlete.phoneNumber?.trim(),
          birthDate: new Date(athlete.birthDate),
          age: age,
          address: athlete.address?.trim() || 'N/A',
          passwordHash: passwordHash,
          roleId: athleteRole.id,
          status: 'Active'
        },
        include: {
          documentType: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          role: true
        },
      });

      // 8. Crear deportista (SIEMPRE Activo al crear matrícula)
      const newAthlete = await tx.athlete.create({
        data: {
          userId: newUser.id,
          status: 'Active', // Siempre activo al crear matrícula
          inactivityReason: null,
          guardianId: athlete.acudiente ? parseInt(athlete.acudiente) : null,
          relationship: athlete.parentesco || null,
          currentInscriptionStatus: 'Active'
        },
        include: {
          user: {
            include: {
              documentType: true
            }
          },
          guardian: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      });

      // 9. Crear matrícula (SIEMPRE Vigente al crear, con fecha de vencimiento a 1 año)
      const fechaInicio = enrollment?.fechaMatricula
        ? new Date(enrollment.fechaMatricula)
        : new Date();
      
      const fechaVencimiento = new Date(fechaInicio);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);

      const newEnrollment = await tx.enrollment.create({
        data: {
          athleteId: newAthlete.id,
          fechaInicio: fechaInicio,
          fechaVencimiento: fechaVencimiento,
          fechaMatricula: fechaInicio,
          estado: "Vigente", // Siempre vigente al crear
          observaciones: enrollment?.observaciones || null,
          comprobantePago: enrollment?.comprobantePago || null,
        },
      });

      // 10. Si viene de inscripción del landing, marcarla como procesada
      if (preRegistrationId) {
        console.log('✅ [ENROLLMENT SERVICE] Marcando pre-inscripción como procesada:', preRegistrationId);
        await tx.preRegistration.update({
          where: { id: preRegistrationId },
          data: { estado: "Procesada" },
        });
        console.log('✅ [ENROLLMENT SERVICE] Pre-inscripción actualizada exitosamente');
      } else {
        // Si no viene preRegistrationId, buscar por email
        console.log('⚠️  [ENROLLMENT SERVICE] No se recibió preRegistrationId, buscando por email...');
        const preRegistration = await tx.preRegistration.findFirst({
          where: {
            correo: cleanEmail,
            estado: "Pendiente"
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (preRegistration) {
          console.log('✅ [ENROLLMENT SERVICE] Pre-inscripción encontrada por email:', preRegistration.id);
          await tx.preRegistration.update({
            where: { id: preRegistration.id },
            data: { estado: "Procesada" },
          });
          console.log('✅ [ENROLLMENT SERVICE] Pre-inscripción actualizada exitosamente');
        } else {
          console.log('⚠️  [ENROLLMENT SERVICE] No se encontró pre-inscripción pendiente con ese email');
        }
      }

      // 11. REGLA DE NEGOCIO: Enviar credenciales por email
      try {
        const athleteInfo = {
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        };

        const credentials = {
          email: newUser.email,
          temporaryPassword: tempPassword
        };

        await emailService.sendAthleteWelcomeEmail(athleteInfo, credentials);
      } catch (emailError) {
        console.error('Error enviando email de bienvenida:', emailError);
        // No fallar la transacción si el email falla
      }

      return {
        athlete: newAthlete,
        enrollment: newEnrollment,
        temporaryPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
        emailSent: true
      };
    });
  },

  async findAll(filters) {
    return await enrollmentsRepository.findAll(filters);
  },

  async findById(id) {
    const enrollment = await enrollmentsRepository.findById(id);
    if (!enrollment) {
      throw new Error("Matrícula no encontrada");
    }
    return enrollment;
  },

  async findByAthleteId(athleteId) {
    return await enrollmentsRepository.findByAthleteId(athleteId);
  },

  async update(id, data) {
    await this.findById(id);
    return await enrollmentsRepository.update(id, data);
  },

  async delete(id) {
    await this.findById(id);
    return await enrollmentsRepository.delete(id);
  },

  /**
   * Verificar y procesar matrículas vencidas
   * Este método debe ejecutarse diariamente (cron job)
   */
  async processExpiredEnrollments() {
    return await prisma.$transaction(async (tx) => {
      const now = new Date();
      
      // Buscar matrículas vigentes que ya vencieron
      const expiredEnrollments = await tx.enrollment.findMany({
        where: {
          estado: 'Vigente',
          fechaVencimiento: {
            lte: now
          }
        },
        include: {
          athlete: {
            include: {
              user: true
            }
          }
        }
      });

      console.log(`🔍 Encontradas ${expiredEnrollments.length} matrículas vencidas`);

      const results = [];

      for (const enrollment of expiredEnrollments) {
        try {
          // 1. Actualizar estado de matrícula a Vencida
          await tx.enrollment.update({
            where: { id: enrollment.id },
            data: { estado: 'Vencida' }
          });

          // 2. Actualizar estado de deportista a Inactivo con razón
          await tx.athlete.update({
            where: { id: enrollment.athleteId },
            data: {
              status: 'Inactive',
              inactivityReason: 'Inactiva por vencimiento de matrícula'
            }
          });

          results.push({
            enrollmentId: enrollment.id,
            athleteId: enrollment.athleteId,
            athleteName: `${enrollment.athlete.user.firstName} ${enrollment.athlete.user.lastName}`,
            fechaVencimiento: enrollment.fechaVencimiento,
            status: 'processed'
          });

          console.log(`✅ Procesada matrícula ${enrollment.id} - Deportista: ${enrollment.athlete.user.firstName} ${enrollment.athlete.user.lastName}`);
        } catch (error) {
          console.error(`❌ Error procesando matrícula ${enrollment.id}:`, error);
          results.push({
            enrollmentId: enrollment.id,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        processed: results.filter(r => r.status === 'processed').length,
        errors: results.filter(r => r.status === 'error').length,
        details: results
      };
    });
  },

  /**
   * Renovar matrícula vencida
   * Crea una nueva matrícula y reactiva al deportista
   */
  async renewEnrollment(athleteId, enrollmentData = {}) {
    return await prisma.$transaction(async (tx) => {
      // Verificar que el deportista existe
      const athlete = await tx.athlete.findUnique({
        where: { id: parseInt(athleteId) },
        include: {
          user: true,
          enrollments: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!athlete) {
        throw new Error('Deportista no encontrado');
      }

      // Crear nueva matrícula
      const fechaInicio = enrollmentData.fechaInicio
        ? new Date(enrollmentData.fechaInicio)
        : new Date();
      
      const fechaVencimiento = new Date(fechaInicio);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);

      const newEnrollment = await tx.enrollment.create({
        data: {
          athleteId: parseInt(athleteId),
          fechaInicio: fechaInicio,
          fechaVencimiento: fechaVencimiento,
          fechaMatricula: fechaInicio,
          estado: 'Vigente',
          observaciones: enrollmentData.observaciones || 'Renovación de matrícula',
          comprobantePago: enrollmentData.comprobantePago || null
        }
      });

      // Reactivar deportista
      await tx.athlete.update({
        where: { id: parseInt(athleteId) },
        data: {
          status: 'Active',
          inactivityReason: null
        }
      });

      return {
        enrollment: newEnrollment,
        athlete: athlete
      };
    });
  },
};
