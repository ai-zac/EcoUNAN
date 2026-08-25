import { useEffect, useState } from 'react';
import { notificationService } from '../api/services/notification.service';

// Store compartido a nivel de modulo: un solo fetch alimenta todos los badges
let count = 0;
let inFlight: Promise<void> | null = null;
const listeners = new Set<(n: number) => void>();

export async function refreshUnreadCount(): Promise<number> {
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const data = await notificationService.getNotifications();
        count = data.filter(n => !n.isRead).length;
      } catch (error) {
        console.error('Error fetching unread count:', error);
      } finally {
        inFlight = null;
      }
    })();
  }
  await inFlight;
  listeners.forEach(l => l(count));
  return count;
}

/** Suscribe un componente al contador global de notificaciones no leidas */
export function useUnreadCount(): number {
  const [value, setValue] = useState(count);

  useEffect(() => {
    listeners.add(setValue);
    refreshUnreadCount();
    return () => {
      listeners.delete(setValue);
    };
  }, []);

  return value;
}
