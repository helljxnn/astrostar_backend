import app from './app.js';
import emailService from './services/emailService.js';

const PORT = process.env.PORT || 4000;

// Inicializar servicios
async function initializeServices() {
  try {
    // Verificar conexión de email
    await emailService.verifyConnection();
  } catch (error) {
    console.warn('⚠️ Servicio de email no disponible:', error.message);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  
  // Inicializar servicios adicionales
  await initializeServices();
});