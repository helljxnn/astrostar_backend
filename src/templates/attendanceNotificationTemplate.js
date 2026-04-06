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

export function generateAttendanceNotificationHTML(data) {
  const athleteName = escapeHtml(safeText(data.athleteName, "Deportista"));
  const date = escapeHtml(safeText(data.date, "Fecha por confirmar"));
  const observation = escapeHtml(safeText(data.observation));
  const statusText = data.status ? "presente" : "ausente";
  const statusColor = data.status ? "#10b981" : "#ef4444";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Asistencia</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #4a5568; margin: 0; padding: 0; background-color: #f7fafc; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; background: ${statusColor}; color: white; }
    .card { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); border-left: 4px solid #667eea; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .footer { background: #f7fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Registro de Asistencia</h1>
      <p style="margin: 10px 0 0 0;">AstroStar - Sistema de Gestión</p>
    </div>
    <div class="content">
      <p>Hola <strong>${athleteName}</strong>,</p>
      <p>Se ha registrado tu asistencia para el día <strong>${date}</strong>.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span class="badge">${statusText.toUpperCase()}</span>
      </div>
      <div class="card">
        <h3 style="margin-top: 0;">Detalles del registro</h3>
        <p><strong>Fecha:</strong> ${date}</p>
        <p><strong>Estado:</strong> ${statusText}</p>
        ${observation ? `<p><strong>Observación:</strong> ${observation}</p>` : ""}
      </div>
      <p style="font-size: 14px; color: #718096;">
        Si tienes alguna pregunta sobre este registro, contacta a tu coordinador.
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

export function generateAttendanceNotificationText(data) {
  const athleteName = safeText(data.athleteName, "Deportista");
  const date = safeText(data.date, "Fecha por confirmar");
  const observation = safeText(data.observation);
  const statusText = data.status ? "PRESENTE" : "AUSENTE";

  return `
Registro de Asistencia - AstroStar

Hola ${athleteName},

Se ha registrado tu asistencia para el día ${date}.

Estado: ${statusText}
${observation ? `Observación: ${observation}` : ""}

Si tienes alguna pregunta sobre este registro, contacta a tu coordinador.

---
Este es un correo automático.
© ${new Date().getFullYear()} AstroStar
  `;
}

export function generateAbsenceAlertHTML(data) {
  const athleteName = escapeHtml(safeText(data.athleteName, "Deportista"));
  const absencePercentage = escapeHtml(safeText(data.absencePercentage, "0"));
  const totalDays = escapeHtml(safeText(data.totalDays, "0"));
  const absentDays = escapeHtml(safeText(data.absentDays, "0"));
  const period = escapeHtml(safeText(data.period));

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Inasistencias</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #4a5568; margin: 0; padding: 0; background-color: #f7fafc; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 30px; text-align: center; }
    .content { padding: 40px 30px; }
    .alert-box { background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
    .stat-card { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); border-radius: 8px; padding: 15px; text-align: center; }
    .footer { background: #f7fafc; padding: 25px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Alerta de Inasistencias</h1>
      <p style="margin: 10px 0 0 0;">AstroStar - Sistema de Gestión</p>
    </div>
    <div class="content">
      <p>Hola <strong>${athleteName}</strong>,</p>
      <p>Te informamos que has superado el <strong>50% de inasistencias</strong> en el período registrado.</p>
      <div class="alert-box">
        <p style="margin: 0; font-size: 14px; color: #991b1b;">Porcentaje de ausencias</p>
        <div style="font-size: 48px; font-weight: 700; color: #ef4444; margin: 10px 0;">${absencePercentage}%</div>
      </div>
      <div class="stats">
        <div class="stat-card">
          <div style="font-size: 24px; font-weight: 700; color: #667eea;">${totalDays}</div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase;">Días totales</div>
        </div>
        <div class="stat-card">
          <div style="font-size: 24px; font-weight: 700; color: #667eea;">${absentDays}</div>
          <div style="font-size: 12px; color: #718096; text-transform: uppercase;">Días ausente</div>
        </div>
      </div>
      ${period ? `<p style="font-size: 14px; color: #718096; text-align: center;"><strong>Período:</strong> ${period}</p>` : ""}
      <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #78350f;">
          <strong>Importante:</strong> Es fundamental mantener una asistencia regular para tu desarrollo deportivo.
          Si tienes alguna situación que te impida asistir, por favor comunícate con tu coordinador.
        </p>
      </div>
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

export function generateAbsenceAlertText(data) {
  const athleteName = safeText(data.athleteName, "Deportista");
  const absencePercentage = safeText(data.absencePercentage, "0");
  const totalDays = safeText(data.totalDays, "0");
  const absentDays = safeText(data.absentDays, "0");
  const period = safeText(data.period);

  return `
Alerta de Inasistencias - AstroStar

Hola ${athleteName},

Te informamos que has superado el 50% de inasistencias en el período registrado.

ESTADÍSTICAS:
- Porcentaje de ausencias: ${absencePercentage}%
- Días totales: ${totalDays}
- Días ausente: ${absentDays}
${period ? `- Período: ${period}` : ""}

IMPORTANTE: Es fundamental mantener una asistencia regular para tu desarrollo deportivo.
Si tienes alguna situación que te impida asistir, por favor comunícate con tu coordinador.

---
Este es un correo automático.
© ${new Date().getFullYear()} AstroStar
  `;
}
