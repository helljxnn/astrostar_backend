// Script para ELIMINAR TODAS las donaciones
// Ejecutar con: node delete-all-donations.js

import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function deleteAllDonations() {
  try {
    console.log('⚠️  ADVERTENCIA: Este script eliminará TODAS las donaciones.\n');
    
    // Contar donaciones actuales
    const count = await prisma.donation.count();
    console.log(`📊 Donaciones actuales: ${count}\n`);

    if (count === 0) {
      console.log('✅ No hay donaciones para eliminar.');
      return;
    }

    console.log('🗑️  Eliminando todas las donaciones...\n');

    // Eliminar en orden (por las relaciones)
    const deletedFiles = await prisma.donationFile.deleteMany({});
    console.log(`✅ Archivos eliminados: ${deletedFiles.count}`);

    const deletedTransactions = await prisma.donationTransaction.deleteMany({});
    console.log(`✅ Transacciones eliminadas: ${deletedTransactions.count}`);

    const deletedDetails = await prisma.donationDetail.deleteMany({});
    console.log(`✅ Detalles eliminados: ${deletedDetails.count}`);

    const deletedDonations = await prisma.donation.deleteMany({});
    console.log(`✅ Donaciones eliminadas: ${deletedDonations.count}`);

    console.log('\n✅ Todas las donaciones han sido eliminadas.');
    console.log('💡 Ahora puedes crear nuevas donaciones con valores reales desde el formulario.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllDonations();
