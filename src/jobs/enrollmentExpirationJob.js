/**
 * Job para procesar matrículas vencidas automáticamente
 * Se ejecuta diariamente a las 00:00
 */

import cron from 'node-cron';
import { enrollmentsService } from '../modules/Enrollments/services/enrollments.service.js';

export const startEnrollmentExpirationJob = () => {
  // Ejecutar todos los días a las 00:00 (medianoche)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Starting expired enrollments check...');
    console.log(`[CRON] Date: ${new Date().toISOString()}`);
    
    try {
      const result = await enrollmentsService.processExpiredEnrollments();
      
      console.log('[CRON] Expired enrollments check completed:');
      console.log(`   - Processed enrollments: ${result.processed}`);
      console.log(`   - Errors: ${result.errors}`);
      
      if (result.processed > 0) {
        console.log('\n[CRON] Details:');
        result.details
          .filter(d => d.status === 'processed')
          .forEach(detail => {
            console.log(`   - ${detail.athleteName} - Enrollment ${detail.enrollmentId} expired on ${detail.fechaVencimiento.toISOString().split('T')[0]}`);
          });
      }
      
      if (result.errors > 0) {
        console.log('\n[CRON] Errors:');
        result.details
          .filter(d => d.status === 'error')
          .forEach(detail => {
            console.log(`   - Enrollment ${detail.enrollmentId}: ${detail.error}`);
          });
      }
    } catch (error) {
      console.error('[CRON] Error while checking expired enrollments:', error);
    }
  });

  console.log('[CRON] Expired enrollments job started (daily at 00:00).');
};

// También exportar función para ejecutar manualmente
export const runEnrollmentExpirationCheck = async () => {
  console.log('[CRON] Running manual expired enrollments check...');
  try {
    const result = await enrollmentsService.processExpiredEnrollments();
    console.log('[CRON] Manual expired enrollments check completed:', result);
    return result;
  } catch (error) {
    console.error('[CRON] Error in manual expired enrollments check:', error);
    throw error;
  }
};

