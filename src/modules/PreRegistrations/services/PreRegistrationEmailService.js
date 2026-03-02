/**
 * Servicio de Email para Pre-Inscripciones - AstroStar
 * Maneja emails de inscripciones desde la landing page
 */

import { BaseEmailService } from "../../../services/email/BaseEmailService.js";

export class PreRegistrationEmailService extends BaseEmailService {
  /**
   * Enviar correo de confirmación de pre-inscripción
   */
  async sendPreRegistrationEmail(preRegistrationData) {
    try {
      console.log("📧 [PreRegistrationEmail] Iniciando envío de email");

      const {
        firstName,
        lastName,
        secondLastName,
        documentType,
        documentNumber,
        birthDate,
        phoneNumber,
        email,
      } = preRegistrationData;

      const nombreCompleto = `${firstName} ${lastName}${secondLastName ? ` ${secondLastName}` : ""}`;

      const mailOptions = {
        from: this.getDefaultFrom("Fundación Manuela Vanegas"),
        to: email,
        subject: "¡Bienvenida a la Fundación Manuela Vanegas! - Próximos Pasos",
        html: this.generatePreRegistrationTemplate(
          firstName,
          nombreCompleto,
          documentType,
          documentNumber,
          birthDate,
          phoneNumber,
          email,
        ),
        text: this.generatePreRegistrationText(
          firstName,
          nombreCompleto,
          documentType,
          documentNumber,
        ),
      };

      const result = await this.sendMailWithFallback(mailOptions);

      if (result.success) {
        console.log("✅ [PreRegistrationEmail] Email enviado exitosamente");
        return {
          success: true,
          messageId: result.messageId,
          message: "Email de confirmación enviado exitosamente",
        };
      }

      console.warn("⚠️ [PreRegistrationEmail] No se pudo enviar el email");
      return {
        success: false,
        error: result.error,
        message: "No se pudo enviar el email de confirmación",
      };
    } catch (error) {
      console.error("❌ [PreRegistrationEmail] Error:", error);
      return {
        success: false,
        error: error.message,
        message: "Error al enviar email de confirmación",
      };
    }
  }

  /**
   * Generar template HTML para pre-inscripción
   */
  generatePreRegistrationTemplate(
    firstName,
    nombreCompleto,
    documentType,
    documentNumber,
    birthDate,
    phoneNumber,
    email,
  ) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenida - Fundación Manuela Vanegas</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .info-row { margin: 10px 0; }
        .info-label { font-weight: bold; color: #555; }
        .info-value { color: #333; }
        .steps { background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .steps h3 { color: #667eea; margin-top: 0; }
        .steps ol { margin: 10px 0; padding-left: 20px; }
        .steps li { margin: 10px 0; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 ¡Bienvenida!</h1>
            <p>Fundación Manuela Vanegas</p>
        </div>
        
        <div class="content">
            <h2>Hola ${firstName},</h2>
            
            <p>¡Gracias por tu interés en formar parte de la Fundación Manuela Vanegas! Hemos recibido tu solicitud de inscripción exitosamente.</p>
            
            <div class="info-box">
                <h3>📋 Datos de tu Inscripción</h3>
                <div class="info-row">
                    <span class="info-label">Nombre completo:</span>
                    <span class="info-value">${nombreCompleto}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Documento:</span>
                    <span class="info-value">${documentType} ${documentNumber}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Fecha de nacimiento:</span>
                    <span class="info-value">${new Date(birthDate).toLocaleDateString("es-CO")}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">${phoneNumber}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${email}</span>
                </div>
            </div>
            
            <div class="steps">
                <h3>📝 Próximos Pasos</h3>
                <ol>
                    <li><strong>Revisión de Solicitud:</strong> Nuestro equipo revisará tu información en los próximos días.</li>
                    <li><strong>Contacto:</strong> Te contactaremos por teléfono o email para coordinar una entrevista.</li>
                    <li><strong>Documentación:</strong> Te indicaremos qué documentos adicionales necesitas presentar.</li>
                    <li><strong>Matrícula:</strong> Una vez aprobada tu solicitud, procederemos con el proceso de matrícula.</li>
                </ol>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul>
                    <li>Mantén tu teléfono disponible para recibir nuestra llamada</li>
                    <li>Revisa tu correo electrónico regularmente (incluyendo spam)</li>
                    <li>Si tienes preguntas, puedes contactarnos respondiendo a este correo</li>
                </ul>
            </div>
            
            <p>Estamos emocionados de que quieras ser parte de nuestra familia deportiva. ¡Pronto tendrás noticias nuestras!</p>
            
            <p>Saludos cordiales,<br>
            <strong>Equipo Fundación Manuela Vanegas</strong></p>
        </div>
        
        <div class="footer">
            <p>Este es un correo automático. Por favor no respondas directamente a este mensaje.</p>
            <p>© ${new Date().getFullYear()} Fundación Manuela Vanegas - Todos los derechos reservados</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generar texto plano para pre-inscripción
   */
  generatePreRegistrationText(
    firstName,
    nombreCompleto,
    documentType,
    documentNumber,
  ) {
    return `¡Bienvenida a la Fundación Manuela Vanegas!

Hola ${firstName},

Gracias por tu interés en formar parte de la Fundación Manuela Vanegas. Hemos recibido tu solicitud de inscripción exitosamente.

DATOS DE TU INSCRIPCIÓN:
- Nombre completo: ${nombreCompleto}
- Documento: ${documentType} ${documentNumber}

PRÓXIMOS PASOS:
1. Revisión de Solicitud: Nuestro equipo revisará tu información en los próximos días.
2. Contacto: Te contactaremos por teléfono o email para coordinar una entrevista.
3. Documentación: Te indicaremos qué documentos adicionales necesitas presentar.
4. Matrícula: Una vez aprobada tu solicitud, procederemos con el proceso de matrícula.

IMPORTANTE:
- Mantén tu teléfono disponible para recibir nuestra llamada
- Revisa tu correo electrónico regularmente (incluyendo spam)
- Si tienes preguntas, puedes contactarnos respondiendo a este correo

Estamos emocionados de que quieras ser parte de nuestra familia deportiva.

Saludos cordiales,
Equipo Fundación Manuela Vanegas

---
Este es un correo automático.
© ${new Date().getFullYear()} Fundación Manuela Vanegas`;
  }
}

// Exportar instancia singleton
export default new PreRegistrationEmailService();
