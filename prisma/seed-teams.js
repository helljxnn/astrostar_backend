/**
 * SEED PARA MÓDULO DE EQUIPOS - DEPORTISTAS DE FUNDACIÓN
 * 
 * Este seed crea deportistas de fundación para probar el módulo de equipos
 */

import { PrismaClient } from "../generated/prisma/index.js";
const prisma = new PrismaClient();

async function main() {
  console.log("🏃 Iniciando seed para módulo de equipos...\n");

  // 1. Verificar que existe el tipo de documento
  const cedulaType = await prisma.documentType.findFirst({
    where: { name: "Cédula de Ciudadanía" }
  });

  if (!cedulaType) {
    console.log("❌ No se encontró el tipo de documento 'Cédula de Ciudadanía'");
    console.log("💡 Ejecuta primero: npx prisma db seed");
    return;
  }

  // 2. Crear rol de Deportista si no existe
  console.log("👤 Configurando rol de Deportista...");
  const deportistaRole = await prisma.role.upsert({
    where: { name: "Deportista" },
    update: {},
    create: {
      name: "Deportista",
      description: "Rol para deportistas de la fundación",
      status: "Active",
      permissions: {
        dashboard: { Ver: true, Crear: false, Editar: false, Eliminar: false }
      }
    }
  });

  // 3. Crear categorías deportivas (usando create en lugar de upsert)
  console.log("🏆 Creando categorías deportivas...");
  
  // Verificar si ya existen antes de crear
  const existingCategories = await prisma.sportsCategory.findMany({
    where: {
      nombre: { in: ["Sub-17", "Sub-15"] }
    }
  });

  let sub17 = existingCategories.find(cat => cat.nombre === "Sub-17");
  let sub15 = existingCategories.find(cat => cat.nombre === "Sub-15");

  if (!sub17) {
    sub17 = await prisma.sportsCategory.create({
      data: {
        nombre: "Sub-17",
        edadMinima: 15,
        edadMaxima: 17,
        descripcion: "Categoría para menores de 17 años",
        estado: "Activo",
        publicar: true
      }
    });
    console.log("✅ Categoría Sub-17 creada");
  } else {
    console.log("✅ Categoría Sub-17 ya existe");
  }

  if (!sub15) {
    sub15 = await prisma.sportsCategory.create({
      data: {
        nombre: "Sub-15",
        edadMinima: 13,
        edadMaxima: 15,
        descripcion: "Categoría para menores de 15 años",
        estado: "Activo",
        publicar: true
      }
    });
    console.log("✅ Categoría Sub-15 creada");
  } else {
    console.log("✅ Categoría Sub-15 ya existe");
  }

  // 4. Crear usuarios para deportistas de fundación
  console.log("👥 Creando deportistas de fundación...");
  
  // Deportista 1 - Sub-17
  const user1 = await prisma.user.upsert({
    where: { email: "maria.gonzalez@fundacion.com" },
    update: {},
    create: {
      firstName: "María",
      lastName: "Gonzalez",
      email: "maria.gonzalez@fundacion.com",
      passwordHash: "$2b$10$TempPasswordHashForTesting123",
      phoneNumber: "3001111001",
      address: "Calle 123 #45-67, Bogotá",
      birthDate: new Date("2006-05-15"),
      identification: "1001001001",
      status: "Active",
      documentTypeId: cedulaType.id,
      roleId: deportistaRole.id
    }
  });

  const athlete1 = await prisma.athlete.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      status: "Active",
      currentInscriptionStatus: "Active"
    }
  });

  await prisma.inscription.create({
    data: {
      athleteId: athlete1.id,
      sportsCategoryId: sub17.id,
      status: "Active",
      expirationDate: new Date("2024-12-31"),
      concept: "Inscripción anual 2024 - Sub-17"
    }
  });

  // Deportista 2 - Sub-17
  const user2 = await prisma.user.upsert({
    where: { email: "carlos.rodriguez@fundacion.com" },
    update: {},
    create: {
      firstName: "Carlos",
      lastName: "Rodriguez",
      email: "carlos.rodriguez@fundacion.com",
      passwordHash: "$2b$10$TempPasswordHashForTesting123",
      phoneNumber: "3001111002",
      address: "Carrera 45 #67-89, Medellín",
      birthDate: new Date("2006-08-20"),
      identification: "1001001002",
      status: "Active",
      documentTypeId: cedulaType.id,
      roleId: deportistaRole.id
    }
  });

  const athlete2 = await prisma.athlete.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      status: "Active",
      currentInscriptionStatus: "Active"
    }
  });

  await prisma.inscription.create({
    data: {
      athleteId: athlete2.id,
      sportsCategoryId: sub17.id,
      status: "Active",
      expirationDate: new Date("2024-12-31"),
      concept: "Inscripción anual 2024 - Sub-17"
    }
  });

  // Deportista 3 - Sub-15
  const user3 = await prisma.user.upsert({
    where: { email: "juan.martinez@fundacion.com" },
    update: {},
    create: {
      firstName: "Juan",
      lastName: "Martinez",
      email: "juan.martinez@fundacion.com",
      passwordHash: "$2b$10$TempPasswordHashForTesting123",
      phoneNumber: "3001111003",
      address: "Diagonal 25 #56-78, Barranquilla",
      birthDate: new Date("2008-03-25"),
      identification: "1001001003",
      status: "Active",
      documentTypeId: cedulaType.id,
      roleId: deportistaRole.id
    }
  });

  const athlete3 = await prisma.athlete.upsert({
    where: { userId: user3.id },
    update: {},
    create: {
      userId: user3.id,
      status: "Active",
      currentInscriptionStatus: "Active"
    }
  });

  await prisma.inscription.create({
    data: {
      athleteId: athlete3.id,
      sportsCategoryId: sub15.id,
      status: "Active",
      expirationDate: new Date("2024-12-31"),
      concept: "Inscripción anual 2024 - Sub-15"
    }
  });

  console.log("\n✅ Seed completado exitosamente!");
  console.log("📊 DEPORTISTAS CREADOS:");
  console.log("   Sub-17:");
  console.log("   • María Gonzalez - ID: 1001001001");
  console.log("   • Carlos Rodriguez - ID: 1001001002");
  console.log("   Sub-15:");
  console.log("   • Juan Martinez - ID: 1001001003");
  console.log("\n💡 Ahora puedes probar el módulo de equipos!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed de equipos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });