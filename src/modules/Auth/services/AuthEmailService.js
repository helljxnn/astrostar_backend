/**
 * Servicio de Email para Autenticación - AstroStar
 * Maneja emails de recuperación de contraseña y verificación
 */

import { BaseEmailService } from "../../../services/email/BaseEmailService.js";

export class AuthEmailService extends BaseEmailService {
  /**
   * Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const mailOptions = {
        from: this.getDefaultFrom(),
        to: email,
        subject: "🔐 Código de Recuperación de Contraseña - AstroStar",
        html: this.generatePasswordResetTemplate(resetToken),
        text: this.generatePasswordResetText(resetToken),
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error("❌ Error enviando email de recuperación:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar código de verificación de email
   */
  async sendEmailVerificationCode(email, verificationToken, firstName) {
    try {
      const mailOptions = {
        from: this.getDefaultFrom(),
        to: email,
        subject: "✉️ Verificación de Email - AstroStar",
        html: this.generateVerificationTemplate(verificationToken, firstName),
        text: this.generateVerificationText(verificationToken, firstName),
      };

      return await this.sendMailWithFallback(mailOptions);
    } catch (error) {
      console.error("❌ Error enviando código de verificación:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Template HTML para recuperación de contraseña
   */
  generatePasswordResetTemplate(resetCode) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .code-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); }
        .code { font-size: 48px; font-weight: bold; color: white; letter-spacing: 8px; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
        .code-label { color: rgba(255,255,255,0.9); font-size: 14px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 2px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; border-radius: 5px; margin: 25px 0; }
        .warning strong { color: #856404; }
        .info-box { background: #e8f4f8; border-left: 4px solid #17a2b8; padding: 15px 20px; border-radius: 5px; margin: 25px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .highlight { color: #667eea; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">FMV </p>
        </div>
        
        <div class="content">
            <h2 style="color: #333; margin-top: 0;">Solicitud de Recuperación</h2>
            
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en AstroStar.</p>
            
            <p>Para continuar con el proceso, ingresa el siguiente código de verificación en la aplicación:</p>
            
            <div class="code-box">
                <div class="code-label">Tu Código de Verificación</div>
                <div class="code">${resetCode}</div>
            </div>
            
            <div class="info-box">
                <strong>📋 Instrucciones:</strong>
                <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Copia el código de 6 dígitos mostrado arriba</li>
                    <li>Regresa a la aplicación de AstroStar</li>
                    <li>Ingresa el código en el campo de verificación</li>
                    <li>Crea tu nueva contraseña</li>
                </ol>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Este código <span class="highlight">expirará en 15 minutos</span> por seguridad</li>
                    <li>Si no solicitaste este cambio, <strong>ignora este correo</strong></li>
                    <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                    <li>No compartas este código con nadie</li>
                </ul>
            </div>
            
            <p style="margin-top: 30px;">Si tienes problemas o no solicitaste este cambio, contacta inmediatamente a soporte.</p>
            
            <p style="margin-top: 30px;">Saludos cordiales,<br><strong>Equipo AstroStar</strong></p>
        </div>
        
        <div class="footer">
            <p>Este es un correo automático. Por favor no respondas a este mensaje.</p>
            <p style="margin-top: 10px;">© ${new Date().getFullYear()} AstroStar - FMV </p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Texto plano para recuperación de contraseña
   */
  generatePasswordResetText(resetCode) {
    return `Recuperación de Contraseña - AstroStar

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

═══════════════════════════════════════
    TU CÓDIGO DE VERIFICACIÓN
═══════════════════════════════════════

            ${resetCode}

═══════════════════════════════════════

INSTRUCCIONES:
1. Copia el código de 6 dígitos mostrado arriba
2. Regresa a la aplicación de AstroStar
3. Ingresa el código en el campo de verificación
4. Crea tu nueva contraseña

IMPORTANTE:
- Este código expirará en 15 minutos por seguridad
- Si no solicitaste este cambio, ignora este correo
- Tu contraseña actual seguirá siendo válida hasta que la cambies
- No compartas este código con nadie

Si tienes problemas o no solicitaste este cambio, contacta inmediatamente a soporte.

Saludos cordiales,
Equipo AstroStar

---
Este es un correo automático.
© ${new Date().getFullYear()} AstroStar - FMV `;
  }

  /**
   * Template HTML para verificación de email
   */
  generateVerificationTemplate(verificationToken, firstName) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: white; border: 3px solid #667eea; border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center; }
        .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ Verificación de Email</h1>
        </div>
        
        <div class="content">
            <h2>Hola${firstName ? ` ${firstName}` : ""},</h2>
            
            <p>Para verificar tu dirección de correo electrónico, usa el siguiente código:</p>
            
            <div class="code-box">
                <div class="code">${verificationToken}</div>
            </div>
            
            <p><strong>Este código expirará en 15 minutos.</strong></p>
            
            <p>Si no solicitaste esta verificación, puedes ignorar este correo.</p>
            
            <p>Saludos,<br><strong>Equipo AstroStar</strong></p>
        </div>
        
        <div class="footer">
            <p>Este es un correo automático. Por favor no respondas a este mensaje.</p>
            <p>© ${new Date().getFullYear()} AstroStar - FMV </p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Texto plano para verificación de email
   */
  generateVerificationText(verificationToken, firstName) {
    return `Verificación de Email - AstroStar

Hola${firstName ? ` ${firstName}` : ""},

Para verificar tu dirección de correo electrónico, usa el siguiente código:

${verificationToken}

Este código expirará en 15 minutos.

Si no solicitaste esta verificación, puedes ignorar este correo.

Saludos,
Equipo AstroStar

---
Este es un correo automático.
© ${new Date().getFullYear()} AstroStar`;
  }
}

// Exportar instancia singleton
export default new AuthEmailService();
