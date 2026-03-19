import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

console.log('🔍 DIAGNÓSTICO DE EMAIL - ASTROSTAR\n');
console.log('═══════════════════════════════════════\n');

// 1. Verificar variables de entorno
console.log('📋 1. CONFIGURACIÓN:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NO CONFIGURADO');
console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Configurada' : '❌ NO CONFIGURADA');
console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com (default)');
console.log('   SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
console.log('');

// 2. Probar puerto 587
async function testPort(port, secure) {
  console.log(`\n🔌 Probando puerto ${port} (secure: ${secure})...`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
  });

  try {
    await transporter.verify();
    console.log(`   ✅ Puerto ${port} - CONEXIÓN EXITOSA`);
    return { success: true, port, transporter };
  } catch (error) {
    console.log(`   ❌ Puerto ${port} - FALLÓ: ${error.code || error.message}`);
    return { success: false, port, error };
  }
}

async function runDiagnostics() {
  console.log('═══════════════════════════════════════\n');
  console.log('🧪 2. PRUEBAS DE CONEXIÓN:\n');

  // Probar ambos puertos
  const result587 = await testPort(587, false);
  const result465 = await testPort(465, true);

  console.log('\n═══════════════════════════════════════\n');
  console.log('📊 3. RESULTADOS:\n');

  if (result587.success) {
    console.log('✅ Puerto 587 funciona - Intentando enviar email de prueba...\n');
    
    try {
      const info = await result587.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: '✅ Test AstroStar - Puerto 587',
        text: 'Email de prueba exitoso desde puerto 587',
        html: '<h1>✅ Email funcionando!</h1><p>Puerto 587 operativo</p>'
      });
      
      console.log('   ✅ EMAIL ENVIADO EXITOSAMENTE!');
      console.log('   📬 Message ID:', info.messageId);
      console.log('\n💡 Revisa tu bandeja:', process.env.EMAIL_USER);
    } catch (error) {
      console.log('   ❌ Error enviando:', error.message);
    }
  } else if (result465.success) {
    console.log('✅ Puerto 465 funciona - Intentando enviar email de prueba...\n');
    
    try {
      const info = await result465.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: '✅ Test AstroStar - Puerto 465',
        text: 'Email de prueba exitoso desde puerto 465',
        html: '<h1>✅ Email funcionando!</h1><p>Puerto 465 operativo</p>'
      });
      
      console.log('   ✅ EMAIL ENVIADO EXITOSAMENTE!');
      console.log('   📬 Message ID:', info.messageId);
      console.log('\n💡 Revisa tu bandeja:', process.env.EMAIL_USER);
    } catch (error) {
      console.log('   ❌ Error enviando:', error.message);
    }
  } else {
    console.log('❌ NINGÚN PUERTO FUNCIONA\n');
    console.log('🔧 POSIBLES SOLUCIONES:\n');
    console.log('1. CONTRASEÑA DE APLICACIÓN:');
    console.log('   - Ve a: https://myaccount.google.com/apppasswords');
    console.log('   - Genera una nueva contraseña de aplicación');
    console.log('   - Actualiza EMAIL_PASSWORD en .env\n');
    
    console.log('2. VERIFICACIÓN EN 2 PASOS:');
    console.log('   - Debe estar ACTIVADA en tu cuenta de Gmail');
    console.log('   - Ve a: https://myaccount.google.com/security\n');
    
    console.log('3. FIREWALL/RED:');
    console.log('   - Tu red puede estar bloqueando puertos SMTP');
    console.log('   - Intenta desde otra red (datos móviles, otra WiFi)');
    console.log('   - Contacta a tu administrador de red\n');
    
    console.log('4. CUENTA DE GMAIL:');
    console.log('   - Verifica que la cuenta esté activa');
    console.log('   - Revisa si Gmail bloqueó el acceso');
    console.log('   - Ve a: https://myaccount.google.com/notifications\n');
  }

  console.log('═══════════════════════════════════════\n');
  process.exit(0);
}

runDiagnostics().catch(error => {
  console.error('\n❌ ERROR CRÍTICO:', error);
  process.exit(1);
});

