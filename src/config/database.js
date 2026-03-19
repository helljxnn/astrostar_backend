import { PrismaClient } from "../../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const isDevelopment = process.env.NODE_ENV !== "production";

// Create PostgreSQL adapter
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: isDevelopment ? ["query", "info", "warn", "error"] : ["warn", "error"],
});

// Graceful shutdown (opcional, solo en procesos que terminan)
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("[INFO] Prisma disconnected on app termination");
  process.exit(0);
});

export default prisma;
