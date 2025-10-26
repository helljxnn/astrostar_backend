import prisma from "../config/database.js";

export async function testDatabaseConnection() {
  try {
    console.log("🔄 Testing database connection...");

    // Test connection
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Test database queries
    console.log("🔍 Testing database queries...");

    const rolesCount = await prisma.role.count();
    console.log(`📊 Total roles in database: ${rolesCount}`);

    const usersCount = await prisma.user.count();
    console.log(`👥 Total users in database: ${usersCount}`);

    // Test role creation and permissions structure
    const sampleRole = await prisma.role.findFirst({
      where: { name: "Administrador" },
    });

    if (sampleRole) {
      console.log("🛡️ Admin role found:", {
        id: sampleRole.id,
        name: sampleRole.name,
        status: sampleRole.status,
        hasPermissions: !!sampleRole.permissions,
      });
    } else {
      console.log("⚠️ Admin role not found in database");

      // Create admin role if it doesn't exist
      console.log("🔧 Creating admin role...");
      const adminRole = await prisma.role.create({
        data: {
          name: "Administrador",
          description: "Rol de administrador con acceso completo al sistema",
          status: "Active",
          permissions: {
            Users: {
              Create: true,
              Read: true,
              Update: true,
              Delete: true,
            },
            Roles: {
              Create: true,
              Read: true,
              Update: true,
              Delete: true,
            },
            Athletes: {
              Create: true,
              Read: true,
              Update: true,
              Delete: true,
            },
            Events: {
              Create: true,
              Read: true,
              Update: true,
              Delete: true,
            },
            Services: {
              Create: true,
              Read: true,
              Update: true,
              Delete: true,
            },
          },
        },
      });
      console.log("✅ Admin role created:", adminRole.name);
    }

    // Create a test role if no roles exist
    if (rolesCount === 0) {
      console.log("🔧 Creating test roles...");

      await prisma.role.create({
        data: {
          name: "Editor",
          description: "Rol de editor con permisos limitados",
          status: "Active",
          permissions: {
            Users: {
              Create: false,
              Read: true,
              Update: true,
              Delete: false,
            },
            Athletes: {
              Create: true,
              Read: true,
              Update: true,
              Delete: false,
            },
          },
        },
      });

      await prisma.role.create({
        data: {
          name: "Visualizador",
          description: "Rol de solo lectura",
          status: "Active",
          permissions: {
            Users: {
              Create: false,
              Read: true,
              Update: false,
              Delete: false,
            },
            Athletes: {
              Create: false,
              Read: true,
              Update: false,
              Delete: false,
            },
          },
        },
      });

      console.log("✅ Test roles created");
    }

    console.log("✅ All database tests passed!");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("📋 Error details:", {
      code: error.code,
      meta: error.meta,
    });
    return false;
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Database connection closed");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseConnection();
}
