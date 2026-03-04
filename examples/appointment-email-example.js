/**
 * Ejemplo de uso del servicio de email para citas con calendario
 * Basado en el correo: "Se programó una cita para el 2026-03-01 a las 09:45 - 10:15 con juliana Cano"
 */

import emailService from '../src/services/emailService.js';

// Ejemplo de datos de la cita (usando tu ejemplo)
const appointmentData = {
  date: '2026-03-01', // Fecha de la cita
  startTime: '09:45', // Hora de inicio
  endTime: '10:15',   // Hora de fin
  specialistName: 'Juliana Cano', // Nombre del especialista
  description: 'Por favor ingresa al módulo de citas para más detalles' // Descripción
};

// Datos del deportista
const athleteData = {
  email: 'val.arboleda@example.com',
  name: 'Val Arboleda'
};

// Función para enviar el correo de cita
async function sendAppointmentEmail() {
  try {
    const result = await emailService.sendAppointmentCalendarEmail({
      to: athleteData.email,
      athleteName: athleteData.name,
      appointmentData: appointmentData
    });

    if (result.success) {
      console.log('✅ Correo de cita enviado exitosamente');
      console.log('📧 Message ID:', result.messageId);
      console.log('🎯 El correo ahora tiene el mismo estilo que los otros correos de AstroStar');
    } else {
      console.log('❌ Error enviando correo:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar el ejemplo
sendAppointmentEmail();

/**
 * CORRECCIONES APLICADAS:
 * 
 * ✅ Mismo estilo visual que otros correos de AstroStar
 *    - Header con gradiente azul-morado (#667eea a #764ba2)
 *    - Contenido con fondo gris claro (#f9f9f9)
 *    - Cajas blancas con borde azul para información importante
 *    - Items con fondo azul claro (#f0f4ff)
 *    - Footer consistente con otros correos
 * 
 * ✅ Estructura HTML corregida
 *    - Métodos dentro de la clase EmailService
 *    - Sin errores de sintaxis
 *    - Template literals correctamente formateados
 * 
 * ✅ Funcionalidad de calendario mantenida
 *    - Enlace directo a Google Calendar
 *    - Archivo .ics adjunto
 *    - Recordatorios automáticos
 * 
 * ✅ Contenido en español y profesional
 *    - Mismo tono que otros correos del sistema
 *    - Información clara y organizada
 *    - Instrucciones específicas para el deportista
 */