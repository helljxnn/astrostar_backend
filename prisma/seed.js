/**
 * SEED DE DATOS MAESTROS DEL SISTEMA ASTROSTAR
 *
 * Este archivo carga los datos esenciales que el sistema necesita para funcionar:
 * - Tipos de documento (obligatorios para usuarios)
 * - Rol de Administrador (crítico para acceso inicial)
 * - Usuario Administrador por defecto
 *
 * Estos datos son considerados "maestros" y no deben ser modificados por usuarios finales.
 * Se ejecuta automáticamente en la inicialización de la base de datos.
 */

import { PrismaClient } from "../generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de datos maestros del sistema...\n");
  // TIPOS DE DOCUMENTO VÁLIDOS EN COLOMBIA
  console.log("📄 Configurando tipos de documento...");
  await prisma.documentType.createMany({
    data: [
      {
        name: "Cédula de Ciudadanía",
        description: "Documento de identidad para ciudadanos colombianos",
      },
      {
        name: "Tarjeta de Identidad",
        description: "Documento de identidad para menores de edad",
      },
      {
        name: "Permiso de Permanencia",
        description: "Documento para extranjeros con permiso de permanencia",
      },
      {
        name: "Tarjeta de Extranjería",
        description: "Documento de identidad para extranjeros",
      },
      {
        name: "Cédula de Extranjería",
        description: "Documento de identidad para extranjeros residentes",
      },
      {
        name: "Número de Identificación Tributaria",
        description: "Documento de identificación tributaria",
      },
      {
        name: "Pasaporte",
        description: "Documento de identidad internacional",
      },
      {
        name: "Número de Identificación Extranjero",
        description: "Documento de identificación para extranjeros",
      },
    ],
    skipDuplicates: true,
  });

  // ROL DE ADMINISTRADOR (CRÍTICO PARA EL SISTEMA)
  console.log("👑 Configurando rol de Administrador...");
  const adminRole = await prisma.role.upsert({
    where: { name: "Administrador" },
    update: {}, // No actualizar si ya existe
    create: {
      name: "Administrador",
      description:
        "Acceso completo al sistema con todos los permisos. Este rol no puede ser eliminado.",
      permissions: {
        // Permisos completos para todos los módulos
        dashboard: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        users: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        roles: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        materials: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        materialCategories: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        materialsRegistry: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        employees: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
        employeesSchedule: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        appointmentManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        sportsCategory: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        athletesSection: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        athletesAssistance: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        donorsSponsors: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        donationsManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        eventsManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        temporaryWorkers: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        temporaryTeams: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
        providers: { Ver: true, Crear: true, Editar: true, Eliminar: true, Listar: true },
        purchasesManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
          Listar: true,
        },
      },
    },
  });

  console.log(`   ✓ ${adminRole.name} configurado correctamente\n`);

  // USUARIO ADMINISTRADOR POR DEFECTO
  console.log("👤 Configurando usuario administrador por defecto...");

  // Verificar si ya existe el usuario
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "astrostar.java@gmail.com" },
  });

  if (!existingAdmin) {
    // Obtener el tipo de documento "Cédula de Ciudadanía"
    const documentType = await prisma.documentType.findFirst({
      where: { name: "Cédula de Ciudadanía" },
    });

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash("Admin123*", 10);

    await prisma.user.create({
      data: {
        firstName: "Administrador",
        middleName: "del",
        lastName: "Sistema",
        secondLastName: "Astrostar",
        identification: "1000000000",
        documentTypeId: documentType.id,
        email: "astrostar.java@gmail.com",
        passwordHash: hashedPassword,
        phoneNumber: "+57 300 0000000",
        address: "Sede Principal Astrostar",
        birthDate: new Date("1990-01-01"),
        age: 34,
        roleId: adminRole.id,
        status: "Active",
      },
    });

    console.log("   ✓ Usuario administrador creado exitosamente");
    console.log("   📧 Email: astrostar.java@gmail.com");
    console.log("   🔑 Contraseña: Admin123*\n");
  } else {
    console.log("   ℹ️  Usuario administrador ya existe\n");
  }

  // USUARIO PARA MOBILE
  console.log("📱 Configurando usuario para aplicación móvil...");

  const existingMobileUser = await prisma.user.findUnique({
    where: { email: "astrostarmovil@gmail.com" },
  });

  if (!existingMobileUser) {
    const documentType = await prisma.documentType.findFirst({
      where: { name: "Cédula de Ciudadanía" },
    });

    const hashedPasswordMobile = await bcrypt.hash("Astrostar123!", 10);

    await prisma.user.create({
      data: {
        firstName: "Usuario",
        middleName: "Móvil",
        lastName: "Astrostar",
        secondLastName: "App",
        identification: "1000000001",
        documentTypeId: documentType.id,
        email: "astrostarmovil@gmail.com",
        passwordHash: hashedPasswordMobile,
        phoneNumber: "+57 300 0000001",
        address: "App Móvil Astrostar",
        birthDate: new Date("1995-01-01"),
        age: 29,
        roleId: adminRole.id,
        status: "Active",
      },
    });

    console.log("   ✓ Usuario móvil creado exitosamente");
    console.log("   📧 Email: astrostarmovil@gmail.com");
    console.log("   🔑 Contraseña: Astrostar123!\n");
  } else {
    console.log("   ℹ️  Usuario móvil ya existe\n");
  }

  // CATEGORÍAS DE EVENTOS
  console.log("🏆 Configurando categorías de eventos...");
  await prisma.eventCategory.createMany({
    data: [
      {
        name: "Deportivo",
        description:
          "Eventos relacionados con actividades deportivas y competencias",
      },
      {
        name: "Cultural",
        description: "Eventos culturales y artísticos",
      },
      {
        name: "Recreativo",
        description: "Actividades recreativas y de esparcimiento",
      },
      {
        name: "Formativo",
        description: "Talleres, capacitaciones y eventos educativos",
      },
      {
        name: "Social",
        description: "Eventos sociales y comunitarios",
      },
    ],
    skipDuplicates: true,
  });
  console.log("   ✓ Categorías de eventos configuradas\n");

  // TIPOS DE EVENTOS
  console.log("📅 Configurando tipos de eventos...");

  const eventTypes = [
    {
      name: "Festival",
      description:
        "Evento festivo con múltiples actividades - Inscripción: Equipos",
    },
    {
      name: "Torneo",
      description:
        "Competencia deportiva con múltiples participantes - Inscripción: Equipos",
    },
    {
      name: "Clausura",
      description: "Evento de cierre o finalización - Inscripción: Deportistas",
    },
    {
      name: "Taller",
      description: "Actividad formativa práctica - Inscripción: Deportistas",
    },
  ];

  for (const eventType of eventTypes) {
    try {
      await prisma.serviceType.create({
        data: eventType,
      });
    } catch (error) {
      // Si ya existe, actualizar
      if (error.code === "P2002") {
        await prisma.serviceType.updateMany({
          where: { name: eventType.name },
          data: { description: eventType.description },
        });
      } else {
        throw error;
      }
    }
  }

  console.log("   ✓ Tipos de eventos configurados\n");

  console.log("DEBUG: Antes de categorías deportivas");

  // CATEGORÍAS DEPORTIVAS
  console.log("🏅 Configurando categorías deportivas...");
  await prisma.sportsCategory.createMany({
    data: [
      {
        nombre: "Infantil",
        edadMinima: 10,
        edadMaxima: 12,
        descripcion: "Categoría infantil para niños de 10 a 12 años",
        estado: "Activo",
        publicar: true,
      },
      {
        nombre: "PreJuvenil",
        edadMinima: 13,
        edadMaxima: 15,
        descripcion: "Categoría prejuvenil para adolescentes de 13 a 15 años",
        estado: "Activo",
        publicar: true,
      },
      {
        nombre: "Juvenil",
        edadMinima: 16,
        edadMaxima: 18,
        descripcion: "Categoría juvenil para jóvenes de 16 a 18 años",
        estado: "Activo",
        publicar: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log("   ✓ Categorías deportivas configuradas\n");

  console.log("🎉 Seed completado exitosamente!");
  console.log("📊 Resumen:");
  console.log("   • Tipos de documento: Configurados");
  console.log("   • Rol Administrador: Listo para usar");
  console.log("   • Usuario Administrador: Creado");
  console.log("   • Categorías de eventos: Configuradas");
  console.log("   • Tipos de eventos: Configurados");
  console.log(
    "   • Categorías deportivas: Configuradas (Infantil, PreJuvenil, Juvenil)",
  );
  console.log("\n💡 Puedes iniciar sesión con:");
  console.log("   📧 Email: astrostar.java@gmail.com");
  console.log("   🔑 Contraseña: Admin123*");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




