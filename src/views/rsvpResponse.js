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
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    /* Fondo con imagen + blur (igual que login) */
    body::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url('/public/assets/images/loginB.jpg');
      background-size: cover;
      background-position: center;
      z-index: -2;
    }
    body::after {
      content: "";
      position: absolute;
      inset: 0;
      backdrop-filter: blur(2px);
      background: rgba(0, 0, 0, 0.2);
      z-index: -1;
    }
    .container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(102, 126, 234, 0.2);
      max-width: 550px;
      width: 100%;
      padding: 48px;
      text-align: center;
      animation: slideIn 0.6s ease-out;
      border: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .icon {
      font-size: 80px;
      margin-bottom: 24px;
      animation: scaleIn 0.6s ease-out 0.2s both;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    }
    @keyframes scaleIn {
      from {
        transform: scale(0) rotate(-180deg);
      }
      to {
        transform: scale(1) rotate(0deg);
      }
    }
    .icon.success { color: #10b981; }
    .icon.error { color: #ef4444; }
    h1 {
      background: linear-gradient(135deg, #000000 0%, #667eea 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }
    p {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.7;
      margin-bottom: 24px;
    }
    .event-details {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 16px;
      padding: 24px;
      margin: 28px 0;
      text-align: left;
      border: 1px solid rgba(102, 126, 234, 0.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
    .event-details h2 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .event-details p {
      margin-bottom: 10px;
      color: #374151;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .event-details p:last-child {
      margin-bottom: 0;
    }
    .reminder-note {
      font-size: 14px;
      color: #6b7280;
      margin-top: 24px;
      padding: 12px;
      background: rgba(102, 126, 234, 0.05);
      border-radius: 8px;
      border-left: 3px solid #667eea;
    }
    /* Responsive */
    @media (max-width: 640px) {
      .container {
        padding: 32px 24px;
      }
      h1 {
        font-size: 26px;
      }
      .icon {
        font-size: 64px;
      }
      .event-details {
        padding: 20px;
      }
      .event-details h2 {
        font-size: 20px;
      }
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

