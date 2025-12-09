import app from "./app.js";
import emailService from "./services/emailService.js";
import { startEnrollmentExpirationJob } from "./jobs/enrollmentExpirationJob.js";

const PORT = process.env.PORT || 4000;

// Inicializar servicios
async function initializeServices() {
  try {
    // Verificar conexión de email
    await emailService.verifyConnection();
    
    // Iniciar job de vencimiento de matrículas
    startEnrollmentExpirationJob();
  } catch (error) {
    console.warn("⚠️ Error inicializando servicios:", error.message);
  }
}

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Accessible from network at http://192.168.0.4:${PORT}`);
  
  // Inicializar servicios adicionales
  await initializeServices();
});
