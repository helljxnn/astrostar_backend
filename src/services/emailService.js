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

        this.transporter = null;
        return;
      }

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
                        <strong>🔑 Contraseña Temporal:</strong> <code>${password}</code>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Esta es una contraseña temporal generada automáticamente</li>
                        <li>Debes cambiarla en tu primer inicio de sesión</li>
                        <li>No compartas estas credenciales con nadie</li>
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
                    <li>Inicia sesión con las credenciales proporcionadas</li>
                    <li>Cambia tu contraseña por una segura</li>
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
- Contraseña Temporal: ${password}

IMPORTANTE:
- Esta es una contraseña temporal que debes cambiar en tu primer inicio de sesión
- No compartas estas credenciales con nadie
- Si tienes problemas para acceder, contacta al administrador

PRÓXIMOS PASOS:
1. Inicia sesión con las credenciales proporcionadas
2. Cambia tu contraseña por una segura
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
        return { success: true, messageId: 'simulated-reset-' + Date.now() };
      }

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Generar template para recuperación de contraseña
   */
  generatePasswordResetTemplate(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
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
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en AstroStar.</p>
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                </div>
                <div class="warning">
                    <strong>⚠️ Importante:</strong>
                    <ul>
                        <li>Este enlace expira en 1 hora</li>
                        <li>Si no solicitaste este cambio, ignora este email</li>
                        <li>Tu contraseña actual seguirá siendo válida hasta que la cambies</li>
                    </ul>
                </div>
                <p>Si tienes problemas con el enlace, copia y pega la siguiente URL en tu navegador:</p>
                <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetUrl}</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

export default new EmailService();