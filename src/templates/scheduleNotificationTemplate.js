function safeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).replace(/\s+/g, " ").trim();
  if (!text || /^(undefined|null|nan)$/i.test(text)) return fallback;
  return text;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Template de correo para notificaciones de horarios
 */
export function generateScheduleNotificationHTML(data) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const displayEmployeeName = escapeHtml(
    safeText(data.employeeName, "Colaborador"),
  );
  const displayActionTitle = escapeHtml(
    safeText(data.actionTitle, "Actualización de horario"),
  );
  const displayScheduleDate = escapeHtml(
    safeText(data.scheduleDate, "Fecha por confirmar"),
  );
  const displayTimeRange = escapeHtml(
    safeText(data.timeRange, "Horario por confirmar"),
  );
  const displayRecurrenceLabel = escapeHtml(
    safeText(data.recurrenceLabel, "Sin repetición"),
  );
  const displayDescription = escapeHtml(safeText(data.description));
  const hasDescription = Boolean(displayDescription);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayActionTitle} - AstroStar</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 640px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 28px; text-align: center; border-radius: 12px 12px 0 0; }
    .content { background: #f8f9fb; padding: 28px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .badge { display: inline-block; padding: 6px 12px; background: #e5e7ff; color: #4c51bf; border-radius: 999px; font-weight: 600; font-size: 13px; letter-spacing: 0.3px; }
    .card { background: white; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; margin: 18px 0; }
    .card h3 { margin: 0 0 8px 0; color: #111827; }
    .detail { margin: 6px 0; font-size: 14px; color: #374151; }
    .highlight { color: #4c51bf; font-weight: 700; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 22px; text-decoration: none; border-radius: 8px; margin-top: 18px; font-weight: 600; }
    .footer { text-align: center; margin-top: 18px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${displayActionTitle}</div>
      <h1 style="margin: 10px 0 0 0;">Horario de trabajo</h1>
      <p style="margin: 8px 0 0 0; opacity: .9;">AstroStar - Sistema de Gestión</p>
    </div>
    <div class="content">
      <p>Hola <strong>${displayEmployeeName}</strong>,</p>
      <p>Tu horario ha sido <strong>${displayActionTitle.toLowerCase()}</strong>. Aquí están los detalles:</p>

      <div class="card">
        <h3>Detalle del horario</h3>
        <p class="detail">📅 <span class="highlight">${displayScheduleDate}</span></p>
        <p class="detail">⏰ <span class="highlight">${displayTimeRange}</span></p>
        <p class="detail">🔁 ${displayRecurrenceLabel}</p>
        ${hasDescription ? `<p class="detail">📝 ${displayDescription}</p>` : ""}
      </div>

      <div class="card" style="background:#f0f4ff;">
        <h3>¿Qué debo hacer?</h3>
        <ul style="margin: 8px 0 0 16px; padding: 0; color:#374151;">
          <li>Revisa tu agenda y confirma disponibilidad.</li>
          <li>Si detectas algún conflicto, contacta al coordinador.</li>
          <li>Guarda este correo como referencia.</li>
        </ul>
      </div>

      <div style="text-align:center;">
        <a class="button" href="${baseUrl}/login">Abrir AstroStar</a>
      </div>

      <p style="margin-top:16px; color:#4b5563; font-size:14px;">
        Este correo se envió al email registrado en tu perfil. Si no reconoces este cambio, responde a tu coordinador.
      </p>
    </div>
    <div class="footer">
      <p>Este es un correo automático. Por favor no respondas a este mensaje.</p>
      <p>© ${new Date().getFullYear()} AstroStar</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateScheduleNotificationText(data) {
  const displayEmployeeName = safeText(data.employeeName, "Colaborador");
  const displayActionTitle = safeText(
    data.actionTitle,
    "Actualización de horario",
  );
  const displayScheduleDate = safeText(data.scheduleDate, "Fecha por confirmar");
  const displayTimeRange = safeText(data.timeRange, "Horario por confirmar");
  const displayRecurrenceLabel = safeText(
    data.recurrenceLabel,
    "Sin repetición",
  );
  const displayDescription = safeText(data.description);

  return `
${displayActionTitle} - AstroStar

Hola ${displayEmployeeName},

Tu horario ha sido ${displayActionTitle.toLowerCase()}.

Fecha: ${displayScheduleDate}
Horario: ${displayTimeRange}
Repetición: ${displayRecurrenceLabel}
${displayDescription ? `Descripción: ${displayDescription}\n` : ""}

Si necesitas cambios, contacta a tu coordinador.

Este correo fue enviado al email registrado en tu perfil.

---
© ${new Date().getFullYear()} AstroStar
  `;
}
