import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';
import SplashEcoUNAN from '../components/SplashEcoUNAN';

export const SplashScreen = ({ navigation }: any) => {
  // Inicia la verificación de sesión de inmediato desde la inicialización del ref
  const authCheckRef = useRef<Promise<'AdminDashboard' | 'MainTabs' | 'Onboarding'>>(
    (async () => {
      try {
        const token = await tokenStorage.getToken();
        const userStr = await AsyncStorage.getItem('@user_data');
        if (token && userStr) {
          const user = JSON.parse(userStr);
          const isStaff = ['superadmin', 'admin', 'brigadista'].includes(user?.role);
          return isStaff ? 'AdminDashboard' : 'MainTabs';
        }
        return 'Onboarding';
      } catch (e) {
        console.warn('[SplashScreen] Error al verificar sesión:', e);
        return 'Onboarding';
      }
    })()
  );

  return (
    <SplashEcoUNAN
      onAnimationComplete={async () => {
        try {
          const targetRoute = (await authCheckRef.current) ?? 'Onboarding';
          console.log('[SplashScreen] Navegando con éxito a:', targetRoute);
          navigation.replace(targetRoute);
        } catch (error) {
          console.error('[SplashScreen] Error durante navegación post-splash:', error);
          navigation.replace('Onboarding');
        }
      }}
    />
  );
};
