import nodemailer from "nodemailer";
import 'dotenv/config';

// Verificación de variables de entorno para evitar errores silenciosos
if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  throw new Error(
    "Faltan variables de entorno para la configuración del correo. " +
    "Asegúrate de que SMTP_HOST, SMTP_PORT, EMAIL_USER y EMAIL_PASSWORD estén definidas en tu archivo .env"
  );
}

// Configura el "transporter" de Nodemailer usando tus variables de entorno
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  // Para Gmail, 'secure' es 'true' si el puerto es 465, de lo contrario 'false'.
  // El puerto 587 (que estás usando) usa TLS, por lo que 'secure' debe ser 'false'.
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER, // Tu correo de Gmail
    pass: process.env.EMAIL_PASSWORD, // Tu contraseña de aplicación de Gmail
  },
});

/**
 * Envía un correo para restablecer la contraseña.
 * @param {object} options
 * @param {string} options.to - El email del destinatario.
 * @param {string} options.firstName - El nombre del usuario.
 * @param {string} options.url - El enlace para restablecer la contraseña.
 */
export async function sendPasswordResetEmail({ to, firstName, url }) {
  const mailOptions = {
    from: `"AstroStar" <${process.env.EMAIL_USER}>`, // Muestra "AstroStar" como el remitente
    to: to,
    subject: "Restablece tu contraseña de AstroStar",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hola ${firstName},</h2>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en AstroStar.</p>
        <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
        <a href="${url}" target="_blank" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Restablecer mi contraseña</a>
        <p>Este enlace expirará en 15 minutos.</p>
        <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        <br>
        <p>Saludos,</p>
        <p>El equipo de AstroStar</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Correo de restablecimiento de contraseña enviado a: ${to}`);
}
