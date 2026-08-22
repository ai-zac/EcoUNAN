import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

// Protect all admin routes with protect & admin middlewares
router.use(protect, admin);

router.get('/dashboard', adminController.getDashboardStats);

export default router;
