import express from 'express';
import roleRoutes from '../modules/Roles/routes/roles.routes.js';
import employeeRoutes from '../modules/Services/Employees/routes/employees.routes.js';
import usersRoutes from '../modules/Users/routes/users.routes.js';
import providerRoutes from '../modules/Providers/routes/providers.routes.js'
import documentTypesRoutes from './documentTypes.routes.js';
import testEmailRoutes from './testEmail.js';

const router = express.Router();

// Module routes
router.use('/roles', roleRoutes);
router.use('/employees', employeeRoutes);
router.use('/users', usersRoutes); 
router.use('/providers', providerRoutes);
router.use('/document-types', documentTypesRoutes);  



// Test routes (only in development)
if (process.env.NODE_ENV === 'development') {
  router.use('/test', testEmailRoutes);
}

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running!',
    timestamp: new Date().toISOString(),
    modules: ['Roles', 'Employees', 'Users','Providers', 'DocumentTypes']  
  });
});

export default router;