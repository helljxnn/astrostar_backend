/**
 * Template para recordatorio de invitación pendiente
 */
export function getRSVPReminderHTML(data) {
  const {
    recipientName,
    isTeam,
    teamName,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
    confirmUrl,
    declineUrl,
  } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio: Confirma tu Asistencia</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Recordatorio</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hola <strong>${recipientName}</strong>,
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>El evento es mañana</strong> y aún no has confirmado tu asistencia.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
                <h2 style="color: #f59e0b; margin: 0 0 10px; font-size: 22px;">${eventName}</h2>
                <p style="color: #666666; margin: 5px 0; font-size: 14px;">
                  📅 <strong>Fecha:</strong> ${eventDate}<br>
                  🕐 <strong>Hora:</strong> ${eventTime}<br>
                  📍 <strong>Lugar:</strong> ${eventLocation}
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Por favor, confirma tu asistencia lo antes posible:
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0 10px;">
                    <a href="${confirmUrl}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      ✓ Confirmar Asistencia
                    </a>
                  </td>
                  <td align="center" style="padding: 0 10px;">
                    <a href="${declineUrl}" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                      ✗ No Podré Asistir
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Template para recordatorio de evento confirmado
 */
export function getConfirmedReminderHTML(data) {
  const {
    recipientName,
    isTeam,
    teamName,
    eventName,
    eventDate,
    eventTime,
    eventLocation,
  } = data;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio: Evento Mañana</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📅 Evento Mañana</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hola <strong>${recipientName}</strong>,
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Te recordamos que <strong>mañana es el evento</strong> al que confirmaste asistencia.
              </p>
              
              <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <h2 style="color: #10b981; margin: 0 0 10px; font-size: 22px;">${eventName}</h2>
                <p style="color: #666666; margin: 5px 0; font-size: 14px;">
                  📅 <strong>Fecha:</strong> ${eventDate}<br>
                  🕐 <strong>Hora:</strong> ${eventTime}<br>
                  📍 <strong>Lugar:</strong> ${eventLocation}
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0; text-align: center;">
                <strong>¡Te esperamos!</strong>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
