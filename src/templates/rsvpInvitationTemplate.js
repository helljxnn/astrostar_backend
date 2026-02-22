/**
 * Genera el HTML para el email de invitación RSVP
 * @param {Object} data - Datos para el template
 * @returns {string} HTML del email
 */
export function getRSVPInvitationHTML(data) {
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
  <title>Confirmación de Asistencia</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">¡Estás Inscrito!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hola <strong>${recipientName}</strong>,
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${
                  isTeam
                    ? `Tu equipo <strong>${teamName}</strong> ha sido inscrito exitosamente al evento:`
                    : "Has sido inscrito exitosamente al evento:"
                }
              </p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
                <h2 style="color: #667eea; margin: 0 0 10px; font-size: 22px;">${eventName}</h2>
                <p style="color: #666666; margin: 5px 0; font-size: 14px;">
                  📅 <strong>Fecha:</strong> ${eventDate}<br>
                  🕐 <strong>Hora:</strong> ${eventTime}<br>
                  📍 <strong>Lugar:</strong> ${eventLocation}
                </p>
              </div>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Por favor, confirma tu asistencia haciendo clic en uno de los siguientes botones:
              </p>
              
              <!-- Buttons -->
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
              
              <!-- Alternative Links -->
              <p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 20px 0; text-align: center;">
                Si los botones no funcionan, copia y pega estos enlaces en tu navegador:<br>
                <strong>Confirmar:</strong> ${confirmUrl}<br>
                <strong>Declinar:</strong> ${declineUrl}
              </p>
              
              <!-- Calendar -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">
                  📆 Agrega este evento a tu calendario
                </p>
                <p style="color: #999999; font-size: 12px;">
                  (El archivo .ics está adjunto a este correo)
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Este es un correo automático, por favor no respondas a este mensaje.<br>
                Si tienes preguntas, contacta a la organización del evento.
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
