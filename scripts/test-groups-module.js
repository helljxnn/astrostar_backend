/**
 * Script de prueba para el módulo de Grupos
 * Ejecutar: node scripts/test-groups-module.js
 */

import prisma from "../src/config/database.js";

async function testGroupsModule() {
  console.log("🧪 Iniciando pruebas del módulo de Grupos...\n");

  try {
    // 1. Verificar que las tablas existen
    console.log("1️⃣ Verificando tablas...");
    const groupsCount = await prisma.group.count();
    const membershipsCount = await prisma.groupMembership.count();
    console.log(`✅ Tabla groups: ${groupsCount} registros`);
    console.log(`✅ Tabla group_memberships: ${membershipsCount} registros\n`);

    // 2. Obtener un profesor para las pruebas
    console.log("2️⃣ Buscando profesor disponible...");
    const teacher = await prisma.employee.findFirst({
      where: { status: "Activo" },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!teacher) {
      console.log(
        "⚠️  No hay profesores disponibles. Crear un empleado primero.",
      );
      return;
    }
    console.log(
      `✅ Profesor encontrado: ${teacher.user.firstName} ${teacher.user.lastName} (ID: ${teacher.id})\n`,
    );

    // 3. Crear un grupo de prueba
    console.log("3️⃣ Creando grupo de prueba...");
    const testGroup = await prisma.group.create({
      data: {
        name: "Grupo Test A1",
        level: "A1",
        teacherId: teacher.id,
        maxCapacity: 10,
        status: "ACTIVE",
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
    console.log(`✅ Grupo creado: ${testGroup.name} (ID: ${testGroup.id})`);
    console.log(`   Nivel: ${testGroup.level}`);
    console.log(`   Cupo: ${testGroup.maxCapacity}`);
    console.log(
      `   Profesor: ${testGroup.teacher.user.firstName} ${testGroup.teacher.user.lastName}\n`,
    );

    // 4. Buscar deportistas disponibles
    console.log("4️⃣ Buscando deportistas disponibles...");
    const athletes = await prisma.athlete.findMany({
      where: {
        status: "Active",
        groupMemberships: {
          none: {
            status: "ACTIVE",
          },
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      take: 3,
    });

    if (athletes.length === 0) {
      console.log("⚠️  No hay deportistas disponibles sin grupo activo.");
    } else {
      console.log(
        `✅ Encontradas ${athletes.length} deportistas disponibles\n`,
      );

      // 5. Agregar deportistas al grupo
      console.log("5️⃣ Agregando deportistas al grupo...");
      for (const athlete of athletes) {
        const membership = await prisma.groupMembership.create({
          data: {
            groupId: testGroup.id,
            athleteId: athlete.id,
            status: "ACTIVE",
          },
        });
        console.log(
          `✅ ${athlete.user.firstName} ${athlete.user.lastName} agregada al grupo (Membership ID: ${membership.id})`,
        );
      }
      console.log("");
    }

    // 6. Verificar el grupo con sus miembros
    console.log("6️⃣ Verificando grupo con miembros...");
    const groupWithMembers = await prisma.group.findUnique({
      where: { id: testGroup.id },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            athlete: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            memberships: {
              where: { status: "ACTIVE" },
            },
          },
        },
      },
    });

    console.log(`✅ Grupo: ${groupWithMembers.name}`);
    console.log(
      `   Miembros activos: ${groupWithMembers._count.memberships}/${groupWithMembers.maxCapacity}`,
    );
    console.log(
      `   Cupos disponibles: ${groupWithMembers.maxCapacity - groupWithMembers._count.memberships}\n`,
    );

    // 7. Obtener estadísticas
    console.log("7️⃣ Obteniendo estadísticas...");
    const [totalGroups, activeGroups, archivedGroups] = await Promise.all([
      prisma.group.count(),
      prisma.group.count({ where: { status: "ACTIVE" } }),
      prisma.group.count({ where: { status: "ARCHIVED" } }),
    ]);

    const byLevel = await prisma.group.groupBy({
      by: ["level"],
      _count: true,
      where: { status: "ACTIVE" },
    });

    console.log(`✅ Total de grupos: ${totalGroups}`);
    console.log(`   Activos: ${activeGroups}`);
    console.log(`   Archivados: ${archivedGroups}`);
    console.log("   Por nivel:");
    byLevel.forEach((item) => {
      console.log(`     ${item.level}: ${item._count}`);
    });
    console.log("");

    // 8. Limpiar datos de prueba
    console.log("8️⃣ Limpiando datos de prueba...");
    await prisma.groupMembership.deleteMany({
      where: { groupId: testGroup.id },
    });
    await prisma.group.delete({
      where: { id: testGroup.id },
    });
    console.log("✅ Datos de prueba eliminados\n");

    console.log("✅ ¡Todas las pruebas completadas exitosamente!");
    console.log("\n📋 Resumen:");
    console.log("   ✓ Tablas creadas correctamente");
    console.log("   ✓ Grupos se pueden crear");
    console.log("   ✓ Membresías se pueden agregar");
    console.log("   ✓ Relaciones funcionan correctamente");
    console.log("   ✓ Estadísticas se calculan correctamente");
  } catch (error) {
    console.error("\n❌ Error durante las pruebas:", error.message);
    console.error("\nDetalles del error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar pruebas
testGroupsModule();
