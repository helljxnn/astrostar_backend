import { PrismaClient } from "../../generated/prisma/index.js";

const isDevelopment = process.env.NODE_ENV !== "production";

const prisma = new PrismaClient({
  log: isDevelopment ? ["query", "info", "warn", "error"] : ["warn", "error"],
});

// Graceful shutdown (opcional, solo en procesos que terminan)
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("[INFO] Prisma disconnected on app termination");
  process.exit(0);
});

export default prisma;
