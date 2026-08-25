import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { protect, admin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', protect, notificationController.getNotifications);
router.post('/broadcast', protect, admin, notificationController.broadcastNotification);
router.put('/mark-all-read', protect, notificationController.markAllAsRead);
router.put('/:id/read', protect, notificationController.markAsRead);

export default router;
