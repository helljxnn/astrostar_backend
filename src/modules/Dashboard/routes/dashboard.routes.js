import { Router } from "express";
import { dashboardController } from "../controllers/dashboard.controller.js";
import { authenticateToken } from "../../../middlewares/auth.js";
import { checkPermissions } from "../../../middlewares/checkPermissions.js";

const router = Router();

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Obtener resumen general del dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     kpis:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         totalAthletes:
 *                           type: integer
 *                         totalEvents:
 *                           type: integer
 *                         totalEmployees:
 *                           type: integer
 *                         totalDonations:
 *                           type: integer
 *                         totalPayments:
 *                           type: integer
 *                     recentActivity:
 *                       type: object
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/overview",
  authenticateToken,
  checkPermissions("dashboard", "Ver"),
  dashboardController.getOverview,
);

/**
 * @swagger
 * /api/dashboard/events:
 *   get:
 *     summary: Obtener estadísticas de eventos para el dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de eventos obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     upcoming:
 *                       type: integer
 *                     enrolledAthletes:
 *                       type: integer
 *                     enrolledTeams:
 *                       type: integer
 *                     byStatus:
 *                       type: object
 *                     byQuarter:
 *                       type: array
 *                     byType:
 *                       type: array
 *                     trends:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/events",
  authenticateToken,
  checkPermissions("dashboard", "Ver"),
  dashboardController.getEventsStats,
);

/**
 * @swagger
 * /api/dashboard/athletes:
 *   get:
 *     summary: Obtener estadísticas de deportistas para el dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de deportistas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     suspended:
 *                       type: integer
 *                     expired:
 *                       type: integer
 *                     byCategory:
 *                       type: array
 *                     byAge:
 *                       type: array
 *                     enrollmentStats:
 *                       type: object
 *                     trends:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/athletes",
  authenticateToken,
  checkPermissions("dashboard", "Ver"),
  dashboardController.getAthletesStats,
);

/**
 * @swagger
 * /api/dashboard/health:
 *   get:
 *     summary: Obtener estadísticas de servicios de salud para el dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de servicios de salud obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     appointments:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         completed:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         cancelled:
 *                           type: integer
 *                     employees:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         bySpecialty:
 *                           type: array
 *                     monthlyAppointments:
 *                       type: array
 *                     trends:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/health",
  authenticateToken,
  checkPermissions("dashboard", "Ver"),
  dashboardController.getHealthStats,
);

/**
 * @swagger
 * /api/dashboard/donations:
 *   get:
 *     summary: Obtener estadísticas de donaciones para el dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de donaciones obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     totalDonors:
 *                       type: integer
 *                     activeDonors:
 *                       type: integer
 *                     byType:
 *                       type: array
 *                     monthlyDonations:
 *                       type: array
 *                     topDonors:
 *                       type: array
 *                     trends:
 *                       type: integer
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  "/donations",
  authenticateToken,
  checkPermissions("dashboard", "Ver"),
  dashboardController.getDonationsStats,
);

export default router;
