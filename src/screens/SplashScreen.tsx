import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';
import SplashEcoUNAN from '../components/SplashEcoUNAN';

export const SplashScreen = ({ navigation }: any) => {
  const hasNavigatedRef = useRef(false);

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

  const navigateToTarget = async () => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    try {
      const targetRoute = (await Promise.race([
        authCheckRef.current,
        new Promise<'Onboarding'>((resolve) => setTimeout(() => resolve('Onboarding'), 1500)),
      ])) ?? 'Onboarding';
      console.log('[SplashScreen] Navegando con éxito a:', targetRoute);
      navigation.replace(targetRoute);
    } catch (error) {
      console.error('[SplashScreen] Error durante navegación post-splash:', error);
      navigation.replace('Onboarding');
    }
  };

  useEffect(() => {
    // Temporizador de rescate: si la animación nativa se traba o no llama el callback en 3800ms, avanza
    const fallbackTimer = setTimeout(() => {
      navigateToTarget();
    }, 3800);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <SplashEcoUNAN
      onAnimationComplete={navigateToTarget}
    />
  );
};
