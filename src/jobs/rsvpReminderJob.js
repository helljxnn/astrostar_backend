import cron from "node-cron";
import prisma from "../config/database.js";
import emailService from "../services/emailService.js";

/**
 * Job para enviar recordatorios de RSVP
 * Se ejecuta cada hora y busca invitaciones que necesitan recordatorio
 */
export function startRSVPReminderJob() {
  // Ejecutar cada hora
  cron.schedule("0 * * * *", async () => {
    console.log("🔔 [RSVP Job] Ejecutando job de recordatorios RSVP...");

    try {
      const now = new Date();
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Buscar invitaciones que necesitan recordatorio
      // (eventos que empiezan en 24-25 horas)
      const invitations = await prisma.eventInvitation.findMany({
        where: {
          reminderSentAt: null,
          status: {
            in: ["PENDING", "CONFIRMED"],
          },
          expiresAt: {
            gte: in24Hours,
            lte: in25Hours,
          },
        },
        include: {
          participant: {
            include: {
              service: true,
              athlete: { include: { user: true } },
              team: true,
            },
          },
        },
      });

      console.log(
        `📬 [RSVP Job] Encontradas ${invitations.length} invitaciones para recordatorio`,
      );

      let successCount = 0;
      let errorCount = 0;

      for (const invitation of invitations) {
        try {
          const event = invitation.participant.service;
          const participant = invitation.participant;

          // Enviar recordatorio según el estado
          if (invitation.status === "PENDING") {
            await emailService.sendRSVPReminder(invitation, event, participant);
            console.log(
              `✅ [RSVP Job] Recordatorio PENDING enviado: ${invitation.recipientEmail}`,
            );
          } else if (invitation.status === "CONFIRMED") {
            await emailService.sendConfirmedEventReminder(
              invitation,
              event,
              participant,
            );
            console.log(
              `✅ [RSVP Job] Recordatorio CONFIRMED enviado: ${invitation.recipientEmail}`,
            );
          }

          // Marcar como enviado
          await prisma.eventInvitation.update({
            where: { id: invitation.id },
            data: { reminderSentAt: new Date() },
          });

          successCount++;
        } catch (error) {
          console.error(
            `❌ [RSVP Job] Error enviando recordatorio ${invitation.id}:`,
            error.message,
          );
          errorCount++;
        }
      }

      console.log(
        `✅ [RSVP Job] Job completado. Exitosos: ${successCount}, Errores: ${errorCount}`,
      );
    } catch (error) {
      console.error("❌ [RSVP Job] Error en job de recordatorios:", error);
    }
  });

  console.log(
    "✅ [RSVP Job] Job de recordatorios RSVP iniciado (ejecuta cada hora)",
  );
}
