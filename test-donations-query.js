// Script de prueba para verificar donaciones en la base de datos
// Ejecutar con: node test-donations-query.js

import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function testDonations() {
  try {
    console.log('🔍 Verificando donaciones en la base de datos...\n');

    // Contar donaciones
    const totalDonations = await prisma.donation.count();
    console.log(`📊 Total de donaciones: ${totalDonations}`);

    if (totalDonations === 0) {
      console.log('⚠️  No hay donaciones registradas en la base de datos.');
      console.log('   Crea algunas donaciones desde el formulario primero.\n');
      return;
    }

    // Obtener donaciones con detalles
    const donations = await prisma.donation.findMany({
      take: 10,
      include: {
        details: true,
        donorSponsor: true,
      },
      orderBy: {
        donationAt: 'desc',
      },
    });

    console.log(`\n📋 Últimas ${donations.length} donaciones:\n`);

    donations.forEach((d, index) => {
      console.log(`${index + 1}. Donación #${d.id} (${d.code})`);
      console.log(`   Tipo: ${d.type}`);
      console.log(`   Estado: ${d.status}`);
      console.log(`   Fecha: ${d.donationAt.toLocaleDateString('es-CO')}`);
      console.log(`   Donante: ${d.donorSponsor?.name || 'Anónimo'}`);
      console.log(`   Detalles: ${d.details.length} items`);
      
      d.details.forEach((detail, idx) => {
        console.log(`     ${idx + 1}. ${detail.recordType}: $${detail.amount || 0}`);
      });
      console.log('');
    });

    // Calcular totales
    const economicas = await prisma.donation.findMany({
      where: {
        type: 'ECONOMICA',
        status: { not: 'Anulada' },
      },
      include: {
        details: {
          where: {
            recordType: 'payment',
          },
        },
      },
    });

    const totalEconomicas = economicas.reduce((sum, d) => {
      const payment = d.details.find(det => det.recordType === 'payment');
      return sum + (payment?.amount ? Number(payment.amount) : 0);
    }, 0);

    console.log(`💰 Total donaciones económicas: $${totalEconomicas.toLocaleString('es-CO')}`);

    // Verificar estructura de respuesta del endpoint
    console.log('\n🔧 Estructura de respuesta esperada:');
    console.log(JSON.stringify({
      success: true,
      data: donations.slice(0, 2),
      pagination: {
        total: totalDonations,
        page: 1,
        limit: 10,
      },
    }, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testDonations();
