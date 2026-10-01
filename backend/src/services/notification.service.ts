import { Types } from 'mongoose';
import Notification from '../models/notification.model';
import User from '../models/user.model';

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

    // Enviar push en segundo plano sin retener sockets de base de datos ni bloquear el endpoint
    setImmediate(async () => {
      try {
        const user = await User.findById(userId).select('expoPushToken');
        if (user?.expoPushToken) {
          await sendExpoPush(user.expoPushToken, title, message);
        }
      } catch (pushErr) {
        console.error('[push:background] Error:', pushErr);
      }
    });
  } catch (error) {
    console.error('[notifyUser] fallo silencioso:', error);
  }
}

export async function createInitialUserNotifications(userId: string | Types.ObjectId): Promise<void> {
  try {
    const count = await Notification.countDocuments({ user: new Types.ObjectId(String(userId)) as any });
    if (count > 0) return;

    await Notification.insertMany([
      {
        user: new Types.ObjectId(String(userId)),
        title: '¡Bienvenido a EcoUNAN! 🌱',
        message: '¡Gracias por unirte al cambio ecológico! Escanea los códigos QR en los centros de acopio autorizados para acumular EcoPuntos y subir de rango.',
        isRead: false,
        createdAt: new Date(),
      },
      {
        user: new Types.ObjectId(String(userId)),
        title: 'Metas ecológicas disponibles 🎯',
        message: 'Participa en los desafíos semanales y mensuales de reciclaje para ganar recompensas y puntos extra.',
        isRead: false,
        createdAt: new Date(),
      },
      {
        user: new Types.ObjectId(String(userId)),
        title: 'Recompensas listas para canjear 🎁',
        message: 'Revisa el catálogo de recompensas: termos, kits de libretas ecológicas y beneficios estudiantiles te esperan.',
        isRead: false,
        createdAt: new Date(),
      },
    ]);
  } catch (error) {
    console.error('[createInitialUserNotifications] Error:', error);
  }
}

export async function notifyAllUsers(
  title: string,
  message: string,
  excludeUserId?: string
): Promise<void> {
  try {
    const filter: any = { isActive: { $ne: false } };
    if (excludeUserId) {
      filter._id = { $ne: new Types.ObjectId(excludeUserId) };
    }
    const users = await User.find(filter).select('_id expoPushToken');
    if (!users.length) return;

    // Guardar un solo documento global de broadcast con user: null
    await Notification.create({
      user: null,
      title,
      message,
      isRead: false,
      isBroadcast: true,
      createdAt: new Date(),
    });

    // Enviar push a los usuarios que tengan token de Expo
    const pushTokens = users
      .map((u) => u.expoPushToken)
      .filter((t): t is string => Boolean(t && t.startsWith('ExponentPushToken')));

    if (pushTokens.length > 0) {
      const messages = pushTokens.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body: message,
      }));

      for (let i = 0; i < messages.length; i += 100) {
        const chunk = messages.slice(i, i + 100);
        try {
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chunk),
          });
        } catch (err) {
          console.error('[notifyAllUsers] error enviando lote push:', err);
        }
      }
    }
  } catch (error) {
    console.error('[notifyAllUsers] fallo silencioso:', error);
  }
}
