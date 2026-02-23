import { formatEventDate, formatEventTime } from "../utils/dateFormatter.js";

/**
 * Genera la página HTML de respuesta RSVP
 */
export function getRSVPResponseHTML(result) {
  const { success, message, data, error } = result;

  let eventDetailsHTML = "";
  if (success && data && data.event) {
    const event = data.event;
    eventDetailsHTML = `
      <div class="event-details">
        <h2>${event.name}</h2>
        <p>📅 <strong>Fecha:</strong> ${formatEventDate(event.startDate)}</p>
        <p>🕐 <strong>Hora:</strong> ${formatEventTime(event.startTime, event.endTime)}</p>
        <p>📍 <strong>Lugar:</strong> ${event.location}</p>
      </div>
    `;
  }

  const title = success
    ? data?.status === "CONFIRMED"
      ? "¡Asistencia Confirmada!"
      : "Asistencia Declinada"
    : error === "Token inválido"
      ? "Enlace Inválido"
      : error === "Token expirado"
        ? "Enlace Expirado"
        : error === "Ya respondido"
          ? "Ya Respondiste"
          : "Error";

  const iconClass = success ? "success" : "error";
  const icon = success ? "✓" : "✗";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
      text-align: center;
      animation: slideIn 0.5s ease-out;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
      animation: scaleIn 0.5s ease-out 0.2s both;
    }
    @keyframes scaleIn {
      from {
        transform: scale(0);
      }
      to {
        transform: scale(1);
      }
    }
    .icon.success { color: #10b981; }
    .icon.error { color: #ef4444; }
    h1 {
      color: #1f2937;
      font-size: 28px;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .event-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: left;
    }
    .event-details h2 {
      color: #667eea;
      font-size: 20px;
      margin-bottom: 12px;
    }
    .event-details p {
      margin-bottom: 8px;
      color: #4b5563;
    }
    .reminder-note {
      font-size: 14px;
      color: #9ca3af;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon ${iconClass}">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    
    ${eventDetailsHTML}
    
    ${
      success && data?.status === "CONFIRMED"
        ? `
      <p class="reminder-note">
        Recibirás un recordatorio 24 horas antes del evento.
      </p>
    `
        : ""
    }
    
    ${
      !success
        ? `
      <p class="reminder-note">
        Si crees que esto es un error, contacta a la organización del evento.
      </p>
    `
        : ""
    }
  </div>
</body>
</html>
  `;
}
