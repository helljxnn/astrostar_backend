import { Router } from 'express';

import authRoutes from '../modules/Auth/routes/auth.routes.js';
import roleRoutes from '../modules/Roles/routes/roles.routes.js';
import employeeRoutes from '../modules/Services/Employees/routes/employees.routes.js';
import usersRoutes from '../modules/Users/routes/users.routes.js';
import providerRoutes from '../modules/Providers/routes/providers.routes.js';
import documentTypesRoutes from './documentTypes.routes.js';
import sportsCategoryRoutes from '../modules/Athletes/SportsCategory/routes/sportsCategory.routes.js';
import uploadRoutes from '../shared/routes/upload.routes.js';


import testEmailRoutes from './testEmail.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/employees', employeeRoutes);
router.use('/users', usersRoutes);
router.use('/providers', providerRoutes);
router.use('/document-types', documentTypesRoutes);
router.use('/sports-categories', sportsCategoryRoutes);


router.use('/upload', uploadRoutes);

if (process.env.NODE_ENV === 'development') {
  router.use('/test', testEmailRoutes);
}

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running!',
    timestamp: new Date().toISOString(),
  });
});

export default router;
