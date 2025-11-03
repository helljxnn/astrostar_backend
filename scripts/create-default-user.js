/**
 * Script para crear usuario por defecto del sistema
 * Este usuario no puede ser eliminado y siempre debe existir
 */

import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createDefaultUser() {
  try {
    console.log("🔧 Creando usuario por defecto del sistema...\n");

    const defaultEmail = 'astrostar.java@gmail.com';
    const defaultPassword = 'AstroStar2024!';

    // Verificar si ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: defaultEmail }
    });

    if (existingUser) {
      console.log("✅ El usuario por defecto ya existe:");
      console.log(`   Email: ${existingUser.email}`);
      console.log("   Actualizando contraseña...");
      
      // Actualizar contraseña
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      await prisma.user.update({
        where: { email: defaultEmail },
        data: { passwordHash }
      });
      
      console.log("✅ Contraseña actualizada correctamente.\n");
      return;
    }

    // Obtener el rol de administrador
    const adminRole = await prisma.role.findUnique({
      where: { name: "Administrador" }
    });

    if (!adminRole) {
      console.error("❌ Error: No se encontró el rol de Administrador.");
      console.log("   Ejecute primero: npm run seed");
      return;
    }

    // Obtener tipo de documento (Cédula de Ciudadanía)
    const documentType = await prisma.documentType.findFirst({
      where: { name: "Cédula de Ciudadanía" }
    });

    if (!documentType) {
      console.error("❌ Error: No se encontró el tipo de documento.");
      console.log("   Ejecute primero: npm run seed");
      return;
    }

    // Datos del usuario por defecto
    const userData = {
      firstName: "AstroStar",
      lastName: "Sistema",
      email: defaultEmail,
      phoneNumber: "3001234567",
      address: "Sede Principal AstroStar - Colombia",
      birthDate: new Date("1990-01-01"),
      age: 35,
      identification: "9999999999",
      status: "Active",
      documentTypeId: documentType.id,
      roleId: adminRole.id,
      passwordHash: await bcrypt.hash(defaultPassword, 10)
    };

    // Crear usuario por defecto
    const defaultUser = await prisma.user.create({
      data: userData,
      include: {
        role: true,
        documentType: true
      }
    });

    // Crear registro de empleado
    await prisma.employee.create({
      data: {
        userId: defaultUser.id,
        status: "Activo"
      }
    });

    console.log("✅ Usuario por defecto creado exitosamente!");
    console.log("📋 Credenciales del sistema:");
    console.log(`   Email: ${defaultUser.email}`);
    console.log(`   Contraseña: ${defaultPassword}`);
    console.log(`   Rol: ${defaultUser.role.name}`);
    console.log(`   Identificación: ${defaultUser.identification}`);
    console.log("\n🔒 IMPORTANTE:");
    console.log("   • Este usuario NO puede ser eliminado");
    console.log("   • Es el usuario principal del sistema");
    console.log("   • Guarde estas credenciales de forma segura");
    console.log("   • Cambie la contraseña después del primer login\n");

  } catch (error) {
    console.error("❌ Error creando usuario por defecto:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultUser();