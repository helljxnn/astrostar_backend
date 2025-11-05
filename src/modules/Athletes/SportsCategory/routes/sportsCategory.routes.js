// src/modules/Services/SportsCategory/routes/sportsCategory.routes.js

import { Router } from 'express';
import {SportsCategoryController } from '../controllers/sportsCategory.controller.js';
import { validateSportsCategory } from '../validators/sportsCategory.Validation.js';

// Instancia del enrutador y controlador
const router = Router();
const sportsCategoryController = new SportsCategoryController();

/**
 * ==============
 * Rutas públicas
 * ==============
 */

// Listar todas las categorías (con paginación y búsqueda)
router.get('/', sportsCategoryController.getAllSportsCategories);

// Obtener estadísticas generales
router.get('/stats', sportsCategoryController.getSportsCategoryStats);

// Verificar disponibilidad de nombre (útil para formularios en tiempo real)
router.get('/check-name', sportsCategoryController.checkCategoryNameAvailability);

// Obtener una categoría por ID
router.get('/:id', sportsCategoryController.getSportsCategoryById);

// Obtener los atletas inscritos en una categoría
router.get('/:id/athletes', sportsCategoryController.getAthletesByCategory);

/**
 * ================
 * Rutas protegidas
 * ================
 * (Descomenta los middlewares de autenticación y permisos cuando los implementes)
 */

// Crear una nueva categoría
router.post(
  '/',
  // authenticateToken,
  // checkPermission('sports_categories', 'create'),
  validateSportsCategory,
  sportsCategoryController.createSportsCategory
);

// Actualizar una categoría existente
router.put(
  '/:id',
  // authenticateToken,
  // checkPermission('sports_categories', 'update'),
  validateSportsCategory,
  sportsCategoryController.updateSportsCategory
);

// Eliminar una categoría (solo si está inactiva y sin relaciones)
router.delete(
  '/:id',
  // authenticateToken,
  // checkPermission('sports_categories', 'delete'),
  sportsCategoryController.deleteSportsCategory
);

export default router;   