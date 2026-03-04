/**
 * Job para procesar matrículas vencidas automáticamente
 * Se ejecuta diariamente a las 00:00
 */

import cron from 'node-cron';
import { enrollmentsService } from '../modules/Enrollments/services/enrollments.service.js';

export const startEnrollmentExpirationJob = () => {
  // Ejecutar todos los días a las 00:00 (medianoche)
  cron.schedule('0 0 * * *', async () => {
    console.log('🕐 [CRON] Iniciando verificación de matrículas vencidas...');
    console.log(`📅 Fecha: ${new Date().toISOString()}`);
    
    try {
      const result = await enrollmentsService.processExpiredEnrollments();
      
      console.log('✅ [CRON] Verificación completada:');
      console.log(`   - Matrículas procesadas: ${result.processed}`);
      console.log(`   - Errores: ${result.errors}`);
      
      if (result.processed > 0) {
        console.log('\n📋 Detalles:');
        result.details
          .filter(d => d.status === 'processed')
          .forEach(detail => {
            console.log(`   ✅ ${detail.athleteName} - Matrícula ${detail.enrollmentId} vencida el ${detail.fechaVencimiento.toISOString().split('T')[0]}`);
          });
      }
      
      if (result.errors > 0) {
        console.log('\n❌ Errores:');
        result.details
          .filter(d => d.status === 'error')
          .forEach(detail => {
            console.log(`   ❌ Matrícula ${detail.enrollmentId}: ${detail.error}`);
          });
      }
    } catch (error) {
      console.error('❌ [CRON] Error en verificación de matrículas:', error);
    }
  });

  console.log('✅ Job de vencimiento de matrículas iniciado (se ejecuta diariamente a las 00:00)');
};

// También exportar función para ejecutar manualmente
export const runEnrollmentExpirationCheck = async () => {
  console.log('🔄 Ejecutando verificación manual de matrículas vencidas...');
  try {
    const result = await enrollmentsService.processExpiredEnrollments();
    console.log('✅ Verificación manual completada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error en verificación manual:', error);
    throw error;
  }
};
