/**
 * Script de diagnóstico para identificar eventos problemáticos
 * Ejecutar: node scripts/diagnose-events-error.js
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function diagnoseEvents() {
  console.log("🔍 DIAGNÓSTICO DE EVENTOS\n");
  console.log("=".repeat(60));

  try {
    // 1. Contar eventos totales
    const totalEvents = await prisma.service.count();
    console.log(`\n📊 Total de eventos en la base de datos: ${totalEvents}`);

    if (totalEvents === 0) {
      console.log("\n⚠️  No hay eventos en la base de datos.");
      console.log("   Crea algunos eventos para probar.");
      return;
    }

    // 2. Obtener todos los eventos con sus relaciones
    console.log("\n🔍 Obteniendo eventos con relaciones...");
    const events = await prisma.service.findMany({
      include: {
        serviceSportsCategories: {
          include: {
            sportsCategory: true,
          },
        },
        event_categories: true,
        ServiceType: true,
        ServiceSponsor: {
          include: {
            Sponsor: true,
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`✅ Obtenidos ${events.length} eventos\n`);

    // 3. Analizar cada evento
    let problemsFound = 0;
    const problems = [];

    events.forEach((event, index) => {
      const eventProblems = [];
      const eventNum = index + 1;

      // Verificar campos básicos
      if (!event.name) eventProblems.push("❌ Sin nombre");
      if (!event.startDate) eventProblems.push("❌ Sin fecha de inicio");
      if (!event.endDate) eventProblems.push("❌ Sin fecha de fin");
      if (!event.startTime) eventProblems.push("❌ Sin hora de inicio");
      if (!event.endTime) eventProblems.push("❌ Sin hora de fin");
      if (!event.status) eventProblems.push("❌ Sin estado");

      // Verificar relaciones
      if (event.serviceSportsCategories) {
        event.serviceSportsCategories.forEach((ssc, i) => {
          if (!ssc.sportsCategory) {
            eventProblems.push(`❌ Categoría deportiva ${i + 1} es NULL`);
          } else {
            if (!ssc.sportsCategory.nombre) {
              eventProblems.push(`❌ Categoría deportiva ${i + 1} sin nombre`);
            }
            if (
              ssc.sportsCategory.edadMinima === null ||
              ssc.sportsCategory.edadMinima === undefined
            ) {
              eventProblems.push(
                `❌ Categoría deportiva ${i + 1} sin edad mínima`,
              );
            }
            if (
              ssc.sportsCategory.edadMaxima === null ||
              ssc.sportsCategory.edadMaxima === undefined
            ) {
              eventProblems.push(
                `❌ Categoría deportiva ${i + 1} sin edad máxima`,
              );
            }
          }
        });
      }

      if (event.ServiceSponsor) {
        event.ServiceSponsor.forEach((ss, i) => {
          if (!ss.Sponsor) {
            eventProblems.push(`❌ Patrocinador ${i + 1} es NULL`);
          } else if (!ss.Sponsor.name) {
            eventProblems.push(`❌ Patrocinador ${i + 1} sin nombre`);
          }
        });
      }

      // Mostrar resultado
      if (eventProblems.length > 0) {
        problemsFound++;
        console.log(`\n${eventNum}. ⚠️  EVENTO CON PROBLEMAS`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Nombre: ${event.name || "SIN NOMBRE"}`);
        console.log(`   Estado: ${event.status || "SIN ESTADO"}`);
        console.log(`   Problemas encontrados:`);
        eventProblems.forEach((p) => console.log(`      ${p}`));

        problems.push({
          id: event.id,
          name: event.name,
          problems: eventProblems,
        });
      } else {
        console.log(`${eventNum}. ✅ ${event.name} (ID: ${event.id})`);
      }
    });

    // 4. Resumen
    console.log("\n" + "=".repeat(60));
    console.log("\n📊 RESUMEN DEL DIAGNÓSTICO\n");
    console.log(`Total de eventos: ${events.length}`);
    console.log(`Eventos con problemas: ${problemsFound}`);
    console.log(`Eventos correctos: ${events.length - problemsFound}`);

    if (problemsFound > 0) {
      console.log("\n⚠️  ACCIÓN REQUERIDA:");
      console.log(
        "   Los siguientes eventos tienen problemas y deben corregirse:\n",
      );

      problems.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
        console.log(`      Problemas: ${p.problems.length}`);
      });

      console.log("\n💡 SOLUCIONES:");
      console.log("   1. Ejecutar: node scripts/fix-events-null-times.js");
      console.log("   2. O corregir manualmente cada evento en el dashboard");
      console.log(
        "   3. O eliminar eventos problemáticos si no son necesarios",
      );
    } else {
      console.log("\n✅ TODOS LOS EVENTOS ESTÁN CORRECTOS");
      console.log("   Si aún hay error 500, el problema puede ser:");
      console.log("   - Error en el código de transformación");
      console.log("   - Problema de conexión a la base de datos");
      console.log("   - Error en otro módulo");
    }

    // 5. Intentar transformar eventos (simular lo que hace el backend)
    console.log("\n🧪 PROBANDO TRANSFORMACIÓN DE EVENTOS...\n");

    let transformErrors = 0;
    events.forEach((event, index) => {
      try {
        // Simular la transformación
        const transformed = {
          id: event.id,
          name: event.name,
          categories: event.serviceSportsCategories
            ? event.serviceSportsCategories
                .filter((ssc) => ssc && ssc.sportsCategory)
                .map((ssc) => ({
                  id: ssc.sportsCategory.id,
                  name: ssc.sportsCategory.nombre || "Sin nombre",
                  ageRange: `${ssc.sportsCategory.edadMinima || 0}-${ssc.sportsCategory.edadMaxima || 0} años`,
                }))
            : [],
          sponsors: event.ServiceSponsor
            ? event.ServiceSponsor.filter((ss) => ss && ss.Sponsor).map(
                (ss) => ({
                  id: ss.id,
                  sponsor: {
                    id: ss.Sponsor.id,
                    name: ss.Sponsor.name,
                  },
                }),
              )
            : [],
        };
        console.log(
          `   ✅ Evento ${index + 1}/${events.length}: ${event.name}`,
        );
      } catch (error) {
        transformErrors++;
        console.log(
          `   ❌ Evento ${index + 1}/${events.length}: ${event.name}`,
        );
        console.log(`      Error: ${error.message}`);
      }
    });

    if (transformErrors === 0) {
      console.log("\n✅ TODOS LOS EVENTOS SE TRANSFORMARON CORRECTAMENTE");
      console.log("   El problema puede estar en otro lugar.");
    } else {
      console.log(`\n❌ ${transformErrors} eventos fallaron al transformarse`);
      console.log("   Estos eventos causarán el error 500.");
    }
  } catch (error) {
    console.error("\n❌ ERROR FATAL:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ Diagnóstico completado\n");
}

// Ejecutar
diagnoseEvents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
