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
 * Template de correo de bienvenida para donantes
 * Con gradiente azul-morado según la imagen de referencia
 */
export function generateDonorWelcomeHTML(donorData) {
  const displayName = escapeHtml(
    safeText(donorData.nombreCompleto, "Aliado de la fundación"),
  );
  const displayEmail = escapeHtml(safeText(donorData.correo, "No registrado"));
  const displayPhone = escapeHtml(
    safeText(donorData.telefono, "No registrado"),
  );
  const displayCity = escapeHtml(safeText(donorData.ciudad, "No registrada"));
  const displayCountry = escapeHtml(safeText(donorData.pais, "No registrado"));

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gracias por tu interés en donar</title>
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
    .greeting { 
      font-size: 18px; 
      color: #2d3748; 
      margin-bottom: 20px;
    }
    .message { 
      font-size: 15px; 
      color: #4a5568; 
      line-height: 1.8; 
      margin-bottom: 25px;
    }
    .data-box { 
      background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); 
      border-left: 4px solid #667eea; 
      border-radius: 8px; 
      padding: 20px; 
      margin: 25px 0;
    }
    .data-box h3 { 
      margin: 0 0 15px 0; 
      color: #2d3748; 
      font-size: 16px; 
      font-weight: 600;
    }
    .data-item { 
      margin: 10px 0; 
      font-size: 14px; 
      color: #4a5568;
    }
    .data-item strong { 
      color: #667eea; 
      font-weight: 600;
    }
    .data-item a { 
      color: #667eea; 
      text-decoration: none;
    }
    .info-box { 
      background: #fffbeb; 
      border: 1px solid #fbbf24; 
      border-radius: 8px; 
      padding: 20px; 
      margin: 25px 0;
    }
    .info-box p { 
      margin: 0; 
      font-size: 14px; 
      color: #78350f;
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
    .contact-email { 
      color: #667eea; 
      text-decoration: none; 
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Gracias por tu interés en donar!</h1>
      <p>Fundación Manuela Vanegas</p>
    </div>
    
    <div class="content">
      <p class="greeting">Hola <strong>${displayName}</strong>,</p>
      
      <p class="message">
        Recibimos tu información y en breve un miembro del equipo se comunicará contigo 
        para confirmar los detalles de tu apoyo. Te contactaremos por el medio que registraste 
        para continuar el proceso.
      </p>
      
      <div class="data-box">
        <h3>Tus datos registrados</h3>
        <div class="data-item">
          <strong>Correo:</strong> <a href="mailto:${displayEmail}">${displayEmail}</a>
        </div>
        <div class="data-item">
          <strong>Teléfono:</strong> ${displayPhone}
        </div>
        <div class="data-item">
          <strong>Ciudad / País:</strong> ${displayCity}, ${displayCountry}
        </div>
        <div class="data-item">
          <strong>Mensaje:</strong> Registro creado desde el landing de donaciones.
        </div>
      </div>
      
      <div class="info-box">
        <p>
          Si ya hiciste tu donación y necesitas tu certificado, escríbenos a 
          <a href="mailto:fundacionmanuelavanegas@gmail.com" class="contact-email">
            fundacionmanuelavanegas@gmail.com
          </a>
        </p>
      </div>
      
      <p class="message">
        Si este mensaje no corresponde a tu solicitud, por favor ignóralo.
      </p>
    </div>
    
    <div class="footer">
      <p>Este es un mensaje automático del sistema AstroStar. Por favor no respondas a este correo.</p>
      <p>© ${new Date().getFullYear()} Fundación Manuela Vanegas</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function generateDonorWelcomeText(donorData) {
  const displayName = safeText(
    donorData.nombreCompleto,
    "Aliado de la fundación",
  );
  const displayEmail = safeText(donorData.correo, "No registrado");
  const displayPhone = safeText(donorData.telefono, "No registrado");
  const displayCity = safeText(donorData.ciudad, "No registrada");
  const displayCountry = safeText(donorData.pais, "No registrado");

  return `
¡Gracias por tu interés en donar!
Fundación Manuela Vanegas

Hola ${displayName},

Recibimos tu información y en breve un miembro del equipo se comunicará contigo 
para confirmar los detalles de tu apoyo. Te contactaremos por el medio que registraste 
para continuar el proceso.

TUS DATOS REGISTRADOS:
- Correo: ${displayEmail}
- Teléfono: ${displayPhone}
- Ciudad / País: ${displayCity}, ${displayCountry}
- Mensaje: Registro creado desde el landing de donaciones.

Si ya hiciste tu donación y necesitas tu certificado, escríbenos a 
fundacionmanuelavanegas@gmail.com

Si este mensaje no corresponde a tu solicitud, por favor ignóralo.

---
Este es un mensaje automático del sistema AstroStar.
© ${new Date().getFullYear()} Fundación Manuela Vanegas
  `;
}
