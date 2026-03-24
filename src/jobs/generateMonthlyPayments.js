import cron from 'node-cron';
import { paymentsService } from '../modules/Payments/services/payments.service.js';

/**
 * Job para generar mensualidades automáticamente
 * Se ejecuta el día 1 de cada mes a las 00:01
 */
const generateMonthlyPaymentsJob = cron.schedule('1 0 1 * *', async () => {
  console.log('[CRON] Starting monthly obligations generation...');
  
  try {
    const result = await paymentsService.generateMonthlyObligations();
    
    console.log('[CRON] Monthly obligations generated:', {
      periodo: result.period,
      creadas: result.created,
      omitidas: result.skipped,
      errores: result.errors
    });

    // Si hay errores, registrarlos
    if (result.errors > 0) {
      const errorDetails = result.details.filter(d => d.status === 'error');
      console.error('[CRON] Errors during monthly obligations generation:', errorDetails);
    }

  } catch (error) {
    console.error('[CRON] Critical error during monthly obligations generation:', error);
  }
}, {
  scheduled: false, // No iniciar automáticamente
  timezone: "America/Bogota"
});

/**
 * Job para procesar matrículas vencidas
 * Se ejecuta diariamente a las 02:00
 * 
 * FLUJO AUTOMÁTICO:
 * 1. Procesa matrículas vencidas (marca como 'Vencida')
 * 2. Para cada matrícula vencida, genera obligación ENROLLMENT_RENEWAL
 * 3. Deportista ve obligación en "Mis Pagos"
 * 4. Al aprobar pago, sistema crea nueva matrícula automáticamente
 */
const processExpiredEnrollmentsJob = cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Starting expired enrollments processing...');
  
  try {
    const now = new Date();
    
    // Importar dinámicamente para evitar dependencias circulares
    const { enrollmentsService } = await import('../modules/Enrollments/services/enrollments.service.js');
    
    const result = await enrollmentsService.processExpiredEnrollments();
    
    console.log('[CRON] Expired enrollments processed:', {
      procesadas: result.processed,
      errores: result.errors
    });

    // Para cada matrícula vencida, generar obligación de renovación automáticamente
    if (result.processed > 0) {
      const processedEnrollments = result.details.filter(d => d.status === 'processed');
      
      console.log(`[CRON] Generating ${processedEnrollments.length} renewal obligations...`);
      
      for (const enrollment of processedEnrollments) {
        try {
          await paymentsService.generateEnrollmentRenewalObligation(enrollment.athleteId);
          console.log(`[CRON] Renewal obligation created for athlete ${enrollment.athleteId} (${enrollment.athleteName})`);
        } catch (error) {
          // Si ya existe obligación, no es error crítico
          if (error.message.includes('Ya existe una obligación')) {
            console.log(`[CRON] Athlete ${enrollment.athleteId} already has a pending renewal obligation`);
          } else {
            console.error(`[CRON] Error creating renewal obligation for athlete ${enrollment.athleteId}:`, error.message);
          }
        }
      }
      
      console.log('[CRON] Renewal obligations processing completed');
    } else {
      console.log('[CRON] No expired enrollments to process today');
    }

  } catch (error) {
    console.error('[CRON] Critical error processing expired enrollments:', error);
  }
}, {
  scheduled: false,
  timezone: "America/Bogota"
});

/**
 * Inicializar jobs de pagos
 */
export const initializePaymentJobs = () => {
  console.log('[JOBS] Initializing payment jobs...');
  
  // Iniciar jobs
  generateMonthlyPaymentsJob.start();
  processExpiredEnrollmentsJob.start();
  
  console.log('[JOBS] Payment jobs initialized:');
  console.log('   - Monthly obligations generation: 1st day of each month at 00:01');
  console.log('   - Expired enrollments processing: daily at 02:00');
};

/**
 * Detener jobs de pagos
 */
export const stopPaymentJobs = () => {
  generateMonthlyPaymentsJob.stop();
  processExpiredEnrollmentsJob.stop();
  console.log('[JOBS] Payment jobs stopped');
};

// Exportar jobs individuales para testing
export {
  generateMonthlyPaymentsJob,
  processExpiredEnrollmentsJob
};
