import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function updateMovementMessages() {
  try {
    console.log("🔄 Iniciando actualización de mensajes...\n");

    // 1. Obtener todos los movimientos con mensajes en inglés
    const movementsToUpdate = await prisma.materialMovement.findMany({
      where: {
        OR: [
          { observaciones: { contains: "Reverted assignment from event" } },
          { observaciones: { contains: "[REVERSION]" } },
          { observaciones: { contains: "Assigned to event (ID:" } },
        ],
      },
      include: {
        evento: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log(
      `📊 Encontrados ${movementsToUpdate.length} movimientos para actualizar\n`,
    );

    let updated = 0;
    let errors = 0;

    // 2. Actualizar cada movimiento
    for (const movement of movementsToUpdate) {
      try {
        let newObservaciones = movement.observaciones;

        // Determinar el nuevo mensaje
        if (
          movement.observaciones.includes("Reverted assignment") ||
          movement.observaciones.includes("[REVERSION]")
        ) {
          // Es una reversión
          if (movement.evento) {
            newObservaciones = `Reversión de asignación al evento "${movement.evento.name}"`;
          } else {
            newObservaciones = `Reversión de asignación al evento (ID: ${movement.eventoId})`;
          }
        } else if (movement.observaciones.includes("Assigned to event")) {
          // Es una asignación
          if (movement.evento) {
            newObservaciones = `Asignado al evento "${movement.evento.name}"`;
          } else {
            newObservaciones = `Asignado al evento (ID: ${movement.eventoId})`;
          }
        }

        // Actualizar en la base de datos
        await prisma.materialMovement.update({
          where: { id: movement.id },
          data: { observaciones: newObservaciones },
        });

        console.log(`✅ Actualizado: ${movement.materialNombre}`);
        console.log(`   Antes: ${movement.observaciones}`);
        console.log(`   Ahora: ${newObservaciones}\n`);
        updated++;
      } catch (error) {
        console.error(
          `❌ Error actualizando movimiento ${movement.id}:`,
          error.message,
        );
        errors++;
      }
    }

    console.log("\n📈 Resumen:");
    console.log(`   ✅ Actualizados: ${updated}`);
    console.log(`   ❌ Errores: ${errors}`);
    console.log(`   📊 Total: ${movementsToUpdate.length}`);

    // 3. Verificar los cambios
    const verificacion = await prisma.materialMovement.count({
      where: {
        OR: [
          { observaciones: { contains: "Reversión de asignación al evento" } },
          { observaciones: { contains: "Asignado al evento" } },
        ],
      },
    });

    console.log(`\n✨ Movimientos en español: ${verificacion}`);
  } catch (error) {
    console.error("❌ Error general:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
updateMovementMessages();
