import express from 'express';
import roleRoutes from '../modules/Roles/routes/roles.routes.js';

const router = express.Router();

// Module routes
router.use('/roles', roleRoutes);

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running!',
    timestamp: new Date().toISOString(),
    modules: ['Roles']
  });
});

export default router;