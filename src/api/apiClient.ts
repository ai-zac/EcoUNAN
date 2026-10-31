import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';
import { tokenStorage } from '../utils/tokenStorage';
import Constants from 'expo-constants';

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }

  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:5000/api`;
      }
    }
  } catch {}

  return 'http://172.20.10.5:5000/api';
};

export const API_BASE_URL = getBaseUrl();

export const ASSET_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export const assetUrl = (path?: string | null): string | null =>
  path ? `${ASSET_ORIGIN}${path}` : null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from SecureStore', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRoleChangeAlertVisible = false;
let isSessionClosedAlertVisible = false;
let lastNetworkAlertTime = 0;
const NETWORK_ALERT_COOLDOWN_MS = 15000;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      const now = Date.now();
      const url = error.config?.url || '';
      const isAuthUrl = url.includes('/auth/');

      if (!isAuthUrl && now - lastNetworkAlertTime > NETWORK_ALERT_COOLDOWN_MS) {
        lastNetworkAlertTime = now;
        const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
        Alert.alert(
          isTimeout ? 'Tiempo de espera agotado' : 'Sin conexión al servidor',
          isTimeout
            ? 'El servidor tardó demasiado en responder. Por favor verifica tu conexión a internet.'
            : 'No se pudo conectar con el servidor EcoUNAN. Revisa tu conexión de red e intenta nuevamente.'
        );
      }
      return Promise.reject(error);
    }
    const status = error.response.status;
    const msg = error.response.data?.error || '';
    const url = error.config?.url || '';

    if (url.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (status === 401 || (status === 403 && msg.includes('deshabilitada'))) {
      await tokenStorage.removeToken();
      await AsyncStorage.removeItem('@user_data');

      if (!isSessionClosedAlertVisible) {
        isSessionClosedAlertVisible = true;
        Alert.alert('Sesión cerrada', msg || 'Tu sesión ha expirado.', [
          {
            text: 'OK',
            onPress: () => {
              isSessionClosedAlertVisible = false;
              if (navigationRef.isReady()) {
                const currentRoute = navigationRef.getCurrentRoute()?.name;
                if (currentRoute !== 'Login') {
                  navigationRef.reset({ index: 0, routes: [{ name: 'Login' as never }] });
                }
              }
            },
          },
        ]);
      }
      return Promise.reject(error);
    } else if (status === 403 && msg && (msg.includes('rol') || msg.includes('permisos') || msg.includes('role'))) {
      console.warn('Role changed! Re-fetching user data...');
      Alert.alert('Permisos cambiados', 'Tus permisos en la plataforma han cambiado. Te redirigiremos para actualizar tu sesión.', [
        {
          text: 'OK',
          onPress: async () => {
            try {
              const token = await tokenStorage.getToken();
              if (token) {
                const res = await axios.get(`${API_BASE_URL}/users/me`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.data?.data) {
                  await AsyncStorage.setItem('@user_data', JSON.stringify(res.data.data));
                }
              }
            } catch (e) {
              console.error('Error fetching updated role', e);
            } finally {
              if (navigationRef.isReady()) {
                navigationRef.reset({ index: 0, routes: [{ name: 'Splash' as never }] });
              }
            }
          },
        },
      ]);
    } else if (status === 429) {
      Alert.alert(
        'Límite de solicitudes',
        msg || 'Has realizado demasiadas solicitudes en poco tiempo. Por favor espera un momento e intenta de nuevo.'
      );
    } else if (status === 502 || status === 503) {
      Alert.alert(
        'Servicio no disponible',
        msg || 'El servicio se encuentra temporalmente en mantenimiento. Intenta de nuevo en unos momentos.'
      );
    }

    return Promise.reject(error);
  }
);

export const getApiErrorMessage = (error: any, fallbackMessage: string = 'Ocurrió un error inesperado'): string => {
  if (!error) return fallbackMessage;

  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'El servidor tardó demasiado en responder. Verifica tu conexión a internet.';
    }
    return 'No se pudo conectar con el servidor EcoUNAN. Revisa tu red e intenta más tarde.';
  }

  const status = error.response.status;
  const serverMsg = error.response.data?.error || error.response.data?.message;

  if (serverMsg && typeof serverMsg === 'string') {
    return serverMsg;
  }

  switch (status) {
    case 400:
      return 'Los datos enviados no son válidos o están incompletos.';
    case 401:
      return 'No autorizado. Tu sesión ha expirado.';
    case 403:
      return 'Acceso denegado: no dispones de los permisos necesarios.';
    case 404:
      return 'El recurso solicitado no fue encontrado.';
    case 409:
      return 'Conflicto: Ya existe un registro con esos datos.';
    case 413:
      return 'El archivo supera el tamaño máximo permitido (10 MB).';
    case 422:
      return 'La solicitud contiene datos que no pudieron ser procesados.';
    case 429:
      return 'Demasiadas solicitudes. Por favor espera unos segundos antes de reintentar.';
    case 500:
      return 'Error interno en el servidor. Intenta nuevamente más tarde.';
    case 502:
    case 503:
      return 'Servicio temporalmente en mantenimiento o fuera de línea.';
    default:
      return fallbackMessage;
  }
};
