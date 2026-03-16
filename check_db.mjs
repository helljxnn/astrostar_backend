import { PrismaClient } from './generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRawUnsafe(`
    SELECT table_schema, table_name, column_name 
    FROM information_schema.columns 
    WHERE column_name = 'existe'
    ORDER BY table_schema, table_name
  `);
  console.log('Columnas "existe" encontradas:', JSON.stringify(cols, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
