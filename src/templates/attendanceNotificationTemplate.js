/**
 * Templates de correo para notificaciones de asistencia
 */

export function generateAttendanceNotificationHTML(data) {
  const { athleteName, date, status, observation } = data;
  
  const statusText = status ? 'presente' : 'ausente';
  const statusColor = status ? '#10b981' : '#ef4444';
  const statusIcon = status ? '✓' : '✗';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Asistencia</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #4a5568; 
      margin: 0; 
      padding: 0; 
      background-color: #f7fafc;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 600;
    }
    .header p { 
      margin: 10px 0 0 0; 
      font-size: 16px; 
      opacity: 0.95;
    }
    .content { 
      padding: 40px 30px; 
      background: white;
    }
    .status-badge { 
      display: inline-block; 
      padding: 8px 16px; 
      border-radius: 20px; 
      font-weight: 600; 
      font-size: 14px; 
      background: ${statusColor}; 
      color: white;
    }
    .info-card { 
      background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); 
      border-left: 4px solid #667eea; 
      border-radius: 8px; 
      padding: 20px; 
      margin: 25px 0;
    }
    .info-item { 
      margin: 10px 0; 
      font-size: 14px; 
      color: #4a5568;
    }
    .info-item strong { 
      color: #667eea; 
      font-weight: 600;
    }
    .footer { 
      background: #f7fafc; 
      padding: 25px 30px; 
      text-align: center; 
      border-top: 1px solid #e2e8f0;
    }
    .footer p { 
      margin: 5px 0; 
      font-size: 12px; 
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Registro de Asistencia</h1>
      <p>AstroStar - Sistema de Gestión</p>
    </div>
    
    <div class="content">
      <p>Hola <strong>${athleteName}</strong>,</p>
      
      <p>Se ha registrado tu asistencia para el día <strong>${date}</strong>.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <span class="status-badge">${statusIcon} ${statusText.toUpperCase()}</span>
      </div>
      
      <div class="info-card">
        <h3 style="margin: 0 0 15px 0; color: #2d3748;">Detalles del registro</h3>
        <div class="info-item">
          <strong>📅 Fecha:</strong> ${date}
        </div>
        <div class="info-item">
          <strong>Estado:</strong> ${statusText}
        </div>
        ${observation ? `
        <div class="info-item">
          <strong>📝 Observación:</strong> ${observation}
        </div>
        ` : ''}
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
  const { athleteName, date, status, observation } = data;
  const statusText = status ? 'PRESENTE' : 'AUSENTE';

  return `
Registro de Asistencia - AstroStar

Hola ${athleteName},

Se ha registrado tu asistencia para el día ${date}.

Estado: ${statusText}
${observation ? `Observación: ${observation}` : ''}

Si tienes alguna pregunta sobre este registro, contacta a tu coordinador.

---
Este es un correo automático.
© ${new Date().getFullYear()} AstroStar
  `;
}

export function generateAbsenceAlertHTML(data) {
  const { athleteName, absencePercentage, totalDays, absentDays, period } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alerta de Inasistencias</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #4a5568; 
      margin: 0; 
      padding: 0; 
      background-color: #f7fafc;
    }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background: white; 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .header h1 { 
      margin: 0; 
      font-size: 28px; 
      font-weight: 600;
    }
    .content { 
      padding: 40px 30px; 
      background: white;
    }
    .alert-box { 
      background: #fef2f2; 
      border: 2px solid #ef4444; 
      border-radius: 8px; 
      padding: 20px; 
      margin: 25px 0; 
      text-align: center;
    }
    .percentage { 
      font-size: 48px; 
      font-weight: 700; 
      color: #ef4444; 
      margin: 10px 0;
    }
    .stats-grid { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 15px; 
      margin: 25px 0;
    }
    .stat-card { 
      background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); 
      border-radius: 8px; 
      padding: 15px; 
      text-align: center;
    }
    .stat-value { 
      font-size: 24px; 
      font-weight: 700; 
      color: #667eea; 
      margin: 5px 0;
    }
    .stat-label { 
      font-size: 12px; 
      color: #718096; 
      text-transform: uppercase;
    }
    .footer { 
      background: #f7fafc; 
      padding: 25px 30px; 
      text-align: center; 
      border-top: 1px solid #e2e8f0;
    }
    .footer p { 
      margin: 5px 0; 
      font-size: 12px; 
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Alerta de Inasistencias</h1>
      <p>AstroStar - Sistema de Gestión</p>
    </div>
    
    <div class="content">
      <p>Hola <strong>${athleteName}</strong>,</p>
      
      <p>Te informamos que has superado el <strong>50% de inasistencias</strong> en el período registrado.</p>
      
      <div class="alert-box">
        <p style="margin: 0; font-size: 14px; color: #991b1b;">Porcentaje de ausencias</p>
        <div class="percentage">${absencePercentage}%</div>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${totalDays}</div>
          <div class="stat-label">Días totales</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${absentDays}</div>
          <div class="stat-label">Días ausente</div>
        </div>
      </div>
      
      ${period ? `
      <p style="font-size: 14px; color: #718096; text-align: center;">
        <strong>Período:</strong> ${period}
      </p>
      ` : ''}
      
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
  const { athleteName, absencePercentage, totalDays, absentDays, period } = data;

  return `
⚠️ Alerta de Inasistencias - AstroStar

Hola ${athleteName},

Te informamos que has superado el 50% de inasistencias en el período registrado.

ESTADÍSTICAS:
- Porcentaje de ausencias: ${absencePercentage}%
- Días totales: ${totalDays}
- Días ausente: ${absentDays}
${period ? `- Período: ${period}` : ''}

IMPORTANTE: Es fundamental mantener una asistencia regular para tu desarrollo deportivo. 
Si tienes alguna situación que te impida asistir, por favor comunícate con tu coordinador.

---
Este es un correo automático.
© ${new Date().getFullYear()} AstroStar
  `;
}

