/**
 * Servicio de Email para Donantes y Patrocinadores - AstroStar
 * Maneja todos los correos relacionados con donaciones
 */

import { BaseEmailService } from "../../../../services/email/BaseEmailService.js";

export class DonorEmailService extends BaseEmailService {
  /**
   * Enviar email de bienvenida a nuevo donante/patrocinador
   */
  async sendDonorWelcomeEmail(donorData) {
    try {
      const { correo, nombreCompleto, tipo } = donorData;

      if (!correo) {
        console.warn("⚠️  No se puede enviar email: correo no proporcionado");
        return { success: false, error: "Correo no proporcionado" };
      }

      const mailOptions = {
        from: this.getDefaultFrom("Fundación Manuela Vanegas"),
        to: correo,
        subject: `¡Gracias por tu apoyo! - Fundación Manuela Vanegas`,
        html: this.generateWelcomeEmailHTML(donorData),
      };

      const result = await this.sendMailWithFallback(mailOptions);

      if (result.success) {
      } else {
        console.error(`❌ Error enviando email a ${correo}:`, result.error);
      }

      return result;
    } catch (error) {
      console.error("Error en sendDonorWelcomeEmail:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar HTML del email de bienvenida
   */
  generateWelcomeEmailHTML(donorData) {
    const { nombreCompleto, tipo, ciudad, pais } = donorData;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenida - Fundación Manuela Vanegas</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      Fundación Manuela Vanegas
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">
                      Formando niñas a través del deporte y la educación
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">
                      ¡Gracias por tu apoyo, ${nombreCompleto}!
                    </h2>
                    
                    <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Hemos recibido tu información como <strong>${tipo}</strong> y queremos agradecerte por tu interés en apoyar nuestra misión.
                    </p>

                    <p style="margin: 0 0 15px 0; color: #666666; font-size: 16px; line-height: 1.6;">
                      Tu contribución nos ayuda a:
                    </p>

                    <ul style="margin: 0 0 20px 0; padding-left: 20px; color: #666666; font-size: 16px; line-height: 1.8;">
                      <li>Fortalecer nuestros programas deportivos</li>
                      <li>Crear espacios seguros para las niñas</li>
                      <li>Brindar oportunidades educativas</li>
                      <li>Construir un mejor futuro para nuestra comunidad</li>
                    </ul>

                    <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                      <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        <strong>Próximos pasos:</strong><br>
                        Nuestro equipo revisará tu información y se pondrá en contacto contigo pronto para coordinar los detalles de tu donación y responder cualquier pregunta que tengas.
                      </p>
                    </div>

                    ${ciudad && pais ? `
                    <p style="margin: 20px 0 0 0; color: #999999; font-size: 14px;">
                      Ubicación registrada: ${ciudad}, ${pais}
                    </p>
                    ` : ''}
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                      <strong>Fundación Manuela Vanegas</strong>
                    </p>
                    <p style="margin: 0 0 10px 0; color: #999999; font-size: 13px;">
                      Trabajamos cada día para formar niñas a través del deporte y la educación en valores
                    </p>
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      📧 fundacionmanuelavanegas@gmail.com
                    </p>
                    <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 11px;">
                      Este es un correo automático, por favor no responder directamente.
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
}

// Exportar instancia singleton
export default new DonorEmailService();

