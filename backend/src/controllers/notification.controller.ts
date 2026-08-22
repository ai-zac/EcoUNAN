import { Request, Response } from 'express';
import Notification from '../models/notification.model';

export class NotificationController {
  // @desc    Get user notifications (both specific and global)
  // @route   GET /api/notifications
  // @access  Private
  public async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;

      // Find notifications specifically for this user, OR global notifications (user is null/undefined)
      const notifications = await Notification.find({
        $or: [
          { user: userId },
          { user: { $exists: false } },
          { user: null }
        ]
      }).sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: notifications });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // @desc    Mark a notification as read
  // @route   PUT /api/notifications/:id/read
  // @access  Private
  public async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const notification = await Notification.findById(req.params.id);
      
      if (!notification) {
        res.status(404).json({ success: false, error: 'Notificación no encontrada' });
        return;
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({ success: true, data: notification });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const notificationController = new NotificationController();
