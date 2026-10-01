import { Request, Response } from 'express';
import Notification from '../models/notification.model';
import { createInitialUserNotifications, notifyAllUsers } from '../services/notification.service';

export class NotificationController {
  public async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;

      const userNotificationCount = await Notification.countDocuments({ user: userId as any });
      if (userNotificationCount === 0) {
        await createInitialUserNotifications(userId);
      }

      const notifications = await Notification.find({
        $or: [{ user: userId as any }, { user: null }, { isBroadcast: true }],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const userStrId = String(userId);
      const sanitized = notifications.map((doc: any) => {
        const isBroadcast = !doc.user || doc.isBroadcast;
        const isReadForUser = isBroadcast
          ? (doc.isRead === true || (Array.isArray(doc.readBy) && doc.readBy.some((uid: any) => String(uid) === userStrId)))
          : Boolean(doc.isRead);

        if (doc.title) {
          doc.title = doc.title
            .replace(/Â¡/g, '¡')
            .replace(/ðŸŽ¯/g, '🎯')
            .replace(/ðŸŽ/g, '🎁')
            .replace(/â™»ï¸/g, '♻️');
        }
        if (doc.message) {
          doc.message = doc.message
            .replace(/Â¡/g, '¡')
            .replace(/ðŸŽ¯/g, '🎯')
            .replace(/ðŸŽ/g, '🎁')
            .replace(/â™»ï¸/g, '♻️');
        }
        return {
          ...doc,
          isRead: isReadForUser,
        };
      });

      res.status(200).json({ success: true, data: sanitized });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;

      await Promise.all([
        Notification.updateMany(
          { user: userId, isRead: false },
          { $set: { isRead: true } }
        ),
        Notification.updateMany(
          { $or: [{ user: null }, { isBroadcast: true }] },
          { $addToSet: { readBy: userId } }
        ),
      ]);

      res.status(200).json({ success: true, message: 'Todas las notificaciones fueron marcadas como leídas' });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;
      const notifId = req.params.id;

      const notification = await Notification.findById(notifId);
      if (!notification) {
        res.status(404).json({ success: false, error: 'Notificación no encontrada' });
        return;
      }

      const isBroadcast = !notification.user || notification.isBroadcast;

      if (isBroadcast) {

        await Notification.updateOne(
          { _id: notifId },
          { $addToSet: { readBy: userId } }
        );
      } else {

        if (String(notification.user) !== String(userId)) {
          res.status(403).json({ success: false, error: 'No autorizado para esta notificación' });
          return;
        }
        notification.isRead = true;
        await notification.save();
      }

      res.status(200).json({
        success: true,
        data: {
          ...notification.toObject(),
          isRead: true,
        },
      });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async broadcastNotification(req: Request, res: Response): Promise<void> {
    try {
      const { title, message } = req.body;
      if (!title || !message) {
        res.status(400).json({ success: false, error: 'title y message son obligatorios' });
        return;
      }
      await notifyAllUsers(title, message);
      res.status(200).json({ success: true, message: 'Notificación enviada en masa a todos los usuarios' });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
}

export const notificationController = new NotificationController();
