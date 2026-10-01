import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { protect, validator } from '../middlewares/auth.middleware';

const router = Router();


router.use(protect, validator);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/activity', adminController.getActivityLog);
router.get('/redemptions', adminController.getAllRedemptions);
router.put('/redemptions/:id/complete', adminController.completeRedemption);
router.put('/redemptions/:id/cancel', adminController.cancelRedemption);
router.post('/redemptions/scan', adminController.scanRedemptionQR);

export default router;
