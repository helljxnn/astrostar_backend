import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

async function fixMaterialsPermissions() {
  try {
    console.log("🔧 Iniciando corrección de permisos de materiales...\n");

    // Obtener todos los roles activos
    const roles = await prisma.role.findMany({
      where: {
        status: "Active",
      },
    });

    console.log(`📋 Se encontraron ${roles.length} roles activos\n`);

    for (const role of roles) {
      console.log(`\n🔍 Procesando rol: ${role.name}`);

      const permissions = role.permissions || {};
      let updated = false;

      // Verificar y actualizar permisos de materials
      if (!permissions.materials || !permissions.materials.Crear) {
        console.log(`  ⚠️  Falta permiso materials.Crear`);
        permissions.materials = {
          Ver: true,
          Crear: true,
          Editar: true,
          Eliminar: true,
        };
        updated = true;
      } else {
        console.log(`  ✅ Permiso materials.Crear ya existe`);
      }

      // Verificar y actualizar permisos de materialCategories (mínimo Ver)
      if (
        !permissions.materialCategories ||
        !permissions.materialCategories.Ver
      ) {
        console.log(`  ⚠️  Falta permiso materialCategories.Ver`);
        permissions.materialCategories = {
          Ver: true,
          Crear: permissions.materialCategories?.Crear || false,
          Editar: permissions.materialCategories?.Editar || false,
          Eliminar: permissions.materialCategories?.Eliminar || false,
        };
        updated = true;
      } else {
        console.log(`  ✅ Permiso materialCategories.Ver ya existe`);
      }

      // Actualizar el rol si hubo cambios
      if (updated) {
        await prisma.role.update({
          where: { id: role.id },
          data: { permissions },
        });
        console.log(`  ✅ Permisos actualizados para rol: ${role.name}`);
      } else {
        console.log(`  ℹ️  No se requieren cambios para rol: ${role.name}`);
      }
    }

    console.log("\n\n✅ Proceso completado exitosamente");
    console.log(
      "\n⚠️  IMPORTANTE: Los usuarios deben cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto.\n",
    );
  } catch (error) {
    console.error("\n❌ Error al actualizar permisos:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
fixMaterialsPermissions();
