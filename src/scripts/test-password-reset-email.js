/**
 * Script de prueba para verificar el envío de emails de recuperación de contraseña
 * Ejecutar con: node src/scripts/test-password-reset-email.js
 */

import dotenv from "dotenv";
import emailService from "../services/emailService.js";

// Cargar variables de entorno
dotenv.config();

async function testPasswordResetEmail() {
  console.log(
    "🧪 Iniciando prueba de email de recuperación de contraseña...\n",
  );

  // Verificar configuración de email
  console.log("📧 Verificando configuración de email...");
  const isConfigured = await emailService.verifyConnection();

  if (!isConfigured) {
    console.error("❌ El servicio de email no está configurado correctamente.");
    console.log(
      "Verifica las variables de entorno EMAIL_USER y EMAIL_PASSWORD en el archivo .env",
    );
    process.exit(1);
  }

  console.log("✅ Servicio de email configurado correctamente\n");

  // Generar código de 6 dígitos de prueba
  const testResetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const testEmail = process.env.EMAIL_USER; // Enviar a ti mismo para prueba

  console.log("📤 Enviando email de recuperación de contraseña...");
  console.log(`   Destinatario: ${testEmail}`);
  console.log(`   Código de prueba: ${testResetCode}`);
  console.log(`   Expiración: 15 minutos\n`);

  try {
    const result = await emailService.sendPasswordResetEmail(
      testEmail,
      testResetCode,
    );

    if (result.success) {
      console.log("✅ ¡Email enviado exitosamente!");
      console.log(`   Message ID: ${result.messageId}`);
      if (result.simulated) {
        console.log("   ⚠️  Nota: Email enviado en modo simulación");
      }
      console.log("\n📬 Revisa tu bandeja de entrada para verificar el email.");
      console.log("🔍 Verifica que:");
      console.log("   - El código de 6 dígitos se muestra correctamente");
      console.log("   - El diseño tiene un gradiente morado/azul");
      console.log("   - Las instrucciones son claras");
      console.log("   - Menciona que expira en 15 minutos");
    } else {
      console.error("❌ Error al enviar el email:");
      console.error(`   ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error inesperado:", error.message);
    console.error(error.stack);
    process.exit(1);
  }

  console.log("\n✅ Prueba completada exitosamente");
}

// Ejecutar prueba
testPasswordResetEmail().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});

