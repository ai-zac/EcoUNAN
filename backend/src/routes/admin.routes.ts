import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

// Protect all admin routes with protect & admin middlewares
router.use(protect, admin);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/redemptions', adminController.getAllRedemptions);
router.get('/signed-qr', adminController.getSignedQr);
router.put('/redemptions/:id/complete', adminController.completeRedemption);
router.put('/redemptions/:id/cancel', adminController.cancelRedemption);

export default router;
