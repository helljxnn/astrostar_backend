import { Router } from "express";
import { paymentsController } from "../controllers/payments.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";

const router = Router();

// Ruta simple para probar
router.get('/test', (req, res) => {
  res.json({ message: 'Payments routes working' });
});

// Rutas básicas sin validadores complejos
router.get('/pending', authenticateToken, paymentsController.getPendingPayments);
router.get('/all', authenticateToken, paymentsController.getAllPayments);
router.get('/monthly-management', authenticateToken, paymentsController.getMonthlyPaymentsManagement);

export default router;

