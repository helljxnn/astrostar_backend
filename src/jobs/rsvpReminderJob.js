import cron from "node-cron";
import prisma from "../config/database.js";
import eventEmailService from "../modules/Events/services/EventEmailService.js";

/**
 * Job para enviar recordatorios de RSVP
 * Se ejecuta cada hora y busca invitaciones que necesitan recordatorio
 */
export function startRSVPReminderJob() {
  // Ejecutar cada hora
  cron.schedule("0 * * * *", async () => {
    console.log("[RSVP Job] Running RSVP reminder job...");

    try {
      // Comprobar existencia de la tabla para evitar P2021
      const [{ exists }] = await prisma.$queryRaw`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'event_invitations'
        ) AS exists
      `;

      if (!exists) {
        console.warn(
          "[RSVP Job] event_invitations table does not exist. Skipping job. Run migrations if RSVP is required.",
        );
        return;
      }

      if (!prisma?.eventInvitation?.findMany) {
        console.warn(
          "[RSVP Job] Prisma client has no eventInvitation model. Run `npm run prisma:generate` (after stopping backend).",
        );
        return;
      }

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
        `[RSVP Job] Found ${invitations.length} invitations for reminder`,
      );

      let successCount = 0;
      let errorCount = 0;

      for (const invitation of invitations) {
        try {
          const event = invitation.participant.service;
          const participant = invitation.participant;

          // Enviar recordatorio según el estado
          if (invitation.status === "PENDING") {
            await eventEmailService.sendRSVPReminder(
              invitation,
              event,
              participant,
            );
            console.log(
              `[RSVP Job] Sent PENDING reminder: ${invitation.recipientEmail}`,
            );
          } else if (invitation.status === "CONFIRMED") {
            await eventEmailService.sendConfirmedEventReminder(
              invitation,
              event,
              participant,
            );
            console.log(
              `[RSVP Job] Sent CONFIRMED reminder: ${invitation.recipientEmail}`,
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
            `[RSVP Job] Error sending reminder ${invitation.id}:`,
            error.message,
          );
          errorCount++;
        }
      }

      console.log(
        `[RSVP Job] Job completed. Success: ${successCount}, Errors: ${errorCount}`,
      );
    } catch (error) {
      console.error("[RSVP Job] Error in reminder job:", error);
    }
  });

  console.log(
    "[RSVP Job] RSVP reminder job started (runs every hour)",
  );
}

