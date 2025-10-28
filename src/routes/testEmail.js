/**
 * Rutas de prueba para el servicio de email
 * Solo disponible en modo desarrollo
 */

import { Router } from 'express';
import emailService from '../services/emailService.js';

const router = Router();

// Solo permitir en desarrollo
if (process.env.NODE_ENV === 'development') {
  
  /**
   * @swagger
   * /api/test/email:
   *   post:
   *     summary: Probar envío de email (solo desarrollo)
   *     tags: [Test]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "test@example.com"
   *               firstName:
   *                 type: string
   *                 example: "Juan"
   *               lastName:
   *                 type: string
   *                 example: "Pérez"
   *     responses:
   *       200:
   *         description: Email enviado exitosamente
   *       400:
   *         description: Error en los datos
   *       500:
   *         description: Error del servidor
   */
  router.post('/email', async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      if (!email || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Email, firstName y lastName son requeridos'
        });
      }

      const employeeData = { email, firstName, lastName };
      const credentials = { 
        email, 
        temporaryPassword: 'TestPass123!' 
      };

      const result = await emailService.sendWelcomeEmail(employeeData, credentials);

      res.json({
        success: result.success,
        message: result.success ? 'Email de prueba enviado exitosamente' : 'Error enviando email',
        details: result
      });
    } catch (error) {
      console.error('Error en test de email:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  });

  /**
   * @swagger
   * /api/test/email/verify:
   *   get:
   *     summary: Verificar configuración de email
   *     tags: [Test]
   *     responses:
   *       200:
   *         description: Estado de la configuración de email
   */
  router.get('/email/verify', async (req, res) => {
    try {
      const isConnected = await emailService.verifyConnection();
      
      res.json({
        success: true,
        emailServiceAvailable: isConnected,
        configuration: {
          emailUser: process.env.EMAIL_USER || 'No configurado',
          smtpHost: process.env.SMTP_HOST || 'No configurado',
          smtpPort: process.env.SMTP_PORT || 'No configurado',
          environment: process.env.NODE_ENV || 'development'
        },
        message: isConnected 
          ? 'Servicio de email configurado correctamente' 
          : 'Servicio de email no disponible'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error verificando servicio de email',
        error: error.message
      });
    }
  });
}

export default router;