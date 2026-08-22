import { Router } from 'express';
import { recycleController } from '../controllers/recycle.controller';
import { protect, admin } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Protected routes (User)
router.post('/register', protect, upload.single('proofImage'), recycleController.registerRecycle);
router.post('/scan-qr', protect, recycleController.scanQR);
router.get('/history', protect, recycleController.getUserHistory);

// Admin routes
router.get('/pending', protect, admin, recycleController.getPendingRecycles);
router.put('/:id/validate', protect, admin, recycleController.validateRecycle);
router.put('/:id/reject', protect, admin, recycleController.rejectRecycle);

export default router;
