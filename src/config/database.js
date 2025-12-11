import { PrismaClient } from '../../generated/prisma/index.js';

console.log('🔍 PrismaClient importado:', typeof PrismaClient);

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

console.log('🔍 Instancia de prisma creada:', typeof prisma);
console.log('🔍 prisma.user existe:', typeof prisma.user);

// Graceful shutdown (opcional, solo en procesos que terminan)
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('🔌 Prisma disconnected on app termination');
  process.exit(0);
});

export default prisma;
