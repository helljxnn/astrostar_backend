import "dotenv/config";
import { PrismaClient } from "./generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

console.log("🔍 Verificando configuración de Prisma 7...");

try {
  // Test adapter creation
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  console.log("✅ Adapter PostgreSQL creado correctamente");

  // Test PrismaClient creation
  const prisma = new PrismaClient({ adapter });
  console.log("✅ PrismaClient creado correctamente");

  // Test database connection
  await prisma.$connect();
  console.log("✅ Conexión a la base de datos exitosa");

  await prisma.$disconnect();
  console.log("✅ Desconexión exitosa");

  console.log("\n🎉 ¡Prisma 7 configurado correctamente!");
} catch (error) {
  console.error("❌ Error en la configuración:", error.message);
  process.exit(1);
}
