import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Verificando configuración de email...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***configurada***' : 'NO CONFIGURADA');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);

async function testEmail() {
  try {
    console.log('\n📧 Creando transporter...');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    console.log('✅ Transporter creado');
    console.log('\n🔌 Verificando conexión SMTP...');
    
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada exitosamente!');

    console.log('\n📤 Enviando email de prueba...');
    
    const info = await transporter.sendMail({
      from: {
        name: 'AstroStar Test',
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER, // Enviar a ti mismo
      subject: '✅ Test de Email - AstroStar',
      html: `
        <h1>¡Email de prueba exitoso!</h1>
        <p>Si recibes este correo, significa que el servicio de email está funcionando correctamente.</p>
        <p>Fecha: ${new Date().toLocaleString('es-CO')}</p>
      `,
      text: 'Email de prueba exitoso!'
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📬 Message ID:', info.messageId);
    console.log('\n✨ Revisa tu bandeja de entrada en:', process.env.EMAIL_USER);
    console.log('💡 Si no lo ves, revisa la carpeta de SPAM');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n🔍 Detalles del error:');
    console.error('Código:', error.code);
    console.error('Comando:', error.command);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  ERROR DE AUTENTICACIÓN:');
      console.error('1. Verifica que EMAIL_PASSWORD sea una "Contraseña de aplicación" de Gmail');
      console.error('2. NO uses tu contraseña normal de Gmail');
      console.error('3. Genera una nueva en: https://myaccount.google.com/apppasswords');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  ERROR DE CONEXIÓN:');
      console.error('1. Tu firewall o red puede estar bloqueando el puerto', process.env.SMTP_PORT);
      console.error('2. Intenta cambiar el puerto (587 o 465)');
      console.error('3. Verifica tu conexión a internet');
    }
  }
}

testEmail();

