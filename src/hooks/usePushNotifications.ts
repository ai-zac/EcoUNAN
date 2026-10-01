import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import type * as NotificationsTypes from 'expo-notifications';
import Constants from 'expo-constants';
import { apiClient } from '../api/apiClient';

const isExpoGoAndroid = Platform.OS === 'android' && (Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient');

let Notifications: typeof NotificationsTypes | null = null;

if (!isExpoGoAndroid) {
  try {
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('Could not load expo-notifications', e);
  }
}

export const usePushNotifications = (userToken?: string) => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<NotificationsTypes.Notification | false>(false);
  const notificationListener = useRef<NotificationsTypes.Subscription | null>(null);
  const responseListener = useRef<NotificationsTypes.Subscription | null>(null);

  useEffect(() => {
    if (isExpoGoAndroid || !Notifications) {
      console.log('Skipping push notifications setup on Android Expo Go');
      return;
    }
    
    if (!userToken) return;

    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
      if (token) {
        apiClient.put('/users/push-token', { expoPushToken: token })
          .then(() => console.log('Push token saved on server'))
          .catch(err => console.error('Error saving push token', err));
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      if (notificationListener.current) {
        (Notifications as any)?.removeNotificationSubscription?.(notificationListener.current);
        (notificationListener.current as any)?.remove?.();
      }
      if (responseListener.current) {
        (Notifications as any)?.removeNotificationSubscription?.(responseListener.current);
        (responseListener.current as any)?.remove?.();
      }
    };
  }, [userToken]);

  return { expoPushToken, notification };
};

async function registerForPushNotificationsAsync() {
  if (!Notifications) return undefined;
  
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log(token);
    } catch (e) {
      console.log('Using dummy token for local development (no EAS projectId linked)');
      token = 'ExpoPushToken[dummy-local-dev-token]';
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
