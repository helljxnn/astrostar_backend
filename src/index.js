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

    // Verificar conexión de email
    await emailService.verifyConnection();

    // Iniciar job de vencimiento de matrículas
    startEnrollmentExpirationJob();

    // Iniciar job de recordatorios RSVP
    startRSVPReminderJob();
  } catch (error) {
    console.warn("⚠️ Error inicializando servicios:", error.message);
  }
}

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Accessible from network at http://192.168.0.4:${PORT}`);

  // Inicializar servicios adicionales
  await initializeServices();
});
