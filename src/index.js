import app from "./app.js";
import emailService from "./services/emailService.js";

const PORT = process.env.PORT || 4000;

// Inicializar servicios
async function initializeServices() {
  try {
    // Verificar conexión de email
    await emailService.verifyConnection();
  } catch (error) {
    console.warn("⚠️ Servicio de email no disponible:", error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Inicializar servicios adicionales
  await initializeServices();
});
