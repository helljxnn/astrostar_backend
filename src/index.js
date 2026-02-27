// Load environment variables FIRST before any other imports
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import emailService from "./services/emailService.js";
import { startEnrollmentExpirationJob } from "./jobs/enrollmentExpirationJob.js";
import { startRSVPReminderJob } from "./jobs/rsvpReminderJob.js";

const PORT = process.env.PORT || 4000;

// Inicializar servicios
async function initializeServices() {
  try {
    // Reinicializar el servicio de email para asegurar que las variables de entorno estén cargadas
    emailService.reinitialize();

    // Verificar conexión de email (se puede omitir con EMAIL_SKIP_VERIFY_ON_START=true)
    const skipVerify =
      String(process.env.EMAIL_SKIP_VERIFY_ON_START || "true").toLowerCase() === "true";
    if (!skipVerify) {
      const emailOk = await emailService.verifyConnection();
      if (!emailOk) {
        console.warn("⚠️  Servicio de email no disponible (revisa EMAIL_USER/EMAIL_PASSWORD o conectividad SMTP).");
      }
    } else {
      console.log("✉️  Verificación de email omitida al inicio (EMAIL_SKIP_VERIFY_ON_START=true).");
    }

    // Iniciar job de vencimiento de matrÃ­culas
    startEnrollmentExpirationJob();

    // Iniciar job de recordatorios RSVP (por defecto desactivado; activa con DISABLE_RSVP_JOB=false)
    const disableRSVP = !/^(false|0|no)$/i.test(
      (process.env.DISABLE_RSVP_JOB || "true").trim(),
    );
    if (disableRSVP) {
      console.log("⏸️  Job RSVP deshabilitado por DISABLE_RSVP_JOB=true.");
    } else {
      startRSVPReminderJob();
    }
  } catch (error) {
    console.warn("âš ï¸ Error inicializando servicios:", error.message);
  }
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Accessible from network at http://192.168.20.41:${PORT}`);

  // Inicializar servicios adicionales
  await initializeServices();
});

