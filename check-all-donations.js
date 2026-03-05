// Script para ver TODAS las donaciones y sus montos
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkAllDonations() {
  try {
    console.log('📊 Verificando TODAS las donaciones...\n');

    const details = await prisma.donationDetail.findMany({
      include: {
        donation: true,
      },
      orderBy: {
        amount: 'desc',
      },
    });

    console.log(`Total de detalles: ${details.length}\n`);

    details.forEach((detail, index) => {
      const amount = Number(detail.amount || 0);
      console.log(`${index + 1}. Detalle #${detail.id} - Donación: ${detail.donation.code}`);
      console.log(`   Monto: $${amount.toLocaleString('es-CO')}`);
      console.log(`   Tipo: ${detail.donation.type} - ${detail.recordType}`);
      console.log('');
    });

    // Calcular totales
    const total = details.reduce((sum, d) => sum + Number(d.amount || 0), 0);
    console.log(`\n💰 Total de todos los montos: $${total.toLocaleString('es-CO')}`);

    // Encontrar el más grande
    const largest = details[0];
    if (largest) {
      console.log(`\n🔝 Monto más grande: $${Number(largest.amount).toLocaleString('es-CO')}`);
      console.log(`   Donación: ${largest.donation.code}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllDonations();
