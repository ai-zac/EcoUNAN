import { Router } from 'express';
import { recycleController } from '../controllers/recycle.controller';
import { protect, validator } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();


router.post('/register', protect, upload.single('proofImage'), recycleController.registerRecycle);
router.get('/history', protect, recycleController.getUserHistory);
router.get('/user/:id/stats', protect, recycleController.getUserStats);


router.get('/pending', protect, validator, recycleController.getPendingRecycles);
router.put('/:id/validate', protect, validator, recycleController.validateRecycle);
router.put('/:id/reject', protect, validator, recycleController.rejectRecycle);


router.get('/:id/approval-qr', protect, validator, recycleController.getApprovalQr);
router.post('/confirm-presential', protect, recycleController.confirmPresential);

export default router;
