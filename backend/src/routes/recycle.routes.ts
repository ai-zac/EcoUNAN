import { Router } from 'express';
import { recycleController } from '../controllers/recycle.controller';
import { protect, validator } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Protected routes (User)
router.post('/register', protect, upload.single('proofImage'), recycleController.registerRecycle);
router.post('/scan-qr', protect, recycleController.scanQR);
router.get('/history', protect, recycleController.getUserHistory);

// Rutas de staff: brigadistas, admins y superadmin
router.get('/pending', protect, validator, recycleController.getPendingRecycles);
router.put('/:id/validate', protect, validator, recycleController.validateRecycle);
router.put('/:id/reject', protect, validator, recycleController.rejectRecycle);

// Flujo presencial: QR de aprobacion que el brigadista muestra y el estudiante escanea
router.get('/:id/approval-qr', protect, validator, recycleController.getApprovalQr);
router.post('/confirm-presential', protect, recycleController.confirmPresential);

export default router;
