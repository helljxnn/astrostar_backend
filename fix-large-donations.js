// Script para corregir donaciones con valores muy grandes
// Ejecutar con: node fix-large-donations.js

import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function fixLargeDonations() {
  try {
    console.log('🔍 Buscando donaciones con valores muy grandes...\n');

    // Buscar detalles con montos mayores a 1 billón (probablemente errores)
    const largeDetails = await prisma.donationDetail.findMany({
      where: {
        amount: {
          gt: 1000000000, // Mayor a 1 mil millones
        },
      },
      include: {
        donation: true,
      },
    });

    if (largeDetails.length === 0) {
      console.log('✅ No se encontraron donaciones con valores anormalmente grandes.');
      return;
    }

    console.log(`⚠️  Se encontraron ${largeDetails.length} detalles con valores muy grandes:\n`);

    largeDetails.forEach((detail, index) => {
      console.log(`${index + 1}. Detalle #${detail.id}`);
      console.log(`   Donación: ${detail.donation.code}`);
      console.log(`   Monto actual: $${Number(detail.amount).toLocaleString('es-CO')}`);
      console.log(`   Tipo: ${detail.donation.type}`);
      console.log('');
    });

    console.log('\n📝 Opciones de corrección:\n');
    console.log('1. Dividir por 1,000,000 (si el valor está en centavos o tiene 6 ceros extra)');
    console.log('2. Dividir por 100 (si el valor está en centavos)');
    console.log('3. Establecer un valor razonable (ej: $100,000)');
    console.log('4. Eliminar estas donaciones de prueba\n');

    // Opción automática: dividir por 1,000,000 si es mayor a 1 billón
    console.log('🔧 Aplicando corrección automática (dividir por 1,000,000)...\n');

    for (const detail of largeDetails) {
      const currentAmount = Number(detail.amount);
      const newAmount = currentAmount / 1000000;

      console.log(`Corrigiendo detalle #${detail.id}:`);
      console.log(`  Antes: $${currentAmount.toLocaleString('es-CO')}`);
      console.log(`  Después: $${newAmount.toLocaleString('es-CO')}`);

      await prisma.donationDetail.update({
        where: { id: detail.id },
        data: { amount: newAmount },
      });

      console.log('  ✅ Corregido\n');
    }

    console.log('✅ Todas las donaciones han sido corregidas.');
    console.log('\n💡 Recarga el dashboard para ver los valores actualizados.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
fixLargeDonations();
