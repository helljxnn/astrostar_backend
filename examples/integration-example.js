/**
 * Ejemplo de integración de las rutas de correos de citas
 * Agregar esto a tu archivo principal de rutas (app.js o server.js)
 */

// En tu archivo principal (app.js o server.js)
import appointmentEmailRoutes from './src/routes/appointmentEmailRoutes.js';

// Agregar las rutas
app.use('/api/appointments', appointmentEmailRoutes);

/**
 * EJEMPLOS DE USO CON CURL:
 */

// 1. Enviar correo con calendario integrado (RECOMENDADO)
const curlCalendarExample = `
curl -X POST http://localhost:3000/api/appointments/send-calendar-email \\
  -H "Content-Type: application/json" \\
  -d '{
    "athleteEmail": "val.arboleda@example.com",
    "athleteName": "Val Arboleda",
    "date": "2026-03-01",
    "startTime": "09:45",
    "endTime": "10:15",
    "specialistName": "Juliana Cano",
    "description": "Cita de seguimiento deportivo"
  }'
`;

// 2. Enviar notificación simple (método original)
const curlNotificationExample = `
curl -X POST http://localhost:3000/api/appointments/send-notification \\
  -H "Content-Type: application/json" \\
  -d '{
    "athleteEmail": "val.arboleda@example.com",
    "athleteName": "Val Arboleda",
    "date": "2026-03-01",
    "time": "09:45 - 10:15",
    "specialistName": "Juliana Cano"
  }'
`;

/**
 * EJEMPLO DE USO EN JAVASCRIPT (Frontend o Backend)
 */

// Función para enviar correo de cita con calendario
async function sendAppointmentCalendarEmail(appointmentData) {
  try {
    const response = await fetch('/api/appointments/send-calendar-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        athleteEmail: 'val.arboleda@example.com',
        athleteName: 'Val Arboleda',
        date: '2026-03-01',
        startTime: '09:45',
        endTime: '10:15',
        specialistName: 'Juliana Cano',
        description: 'Cita de seguimiento deportivo'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Correo enviado exitosamente');
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Error:', result.message);
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
  }
}

/**
 * RESPUESTA ESPERADA:
 * {
 *   "success": true,
 *   "message": "Correo de cita enviado exitosamente",
 *   "messageId": "unique-message-id",
 *   "simulated": false
 * }
 */

console.log('Ejemplo de curl para calendario:', curlCalendarExample);
console.log('Ejemplo de curl para notificación:', curlNotificationExample);