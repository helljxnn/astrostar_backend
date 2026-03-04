import prisma from "../src/config/database.js";

async function testRSVP() {
  try {
    console.log("🔍 Verificando configuración RSVP...\n");

    // 1. Verificar que hay equipos con entrenadores
    const teamsWithCoaches = await prisma.team.findMany({
      where: {
        status: "Active",
        members: {
          some: {
            employeeId: { not: null },
            isActive: true,
          },
        },
      },
      include: {
        members: {
          where: {
            employeeId: { not: null },
            isActive: true,
          },
          include: {
            employee: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      take: 3,
    });

    console.log(`✅ Equipos con entrenadores: ${teamsWithCoaches.length}`);
    teamsWithCoaches.forEach((team) => {
      const coach = team.members[0];
      if (coach) {
        console.log(
          `   - ${team.name}: ${coach.employee.user.firstName} ${coach.employee.user.lastName} (${coach.employee.user.email})`,
        );
      }
    });

    // 2. Verificar invitaciones creadas
    const invitations = await prisma.eventInvitation.findMany({
      include: {
        participant: {
          include: {
            service: true,
            team: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    console.log(`\n✅ Invitaciones RSVP creadas: ${invitations.length}`);
    invitations.forEach((inv) => {
      console.log(
        `   - ${inv.invitationType}: ${inv.recipientName} (${inv.recipientEmail})`,
      );
      console.log(`     Status: ${inv.status}, Enviado: ${inv.sentAt}`);
      console.log(`     Evento: ${inv.participant.service.name}`);
    });

    // 3. Verificar última inscripción de equipo
    const lastTeamParticipant = await prisma.participant.findFirst({
      where: {
        type: "Team",
      },
      include: {
        service: true,
        team: {
          include: {
            members: {
              where: {
                employeeId: { not: null },
                isActive: true,
              },
              include: {
                employee: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        eventInvitations: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (lastTeamParticipant) {
      console.log(`\n✅ Última inscripción de equipo:`);
      console.log(`   Equipo: ${lastTeamParticipant.team.name}`);
      console.log(`   Evento: ${lastTeamParticipant.service.name}`);
      console.log(`   Fecha inscripción: ${lastTeamParticipant.createdAt}`);

      const coach = lastTeamParticipant.team.members[0];
      if (coach) {
        console.log(
          `   Entrenador: ${coach.employee.user.firstName} ${coach.employee.user.lastName}`,
        );
        console.log(`   Email entrenador: ${coach.employee.user.email}`);
      } else {
        console.log(`   ⚠️  NO TIENE ENTRENADOR ASIGNADO`);
      }

      console.log(
        `   Invitaciones RSVP: ${lastTeamParticipant.eventInvitations.length}`,
      );
      if (lastTeamParticipant.eventInvitations.length > 0) {
        lastTeamParticipant.eventInvitations.forEach((inv) => {
          console.log(
            `     - Status: ${inv.status}, Email: ${inv.recipientEmail}`,
          );
        });
      } else {
        console.log(`   ⚠️  NO SE CREÓ INVITACIÓN RSVP`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testRSVP();
