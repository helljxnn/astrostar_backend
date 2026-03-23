// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
import os from "os";
dotenv.config({ quiet: true });

import app from "./app.js";
import emailService from "./services/emailService.js";
import { startEnrollmentExpirationJob } from "./jobs/enrollmentExpirationJob.js";
import { startRSVPReminderJob } from "./jobs/rsvpReminderJob.js";
import { startAppointmentReminderJob } from "./jobs/appointmentReminderJob.js";
import { startRateLimitCleanupJob } from "./jobs/rateLimitCleanupJob.js";
import { initializePaymentJobs } from "./jobs/generateMonthlyPayments.js";

const PORT = process.env.PORT || 4000;

function getNetworkUrls(port) {
  const interfaces = os.networkInterfaces();
  const urls = [];

  for (const addresses of Object.values(interfaces)) {
    if (!addresses) continue;

    for (const address of addresses) {
      if (address.family === "IPv4" && !address.internal) {
        urls.push(`http://${address.address}:${port}`);
      }
    }
  }

  return urls;
}

// Inicializar servicios
async function initializeServices() {
  try {
    // Reinicializar el servicio de email para asegurar que las variables de entorno esten cargadas
    emailService.reinitialize();

    // Verificar conexion de email (se puede omitir con EMAIL_SKIP_VERIFY_ON_START=true)
    const skipVerify =
      String(process.env.EMAIL_SKIP_VERIFY_ON_START || "true").toLowerCase() ===
      "true";
    if (!skipVerify) {
      const emailOk = await emailService.verifyConnection();
      if (!emailOk) {
        console.warn(
          "Servicio de email no disponible (revisa EMAIL_USER/EMAIL_PASSWORD o conectividad SMTP).",
        );
      }
    } else {
      console.log(
        "Verificacion de email omitida al inicio (EMAIL_SKIP_VERIFY_ON_START=true).",
      );
    }

    // Iniciar job de vencimiento de matriculas
    startEnrollmentExpirationJob();

    // Iniciar job de recordatorios RSVP (por defecto desactivado; activa con DISABLE_RSVP_JOB=false)
    const disableRSVP = !/^(false|0|no)$/i.test(
      (process.env.DISABLE_RSVP_JOB || "true").trim(),
    );
    if (disableRSVP) {
      console.log("Job RSVP deshabilitado por DISABLE_RSVP_JOB=true.");
    } else {
      startRSVPReminderJob();
    }

    // Iniciar job de recordatorios de citas
    startAppointmentReminderJob();

    // Iniciar job de limpieza de rate limiting
    startRateLimitCleanupJob();

    // Iniciar jobs de gestion de pagos
    initializePaymentJobs();
  } catch (error) {
    console.warn("Error inicializando servicios:", error.message);
  }
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Server running on port ${PORT}`);

  const networkUrls = getNetworkUrls(PORT);
  if (networkUrls.length > 0) {
    console.log("Accessible from network:");
    for (const url of networkUrls) {
      console.log(`- ${url}`);
    }
  } else {
    console.log("No external IPv4 addresses detected.");
  }

  // Inicializar servicios adicionales
  await initializeServices();
});
