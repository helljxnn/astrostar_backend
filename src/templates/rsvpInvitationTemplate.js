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

  const displayRecipient = escapeHtml(safeText(recipientName, "participante"));
  const displayTeamName = escapeHtml(safeText(teamName, "tu equipo"));
  const displayEventName = escapeHtml(safeText(eventName, "Evento AstroStar"));
  const displayEventDate = escapeHtml(
    safeText(eventDate, "Fecha por confirmar"),
  );
  const displayEventTime = escapeHtml(
    safeText(eventTime, "Hora por confirmar"),
  );
  const displayEventLocation = escapeHtml(
    safeText(eventLocation, "Lugar por confirmar"),
  );

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
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Inscripción Confirmada</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hola <strong>${displayRecipient}</strong>,
              </p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                ${
                  isTeam
                    ? `Tu equipo <strong>${displayTeamName}</strong> ha sido inscrito exitosamente al evento:`
                    : "Has sido inscrito exitosamente al evento:"
                }
              </p>
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
                <h2 style="color: #667eea; margin: 0 0 10px; font-size: 22px;">${displayEventName}</h2>
                <p style="color: #666666; margin: 5px 0; font-size: 14px;">
                  <strong>Fecha:</strong> ${displayEventDate}<br>
                  <strong>Hora:</strong> ${displayEventTime}<br>
                  <strong>Lugar:</strong> ${displayEventLocation}
                </p>
              </div>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Por favor, confirma tu asistencia haciendo clic en uno de los siguientes botones:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 10px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #10b981; border-radius: 8px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                          <a href="${confirmUrl}" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 16px 50px; font-size: 16px; font-weight: bold; border-radius: 8px;">
                            Confirmar Asistencia
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 10px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #ef4444; border-radius: 8px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
                          <a href="${declineUrl}" style="display: inline-block; color: #ffffff; text-decoration: none; padding: 16px 50px; font-size: 16px; font-weight: bold; border-radius: 8px;">
                            No podré asistir
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="background-color: #f0f9ff; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                <p style="color: #0369a1; font-size: 15px; margin: 0 0 8px; font-weight: 600;">
                  Agrega este evento a tu calendario
                </p>
                <p style="color: #64748b; font-size: 13px; margin: 0;">
                  El archivo .ics está adjunto a este correo
                </p>
              </div>
            </td>
          </tr>
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
