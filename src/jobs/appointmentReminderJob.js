import cron from "node-cron";
import prisma from "../config/database.js";
import appointmentEmailService from "../modules/Services/AppointmentManagement/services/AppointmentEmail.service.js";

/**
 * Job para enviar recordatorios de citas
 * Se ejecuta diariamente a las 9:00 AM y envía recordatorios para citas del día siguiente
 */
export function startAppointmentReminderJob() {
  // Ejecutar todos los días a las 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("[Appointment Reminder Job] Running appointment reminders job...");

    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Buscar citas programadas para mañana
      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'Programado',
          appointmentDate: {
            gte: tomorrow,
            lt: dayAfterTomorrow
          }
        },
        include: {
          athlete: {
            include: {
              user: true
            }
          },
          specialist: {
            include: {
              user: true
            }
          }
        }
      });

      console.log(`[Appointment Reminder Job] Found ${appointments.length} appointments for tomorrow`);

      let successCount = 0;
      let errorCount = 0;

      for (const appointment of appointments) {
        try {
          if (!appointment.athlete?.user?.email || !appointment.specialist?.user?.email) {
            console.warn(`[Appointment Reminder Job] Appointment ${appointment.id} has missing valid emails`);
            errorCount++;
            continue;
          }

          const athleteName = `${appointment.athlete.nombres} ${appointment.athlete.apellidos}`;
          const specialistName = `${appointment.specialist.nombres} ${appointment.specialist.apellidos}`;

          await appointmentEmailService.sendAppointmentReminder(
            appointment,
            appointment.athlete.user.email,
            athleteName,
            appointment.specialist.user.email,
            specialistName
          );

          console.log(`[Appointment Reminder Job] Reminder sent for appointment ${appointment.id}`);
          successCount++;
        } catch (error) {
          console.error(`[Appointment Reminder Job] Error for appointment ${appointment.id}:`, error.message);
          errorCount++;
        }
      }

      console.log(`[Appointment Reminder Job] Completed: ${successCount} success, ${errorCount} errors`);
    } catch (error) {
      console.error("[Appointment Reminder Job] General error:", error);
    }
  });

  console.log("[Appointment Reminder Job] Started (daily at 09:00).");
}

