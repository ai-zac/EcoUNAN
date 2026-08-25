import { Types } from 'mongoose';
import Notification from '../models/notification.model';
import User from '../models/user.model';

/**
 * Envia un push via Expo Push API. Nunca lanza:
 * un fallo de push no debe romper el flujo de negocio.
 */
async function sendExpoPush(to: string, title: string, body: string): Promise<void> {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, sound: 'default', title, body }),
    });
    const receipt = await response.json();
    // Expo responde 200 aunque el ticket sea invalido: revisar estado
    const ticket = Array.isArray(receipt?.data) ? receipt.data[0] : receipt?.data;
    if (ticket?.status === 'error') {
      console.error(`[push] Expo rechazo el token: ${ticket.message}`);
    } else {
      console.log('[push] Enviado correctamente');
    }
  } catch (error) {
    console.error('[push] Error llamando a Expo Push:', error);
  }
}

/**
 * Crea la notificacion in-app y, si el usuario tiene expoPushToken,
 * envia tambien la notificacion push real.
 */
export async function notifyUser(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  try {
    const notification = new Notification({
      user: new Types.ObjectId(userId),
      title,
      message,
      isRead: false,
    });
    await notification.save();

    const user = await User.findById(userId).select('expoPushToken');
    if (user?.expoPushToken) {
      await sendExpoPush(user.expoPushToken, title, message);
    }
  } catch (error) {
    console.error('[notifyUser] fallo silencioso:', error);
  }
}
