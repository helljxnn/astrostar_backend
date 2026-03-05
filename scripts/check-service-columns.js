/**
 * Script para verificar las columnas de la tabla Service
 */

import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function checkServiceColumns() {
  console.log("🔍 Verificando columnas de la tabla Service...\n");

  try {
    // Consulta SQL directa para obtener las columnas
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'Service'
      ORDER BY ordinal_position;
    `;

    console.log("📊 Columnas encontradas en la tabla Service:\n");

    if (columns.length === 0) {
      console.log(
        "⚠️  No se encontraron columnas. Verifica el nombre de la tabla.",
      );
      console.log("   Intentando con minúsculas...\n");

      const columnsLower = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'service'
        ORDER BY ordinal_position;
      `;

      if (columnsLower.length > 0) {
        columnsLower.forEach((col, index) => {
          console.log(
            `${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === "YES" ? "- nullable" : "- not null"}`,
          );
        });
      }
    } else {
      columns.forEach((col, index) => {
        console.log(
          `${index + 1}. ${col.column_name} (${col.data_type}) ${col.is_nullable === "YES" ? "- nullable" : "- not null"}`,
        );
      });
    }

    // Buscar específicamente la columna 'existe'
    console.log('\n🔍 Buscando columna "existe"...\n');

    const existeColumn = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name IN ('Service', 'service')
        AND column_name = 'existe';
    `;

    if (existeColumn.length > 0) {
      console.log("❌ PROBLEMA ENCONTRADO:");
      console.log('   La columna "existe" SÍ existe en la base de datos');
      console.log("   pero NO está en el schema de Prisma.\n");
      console.log("💡 SOLUCIÓN:");
      console.log("   Ejecuta: npx prisma db pull");
      console.log(
        "   Esto sincronizará el schema con la base de datos actual.\n",
      );
    } else {
      console.log('✅ La columna "existe" NO existe en la base de datos.');
      console.log(
        "   El problema puede estar en el cliente de Prisma generado.\n",
      );
      console.log("💡 SOLUCIÓN:");
      console.log("   1. Elimina la carpeta generated/prisma");
      console.log("   2. Ejecuta: npx prisma generate");
      console.log("   3. Reinicia el backend\n");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error fatal:", error);
    process.exit(1);
  });
