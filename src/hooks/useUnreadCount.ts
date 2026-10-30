import { useEffect, useState } from 'react';
import { notificationService } from '../api/services/notification.service';
import { tokenStorage } from '../utils/tokenStorage';

let count = 0;
let inFlight: Promise<number> | null = null;
const listeners = new Set<(n: number) => void>();

export async function refreshUnreadCount(): Promise<number> {
  const token = await tokenStorage.getToken();
  if (!token) {
    count = 0;
    listeners.forEach((l) => l(0));
    return 0;
  }

  if (!inFlight) {
    inFlight = (async () => {
      try {
        const data = await notificationService.getNotifications();
        const unread = Array.isArray(data) ? data.filter((n) => !n.isRead).length : 0;
        count = unread;
      } catch (error) {

      } finally {
        inFlight = null;
      }
      return count;
    })();
  }

  const result = await inFlight;
  listeners.forEach((l) => l(result));
  return result;
}

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
