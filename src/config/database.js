import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Graceful shutdown (opcional, solo en procesos que terminan)
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🔌 Prisma disconnected on app termination');
  process.exit(0);
});

export default prisma;
