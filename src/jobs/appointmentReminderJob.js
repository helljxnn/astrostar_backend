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
    console.log("🔔 [Appointment Reminder Job] Ejecutando job de recordatorios de citas...");

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

      console.log(`📬 [Appointment Reminder Job] Encontradas ${appointments.length} citas para mañana`);

      let successCount = 0;
      let errorCount = 0;

      for (const appointment of appointments) {
        try {
          if (!appointment.athlete?.user?.email || !appointment.specialist?.user?.email) {
            console.warn(`⚠️ [Appointment Reminder Job] Cita ${appointment.id} sin emails válidos`);
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

          console.log(`✅ [Appointment Reminder Job] Recordatorio enviado para cita ${appointment.id}`);
          successCount++;
        } catch (error) {
          console.error(`❌ [Appointment Reminder Job] Error en cita ${appointment.id}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ [Appointment Reminder Job] Completado: ${successCount} exitosos, ${errorCount} errores`);
    } catch (error) {
      console.error("❌ [Appointment Reminder Job] Error general:", error);
    }
  });

  console.log("✅ Job de recordatorios de citas iniciado (se ejecuta diariamente a las 9:00 AM)");
}

