import { Router } from 'express';
import { authController } from '../controllers/auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/social', authController.socialLogin);


router.post('/forgot-password', authController.forgotPassword);
router.put('/reset-password', authController.resetPassword);

export default router;
