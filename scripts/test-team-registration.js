import { RegistrationsService } from "../src/modules/Events/Registrations/registrations.service.js";

async function testTeamRegistration() {
  try {
    console.log("🧪 Probando inscripción de equipo con RSVP...\n");

    const registrationsService = new RegistrationsService();

    // Datos de prueba - ajusta estos IDs según tu BD
    const data = {
      serviceId: 5, // ID del evento - Torneo Sub 17 FMV
      teamId: 3, // ID del equipo - Manuela Vanegas Sub 17 (tiene entrenador)
      notes: "Prueba RSVP - Verificación final",
    };

    console.log("📝 Datos de inscripción:", data);
    console.log("\n🔄 Inscribiendo equipo...\n");

    const result = await registrationsService.registerTeamToEvent(data);

    if (result.success) {
      console.log("✅ Inscripción exitosa!");
      console.log("   Participant ID:", result.data.id);
      console.log("   Mensaje:", result.message);
      console.log("\n⏳ Esperando 2 segundos para que se procese el RSVP...\n");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Verificar si se creó la invitación
      const { default: prisma } = await import("../src/config/database.js");
      const invitation = await prisma.eventInvitation.findFirst({
        where: {
          participantId: result.data.id,
        },
      });

      if (invitation) {
        console.log("✅ Invitación RSVP creada!");
        console.log("   Token:", invitation.token);
        console.log("   Email:", invitation.recipientEmail);
        console.log("   Nombre:", invitation.recipientName);
        console.log("   Status:", invitation.status);
      } else {
        console.log("❌ NO se creó invitación RSVP");
      }

      await prisma.$disconnect();
    } else {
      console.log("❌ Error en inscripción:", result.message);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }
}

testTeamRegistration();
