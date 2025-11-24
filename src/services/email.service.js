import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"AstroStar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - AstroStar',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .token-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 3px; text-align: center; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
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
              
              <p><strong>Tu código de verificación es:</strong></p>
              <div class="token-box">${resetToken}</div>
              
              <p>Este código expirará en <strong>15 minutos</strong>.</p>
              
              <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error enviando email:', error);
      throw error;
    }
  }

  async sendEmailVerificationCode(email, verificationCode, firstName) {
    const mailOptions = {
      from: `"AstroStar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verificación de Cambio de Correo - AstroStar',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .token-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 3px; text-align: center; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 Verificación de Correo Electrónico</h1>
            </div>
            <div class="content">
              <p>Hola ${firstName},</p>
              <p>Recibimos una solicitud para cambiar el correo electrónico de tu cuenta en AstroStar.</p>
              
              <p><strong>Tu código de verificación es:</strong></p>
              <div class="token-box">${verificationCode}</div>
              
              <p>Ingresa este código en la aplicación para confirmar el cambio de correo electrónico.</p>
              
              <p>Este código expirará en <strong>15 minutos</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong> Si no solicitaste este cambio, ignora este correo y tu cuenta permanecerá segura.
              </div>
              
              <div class="footer">
                <p>© ${new Date().getFullYear()} AstroStar. Todos los derechos reservados.</p>
                <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Error enviando email de verificación:', error);
      throw error;
    }
  }
}

export default new EmailService();
