import prisma from "../../../config/database.js";
import { enrollmentsRepository } from "../repository/enrollments.repository.js";
import { athletesRepository } from "../../Athletes/repository/athletes.repository.js";
import { preRegistrationsRepository } from "../../PreRegistrations/repository/preRegistrations.repository.js";

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

      // 6. Generar contraseña temporal
      const bcrypt = await import('bcrypt');
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.default.hash(tempPassword, 10);

      // 7. Crear usuario
      const newUser = await tx.user.create({
        data: {
          firstName: athlete.firstName,
          middleName: athlete.middleName || null,
          lastName: athlete.lastName,
          secondLastName: athlete.secondLastName || null,
          documentTypeId: parseInt(athlete.documentTypeId),
          identification: athlete.identification,
          email: athlete.email,
          phoneNumber: athlete.phoneNumber,
          birthDate: new Date(athlete.birthDate),
          age: age,
          address: athlete.address || 'N/A',
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

      // 8. Crear deportista
      const newAthlete = await tx.athlete.create({
        data: {
          userId: newUser.id,
          status: athlete.estado === 'Activo' ? 'Active' : 'Inactive',
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

      // 9. Crear matrícula
      const newEnrollment = await tx.enrollment.create({
        data: {
          athleteId: newAthlete.id,
          fechaMatricula: enrollment?.fechaMatricula
            ? new Date(enrollment.fechaMatricula)
            : new Date(),
          estado: "Vigente",
          observaciones: enrollment?.observaciones || null,
          comprobantePago: enrollment?.comprobantePago || null,
        },
      });

      // 10. Si viene de inscripción del landing, marcarla como procesada
      if (preRegistrationId) {
        await tx.preRegistration.update({
          where: { id: preRegistrationId },
          data: { estado: "Procesada" },
        });
      }

      return {
        athlete: newAthlete,
        enrollment: newEnrollment,
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
};
