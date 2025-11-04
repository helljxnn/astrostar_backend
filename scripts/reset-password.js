/**
 * Script para resetear contraseña de usuario
 */

import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'jenniferl.sosa15@gmail.com';
    const newPassword = 'admin123';

    console.log(`🔧 Reseteando contraseña para: ${email}\n`);

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true
      }
    });

    if (!user) {
      console.log(`❌ No se encontró usuario con email: ${email}`);
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.firstName} ${user.lastName}`);
    console.log(`   Rol: ${user.role.name}`);

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.user.update({
      where: { email },
      data: { passwordHash }
    });

    console.log(`\n✅ Contraseña actualizada exitosamente!`);
    console.log(`📋 Nuevas credenciales:`);
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${newPassword}`);
    console.log(`\n💡 Ahora puedes hacer login con estas credenciales.`);

  } catch (error) {
    console.error("❌ Error reseteando contraseña:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();