/**
 * Servicio de Email - AstroStar
 * Maneja el envío de correos electrónicos del sistema
 */

import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Inicializar el transportador de email
   */
  initializeTransporter() {
    try {
      // Verificar si las credenciales están configuradas
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || 
          process.env.EMAIL_PASSWORD === 'your-app-password-here') {
        console.log('⚠️  Credenciales de email no configuradas');
        this.transporter = null;
        return;
      }

      console.log('📧 Inicializando servicio de email con:', process.env.EMAIL_USER);

      // Configuración unificada para Gmail (desarrollo y producción)
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('✅ Servicio de email inicializado correctamente');

    } catch (error) {
      console.error('❌ Error inicializando servicio de email:', error);
      this.transporter = null;
    }
  }

  /**
   * Verificar conexión del servicio de email
   */
  async verifyConnection() {
    try {
      if (!this.transporter) {
        console.log('📧 Servicio de email en modo simulación');
        return false;
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enviar email de bienvenida a nuevo empleado
   */
  async sendWelcomeEmail(employeeData, credentials) {
    try {
      const { email, firstName, lastName } = employeeData;
      const { email: loginEmail, temporaryPassword } = credentials;

      const mailOptions = {
        from: {
          name: 'AstroStar - Sistema de Gestión',
          address: process.env.EMAIL_USER || 'astrostar.system@gmail.com'
        },
        to: email,
        subject: '🎉 Bienvenido a AstroStar - Credenciales de Acceso',
        html: this.generateWelcomeEmailTemplate(firstName, lastName, loginEmail, temporaryPassword),
        text: this.generateWelcomeEmailText(firstName, lastName, loginEmail, temporaryPassword)
      };

      // Si no hay transporter configurado, simular envío
      if (!this.transporter) {
        return { success: true, messageId: 'simulated-' + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);
      
      return { 
        success: true, 
        messageId: result.messageId,
        message: 'Email enviado exitosamente'
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        message: 'Error enviando email'
      };
    }
  }

  /**
   * Generar template HTML para email de bienvenida
   */
  generateWelcomeEmailTemplate(firstName, lastName, email, password) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a AstroStar</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-item { margin: 10px 0; padding: 10px; background: #f0f4ff; border-radius: 5px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌟 ¡Bienvenido a AstroStar!</h1>
                <p>Sistema de Gestión Deportiva</p>
            </div>
            
            <div class="content">
                <h2>Hola ${firstName} ${lastName},</h2>
                
                <p>¡Nos complace darte la bienvenida al equipo de AstroStar! Tu cuenta de empleado ha sido creada exitosamente.</p>
                
                <div class="credentials-box">
                    <h3>🔐 Tus Credenciales de Acceso</h3>
                    <div class="credential-item">
                        <strong>📧 Usuario:</strong> ${email}
                    </div>
                    <div class="credential-item">
                        <strong>🔑 Contraseña:</strong> <code> Tu documento de identidad</code>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante - Seguridad:</strong>
                    <ul>
                        <li>Por razones de seguridad, <strong>es recomendable cambiar tu contraseña</strong> después de tu primer inicio de sesión</li>
                        <li>Elige una contraseña segura que incluya letras, números y símbolos</li>
                        <li>No compartas tus credenciales con nadie</li>
                        <li>Si tienes problemas para acceder, contacta al administrador</li>
                    </ul>
                </div>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                        🚀 Acceder al Sistema
                    </a>
                </div>
                
                <h3>📋 Próximos Pasos:</h3>
                <ol>
                    <li>Inicia sesión con tu correo y tu documento de identidad como contraseña</li>
                    <li><strong>Cambia tu contraseña inmediatamente</strong> por una segura y personal</li>
                    <li>Completa tu perfil si es necesario</li>
                    <li>Familiarízate con el sistema</li>
                </ol>
                
                <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al equipo de soporte.</p>
                
                <p>¡Esperamos que tengas una excelente experiencia trabajando con AstroStar!</p>
                
                <p>Saludos cordiales,<br>
                <strong>Equipo AstroStar</strong></p>
            </div>
            
            <div class="footer">
                <p>Este es un email automático del sistema AstroStar. Por favor no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generar texto plano para email de bienvenida
   */
  generateWelcomeEmailText(firstName, lastName, email, password) {
    return `
¡Bienvenido a AstroStar!

Hola ${firstName} ${lastName},

Nos complace darte la bienvenida al equipo de AstroStar. Tu cuenta de empleado ha sido creada exitosamente.

CREDENCIALES DE ACCESO:
- Usuario: ${email}
- Contraseña Inicial: ${password} (Tu número de documento de identidad)

IMPORTANTE - SEGURIDAD:
- Tu contraseña inicial es tu número de documento de identidad
- Por razones de seguridad, DEBES CAMBIARLA INMEDIATAMENTE después de tu primer inicio de sesión
- Elige una contraseña segura que incluya letras, números y símbolos
- No compartas tus credenciales con nadie
- Si tienes problemas para acceder, contacta al administrador

PRÓXIMOS PASOS:
1. Inicia sesión con tu correo y tu documento de identidad como contraseña
2. CAMBIA TU CONTRASEÑA INMEDIATAMENTE por una segura y personal
3. Completa tu perfil si es necesario
4. Familiarízate con el sistema

Accede al sistema en: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

¡Esperamos que tengas una excelente experiencia trabajando con AstroStar!

Saludos cordiales,
Equipo AstroStar

---
Este es un email automático del sistema AstroStar.
© ${new Date().getFullYear()} AstroStar - Sistema de Gestión Deportiva
    `;
  }

  /**
   * Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email, resetToken) {
    try {
      console.log('📧 Intentando enviar email de recuperación a:', email);
      
      const mailOptions = {
        from: {
          name: 'AstroStar - Sistema de Gestión',
          address: process.env.EMAIL_USER || 'astrostar.system@gmail.com'
        },
        to: email,
        subject: '🔐 Recuperación de Contraseña - AstroStar',
        html: this.generatePasswordResetTemplate(email, resetToken),
        text: `Recuperación de contraseña para AstroStar\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n${process.env.FRONTEND_URL}/reset-password?token=${resetToken}\n\nEste enlace expira en 1 hora.`
      };

      if (!this.transporter) {
        console.log('⚠️  Transporter no configurado, simulando envío');
        return { success: true, messageId: 'simulated-reset-' + Date.now() };
      }

      console.log('📤 Enviando email...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente. MessageId:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error enviando email de recuperación:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar template para recuperación de contraseña
   */
  generatePasswordResetTemplate(email, resetToken) {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 25px 0; border-radius: 10px; }
            .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
                <p style="margin: 0; opacity: 0.9;">AstroStar - Sistema de Gestión</p>
            </div>
            <div class="content">
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en AstroStar.</p>
                <p><strong>Tu código de verificación es:</strong></p>
                
                <div class="code-box">
                    <div class="code">${resetToken}</div>
                    <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Ingresa este código en la página de recuperación</p>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul style="margin: 10px 0;">
                        <li>Este código expira en <strong>15 minutos</strong></li>
                        <li>Si no solicitaste este cambio, ignora este email</li>
                        <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                        <li>Nunca compartas este código con nadie</li>
                    </ul>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    Si tienes problemas, contacta con el administrador del sistema.
                </p>
            </div>
            <div class="footer">
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
                <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Enviar código de verificación para cambio de email
   */
  async sendEmailVerificationCode(email, verificationCode, firstName) {
    try {
      console.log('📧 Intentando enviar código de verificación a:', email);
      
      const mailOptions = {
        from: {
          name: 'AstroStar - Sistema de Gestión',
          address: process.env.EMAIL_USER || 'astrostar.system@gmail.com'
        },
        to: email,
        subject: '📧 Verificación de Cambio de Correo - AstroStar',
        html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verificación de Correo</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 25px 0; border-radius: 10px; }
            .code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Verificación de Correo Electrónico</h1>
              <p style="margin: 0; opacity: 0.9;">AstroStar - Sistema de Gestión</p>
            </div>
            <div class="content">
              <p>Hola ${firstName},</p>
              <p>Recibimos una solicitud para cambiar el correo electrónico de tu cuenta en AstroStar.</p>
              
              <p><strong>Tu código de verificación es:</strong></p>
              <div class="code-box">
                <div class="code">${verificationCode}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Ingresa este código para confirmar el cambio</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0;">
                  <li>Este código expira en <strong>15 minutos</strong></li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                  <li>Nunca compartas este código con nadie</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Si tienes problemas, contacta con el administrador del sistema.
              </p>
            </div>
            <div class="footer">
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
        `,
        text: `Verificación de Cambio de Correo - AstroStar\n\nHola ${firstName},\n\nTu código de verificación es: ${verificationCode}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este cambio, ignora este email.`
      };

      if (!this.transporter) {
        console.log('⚠️  Transporter no configurado, simulando envío');
        return { success: true, messageId: 'simulated-verification-' + Date.now() };
      }

      console.log('📤 Enviando email de verificación...');
      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email de verificación enviado exitosamente. MessageId:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error enviando email de verificación:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new EmailService();