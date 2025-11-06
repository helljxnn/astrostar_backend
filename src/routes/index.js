import express from 'express';
import authRoutes from '../modules/Auth/routes/auth.routes.js';
import roleRoutes from '../modules/Roles/routes/roles.routes.js';
import employeeRoutes from '../modules/Services/Employees/routes/employees.routes.js';
import usersRoutes from '../modules/Users/routes/users.routes.js';
import providerRoutes from '../modules/Providers/routes/providers.routes.js';
import documentTypesRoutes from './documentTypes.routes.js';

// ➕ NUEVO: Módulo de Categorías Deportivas
import sportsCategoryRoutes from '../modules/Athletes/SportsCategory/routes/sportsCategory.routes.js';

// 🧪 Rutas de desarrollo
import testEmailRoutes from './testEmail.js';

const router = Router();

/**
 * ==================
 * Rutas de la API
 * ==================
 */

// Module routes
router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/employees', employeeRoutes);
router.use('/users', usersRoutes);
router.use('/providers', providerRoutes);
router.use('/document-types', documentTypesRoutes);
router.use('/sports-categories', sportsCategoryRoutes);

// Rutas de prueba (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  router.use('/test', testEmailRoutes);
}

/**
 * ==================
 * Endpoints globales
 * ==================
 */

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running!',
    timestamp: new Date().toISOString(),
    modules: ['Auth', 'Roles', 'Employees', 'Users','Providers', 'DocumentTypes']  
  });
});

export default router;