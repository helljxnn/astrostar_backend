import cron from 'node-cron';
import { paymentsService } from '../modules/Payments/services/payments.service.js';

/**
 * Job para generar mensualidades automáticamente
 * Se ejecuta el día 1 de cada mes a las 00:01
 */
const generateMonthlyPaymentsJob = cron.schedule('1 0 1 * *', async () => {
  console.log('🔄 [CRON] Iniciando generación de mensualidades...');
  
  try {
    const result = await paymentsService.generateMonthlyObligations();
    
    console.log('✅ [CRON] Mensualidades generadas exitosamente:', {
      periodo: result.period,
      creadas: result.created,
      omitidas: result.skipped,
      errores: result.errors
    });

    // Si hay errores, registrarlos
    if (result.errors > 0) {
      const errorDetails = result.details.filter(d => d.status === 'error');
      console.error('❌ [CRON] Errores en generación de mensualidades:', errorDetails);
    }

  } catch (error) {
    console.error('❌ [CRON] Error crítico en generación de mensualidades:', error);
  }
}, {
  scheduled: false, // No iniciar automáticamente
  timezone: "America/Bogota"
});

/**
 * Job para procesar matrículas vencidas
 * Se ejecuta diariamente a las 02:00
 */
const processExpiredEnrollmentsJob = cron.schedule('0 2 * * *', async () => {
  console.log('🔄 [CRON] Verificando matrículas vencidas...');
  
  try {
    // Importar dinámicamente para evitar dependencias circulares
    const { enrollmentsService } = await import('../modules/Enrollments/services/enrollments.service.js');
    
    const result = await enrollmentsService.processExpiredEnrollments();
    
    console.log('✅ [CRON] Matrículas vencidas procesadas:', {
      procesadas: result.processed,
      errores: result.errors
    });

    // Para cada matrícula vencida, generar obligación de renovación
    if (result.processed > 0) {
      const processedEnrollments = result.details.filter(d => d.status === 'processed');
      
      for (const enrollment of processedEnrollments) {
        try {
          await paymentsService.generateEnrollmentRenewalObligation(enrollment.athleteId);
          console.log(`✅ [CRON] Obligación de renovación creada para atleta ${enrollment.athleteId}`);
        } catch (error) {
          console.error(`❌ [CRON] Error creando obligación de renovación para atleta ${enrollment.athleteId}:`, error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ [CRON] Error crítico procesando matrículas vencidas:', error);
  }
}, {
  scheduled: false,
  timezone: "America/Bogota"
});

/**
 * Inicializar jobs de pagos
 */
export const initializePaymentJobs = () => {
  console.log('🚀 [JOBS] Inicializando jobs de gestión de pagos...');
  
  // Iniciar jobs
  generateMonthlyPaymentsJob.start();
  processExpiredEnrollmentsJob.start();
  
  console.log('✅ [JOBS] Jobs de pagos inicializados:');
  console.log('   - Generación mensualidades: 1ro de cada mes a las 00:01');
  console.log('   - Procesamiento matrículas vencidas: Diario a las 02:00');
};

/**
 * Detener jobs de pagos
 */
export const stopPaymentJobs = () => {
  generateMonthlyPaymentsJob.stop();
  processExpiredEnrollmentsJob.stop();
  console.log('🛑 [JOBS] Jobs de pagos detenidos');
};

// Exportar jobs individuales para testing
export {
  generateMonthlyPaymentsJob,
  processExpiredEnrollmentsJob
};