/**
 * SEED DE DATOS MAESTROS DEL SISTEMA ASTROSTAR
 *
 * Este archivo carga los datos esenciales que el sistema necesita para funcionar:
 * - Tipos de documento (obligatorios para usuarios)
 * - Rol de Administrador (crítico para acceso inicial)
 *
 * Estos datos son considerados "maestros" y no deben ser modificados por usuarios finales.
 * Se ejecuta automáticamente en la inicialización de la base de datos.
 */

import { PrismaClient } from "../generated/prisma/index.js";
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
        sportsEquipment: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        employees: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        employeesSchedule: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        appointmentManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
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
        },
        athletesAssistance: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        donorsSponsors: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        donationsManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        eventsManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        temporaryWorkers: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        temporaryTeams: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
        providers: { Ver: true, Crear: true, Editar: true, Eliminar: true },
        purchasesManagement: {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        },
      },
    },
  });

  console.log(`   ✓ ${adminRole.name} configurado correctamente\n`);

  // CATEGORÍAS DE EVENTOS
  console.log("🏆 Configurando categorías de eventos...");
  await prisma.eventCategory.createMany({
    data: [
      {
        name: "Deportivo",
        description: "Eventos relacionados con actividades deportivas y competencias"
      },
      {
        name: "Cultural",
        description: "Eventos culturales y artísticos"
      },
      {
        name: "Recreativo",
        description: "Actividades recreativas y de esparcimiento"
      },
      {
        name: "Formativo",
        description: "Talleres, capacitaciones y eventos educativos"
      },
      {
        name: "Social",
        description: "Eventos sociales y comunitarios"
      }
    ],
    skipDuplicates: true
  });
  console.log("   ✓ Categorías de eventos configuradas\n");

  // TIPOS DE EVENTOS
  console.log("📅 Configurando tipos de eventos...");
  await prisma.serviceType.createMany({
    data: [
      {
        name: "Festival",
        description: "Evento festivo con múltiples actividades - Inscripción: Equipos"
      },
      {
        name: "Torneo",
        description: "Competencia deportiva con múltiples participantes - Inscripción: Equipos"
      },
      {
        name: "Clausura",
        description: "Evento de cierre o finalización - Inscripción: Deportistas"
      },
      {
        name: "Taller",
        description: "Actividad formativa práctica - Inscripción: Deportistas"
      }
    ],
    skipDuplicates: true
  });
  console.log("   ✓ Tipos de eventos configurados\n");

  // PATROCINADORES (DATOS QUEMADOS TEMPORALES)
  console.log("💼 Configurando patrocinadores temporales...");
  await prisma.sponsor.createMany({
    data: [
      {
        name: "Deportes XYZ",
        description: "Tienda especializada en artículos deportivos",
        contactEmail: "contacto@deportesxyz.com",
        phone: "+57 300 1234567",
        website: "https://deportesxyz.com",
        status: "Active"
      },
      {
        name: "Banco Nacional",
        description: "Entidad financiera comprometida con el deporte",
        contactEmail: "patrocinios@banconacional.com",
        phone: "+57 300 7654321",
        website: "https://banconacional.com",
        status: "Active"
      },
      {
        name: "Bebidas Energéticas Power",
        description: "Marca líder en bebidas deportivas",
        contactEmail: "marketing@power.com",
        phone: "+57 301 1112233",
        website: "https://power.com",
        status: "Active"
      },
      {
        name: "Ropa Deportiva Elite",
        description: "Fabricante de indumentaria deportiva de alta calidad",
        contactEmail: "ventas@elite.com",
        phone: "+57 302 4445566",
        website: "https://elite.com",
        status: "Active"
      },
      {
        name: "Alcaldía Municipal",
        description: "Gobierno local apoyando el deporte comunitario",
        contactEmail: "deportes@alcaldia.gov.co",
        phone: "+57 303 7778899",
        status: "Active"
      }
    ],
    skipDuplicates: true
  });
  console.log("   ✓ Patrocinadores temporales configurados\n");

  console.log("🎉 Seed completado exitosamente!");
  console.log("📊 Resumen:");
  console.log("   • Tipos de documento: Configurados");
  console.log("   • Rol Administrador: Listo para usar");
  console.log("   • Categorías de eventos: Configuradas");
  console.log("   • Tipos de eventos: Configurados");
  console.log("   • Patrocinadores temporales: Configurados");
  console.log(
    "\n💡 El sistema está listo para crear el primer usuario administrador."
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
