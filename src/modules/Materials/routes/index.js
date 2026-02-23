import express from 'express';
import materialsRoutes from './materials.routes.js';
import categoriesRoutes from './categories.routes.js';
import movementsRoutes from './movements.routes.js';
import reservationsRoutes from './reservations.routes.js';
import eventAssignmentsRoutes from './eventAssignments.routes.js';

const router = express.Router();

// Rutas del módulo de Materiales Deportivos
// Base: /api/materials
router.use('/materials/categories', categoriesRoutes);        // GET /api/materials/categories
router.use('/materials/material-movements', movementsRoutes); // GET /api/materials/material-movements
router.use('/materials/movements', movementsRoutes);          // GET /api/materials/movements (alias)
router.use('/materials/reservations', reservationsRoutes);    // GET /api/materials/reservations
router.use('/materials', eventAssignmentsRoutes);             // Rutas de asignaciones a eventos
router.use('/materials', materialsRoutes);                    // GET /api/materials

export default router;
