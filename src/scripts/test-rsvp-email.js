/**
 * Script de prueba para verificar el envío de invitaciones RSVP
 * Ejecutar con: node src/scripts/test-rsvp-email.js
 */

import dotenv from "dotenv";
import emailService from "../services/emailService.js";

// Cargar variables de entorno
dotenv.config();

async function testRSVPEmail() {
  console.log("🧪 Iniciando prueba de envío de invitaciones RSVP...\n");

  // Verificar configuración de email
  console.log("📧 Verificando configuración de email...");
  const isConfigured = await emailService.verifyConnection();

  if (!isConfigured) {
    console.error("❌ El servicio de email no está configurado correctamente.");
    console.log(
      "Verifica las variables de entorno EMAIL_USER y EMAIL_PASSWORD en el archivo .env",
    );
    process.exit(1);
  }

  console.log("✅ Servicio de email configurado correctamente\n");

  // Datos de prueba
  const testInvitation = {
    id: 1,
    token: "test-token-123456",
    recipientEmail: process.env.EMAIL_USER, // Enviar a ti mismo para prueba
    recipientName: "Usuario de Prueba",
    invitationType: "INDIVIDUAL",
    status: "PENDING",
  };

  const testEvent = {
    id: 1,
    name: "Torneo de Fútbol Juvenil",
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // En 7 días
    startTime: "10:00",
    endTime: "12:00",
    location: "Estadio AstroStar",
  };

  const testParticipant = {
    type: "Individual",
    athlete: {
      user: {
        firstName: "Juan",
        lastName: "Pérez",
      },
    },
    team: null,
  };

  // Generar contenido ICS simple para prueba
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AstroStar//RSVP//ES
BEGIN:VEVENT
UID:test-event-${Date.now()}@astrostar.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${testEvent.startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:${testEvent.name}
DESCRIPTION:Evento de prueba
LOCATION:${testEvent.location}
END:VEVENT
END:VCALENDAR`;

  console.log("📤 Enviando invitación RSVP de prueba...");
  console.log(`   Destinatario: ${testInvitation.recipientEmail}`);
  console.log(`   Evento: ${testEvent.name}`);
  console.log(`   Fecha: ${testEvent.startDate.toLocaleDateString("es-CO")}\n`);

  try {
    const result = await emailService.sendRSVPInvitation(
      testInvitation,
      testEvent,
      testParticipant,
      icsContent,
    );

    if (result.success) {
      console.log("✅ ¡Invitación enviada exitosamente!");
      console.log(`   Message ID: ${result.messageId}`);
      if (result.simulated) {
        console.log("   ⚠️  Nota: Email enviado en modo simulación");
      }
      console.log("\n📬 Revisa tu bandeja de entrada para verificar el email.");
    } else {
      console.error("❌ Error al enviar la invitación:");
      console.error(`   ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error inesperado:", error.message);
    console.error(error.stack);
    process.exit(1);
  }

  console.log("\n✅ Prueba completada exitosamente");
}

// Ejecutar prueba
testRSVPEmail().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});

