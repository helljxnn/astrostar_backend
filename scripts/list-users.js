/**
 * Script para listar usuarios disponibles
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log("👥 Usuarios disponibles en el sistema:\n");

    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            name: true
          }
        },
        documentType: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (users.length === 0) {
      console.log("❌ No hay usuarios en el sistema.");
      console.log("   Ejecute: node scripts/create-admin.js");
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.identification}`);
      console.log(`   👤 Rol: ${user.role?.name || 'Sin rol'}`);
      console.log(`   📄 Documento: ${user.documentType?.name || 'Sin tipo'}`);
      console.log(`   📊 Estado: ${user.status}`);
      console.log(`   📅 Creado: ${user.createdAt.toLocaleDateString()}`);
      console.log("");
    });

    console.log(`📊 Total de usuarios: ${users.length}`);
    
    // Mostrar usuarios administradores
    const admins = users.filter(user => user.role?.name === 'Administrador');
    if (admins.length > 0) {
      console.log("\n👑 Usuarios Administradores:");
      admins.forEach(admin => {
        console.log(`   • ${admin.email} (${admin.firstName} ${admin.lastName})`);
      });
      console.log("\n💡 Credenciales del usuario por defecto:");
      console.log("   Email: astrostar.java@gmail.com");
      console.log("   Contraseña: AstroStar2024!");
    }

  } catch (error) {
    console.error("❌ Error listando usuarios:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();