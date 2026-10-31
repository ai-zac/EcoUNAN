import { useState, useEffect, useRef } from 'react';
import type * as NotificationsTypes from 'expo-notifications';

export const ENABLE_PUSH_NOTIFICATIONS = false;

export const usePushNotifications = (_userToken?: string) => {
  const [expoPushToken] = useState<string | undefined>(undefined);
  const [notification] = useState<NotificationsTypes.Notification | false>(false);

  useEffect(() => {
    if (!ENABLE_PUSH_NOTIFICATIONS) {

      return;
    }
  }, []);

  return { expoPushToken, notification };
};
