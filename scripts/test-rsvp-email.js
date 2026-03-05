/**
 * Script para probar el envío de emails RSVP
 *
 * Uso:
 * node scripts/test-rsvp-email.js <participantId>
 *
 * Ejemplo:
 * node scripts/test-rsvp-email.js 1
 */

import prisma from "../src/config/database.js";
import { RSVPService } from "../src/modules/Events/RSVP/rsvp.service.js";

async function testRSVPEmail() {
  try {
    const participantId = parseInt(process.argv[2]);

    if (!participantId) {
      console.error("❌ Error: Debes proporcionar un participantId");
      console.log("Uso: node scripts/test-rsvp-email.js <participantId>");
      process.exit(1);
    }

    console.log(`\n🔍 Buscando participante ${participantId}...`);

    // Verificar que el participante existe
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        service: true,
        athlete: { include: { user: true } },
        team: {
          include: {
            members: {
              where: {
                employeeId: { not: null },
                isActive: true,
              },
              include: {
                employee: { include: { user: true } },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      console.error(
        `❌ No se encontró el participante con ID ${participantId}`,
      );
      process.exit(1);
    }

    console.log(`✅ Participante encontrado:`);
    console.log(`   - Tipo: ${participant.type}`);
    console.log(`   - Evento: ${participant.service.name}`);

    if (participant.type === "Team") {
      console.log(`   - Equipo: ${participant.team.name}`);
      console.log(
        `   - Entrenador: ${participant.team.members.length > 0 ? participant.team.members[0].employee.user.firstName + " " + participant.team.members[0].employee.user.lastName : "Sin asignar"}`,
      );

      if (participant.team.members.length === 0) {
        console.error(`\n❌ ERROR: El equipo no tiene un entrenador asignado`);
        console.log(`   Para asignar un entrenador, usa:`);
        console.log(
          `   node scripts/assign-coach-to-team.js ${participant.team.id} <employeeId>`,
        );
        process.exit(1);
      }
    } else {
      console.log(
        `   - Deportista: ${participant.athlete.user.firstName} ${participant.athlete.user.lastName}`,
      );
      console.log(`   - Email: ${participant.athlete.user.email}`);
    }

    // Verificar si ya existe una invitación
    const existingInvitation = await prisma.eventInvitation.findFirst({
      where: { participantId },
      orderBy: { createdAt: "desc" },
    });

    if (existingInvitation) {
      console.log(`\n⚠️  Ya existe una invitación para este participante:`);
      console.log(`   - Estado: ${existingInvitation.status}`);
      console.log(`   - Email: ${existingInvitation.recipientEmail}`);
      console.log(`   - Enviado: ${existingInvitation.sentAt}`);

      if (existingInvitation.respondedAt) {
        console.log(`   - Respondido: ${existingInvitation.respondedAt}`);
      }

      console.log(`\n¿Deseas reenviar la invitación? (Se creará una nueva)`);
    }

    console.log(`\n📧 Enviando invitación RSVP...`);

    const rsvpService = new RSVPService();
    const result = await rsvpService.createAndSendInvitation(participantId);

    if (result.success) {
      console.log(`\n✅ ¡Invitación enviada exitosamente!`);
      console.log(`   - ID de invitación: ${result.data.invitationId}`);
      console.log(`   - Email destinatario: ${result.data.recipientEmail}`);
      console.log(`   - Token: ${result.data.token}`);
      console.log(`   - Expira: ${result.data.expiresAt}`);

      console.log(`\n🔗 URLs de prueba:`);
      const baseUrl =
        process.env.BACKEND_URL ||
        process.env.FRONTEND_URL ||
        "http://localhost:4000";
      console.log(
        `   Confirmar: ${baseUrl}/api/rsvp?token=${result.data.token}&action=confirm`,
      );
      console.log(
        `   Declinar: ${baseUrl}/api/rsvp?token=${result.data.token}&action=decline`,
      );

      console.log(
        `\n💡 Revisa tu bandeja de entrada en: ${result.data.recipientEmail}`,
      );
    } else {
      console.error(`\n❌ Error al enviar invitación:`);
      console.error(`   ${result.message}`);

      if (result.message.includes("entrenador")) {
        console.log(`\n💡 Solución: Asigna un entrenador al equipo primero`);
        console.log(
          `   node scripts/assign-coach-to-team.js ${participant.team.id} <employeeId>`,
        );
      }
    }
  } catch (error) {
    console.error(`\n❌ Error inesperado:`, error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testRSVPEmail();
