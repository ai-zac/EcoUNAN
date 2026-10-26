import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { navigationRef } from '../navigation/navigationRef';
import { tokenStorage } from '../utils/tokenStorage';

// ── IP Actual de tu máquina en la red local ──
const CURRENT_IP = '192.168.1.17';

const getHostIp = (): string => {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && window.location?.hostname
      ? window.location.hostname
      : CURRENT_IP;
  }

  // 1. En Expo SDK 58 (Bridgeless / New Architecture), Constants.expoConfig.hostUri tiene la IP de Metro
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
      (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch {
    // Continuar al siguiente método
  }

  // 2. Fallback para arquitectura clásica via SourceCode.scriptURL
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:\/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch {
    // Si no está disponible, usar la IP fija actual
  }

  return CURRENT_IP;
};

const getBaseUrl = () => {
  const host = getHostIp();
  return `http://${host}:5000/api`;
};

export const API_BASE_URL = getBaseUrl();
console.log('[API] Conectando a:', API_BASE_URL);


export const ASSET_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

/** Convierte una ruta relativa del backend (/uploads/x.jpg) en URI absoluta */
export const assetUrl = (path?: string | null): string | null =>
  path ? `${ASSET_ORIGIN}${path}` : null;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  // SIN Content-Type por defecto: axios asigna application/json para objetos
  // y multipart/form-data CON BOUNDARY cuando recibe un FormData.
});

// Interceptor to inject token on every request
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


apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) return Promise.reject(error);
    const status = error.response.status;
    const msg = error.response.data?.error || '';
    const url = error.config?.url || '';

    // Ignorar endpoints públicos de autenticación (los errores 401/403 aquí son de credenciales o validación, NO de sesión expirada)
    if (url.includes('/auth/')) {
      return Promise.reject(error);
    }

    // 1. Account disabled (403 + deshabilitada) or Token expired (401)
    if (status === 401 || (status === 403 && msg.includes('deshabilitada'))) {
      console.warn('Unauthorized/Disabled! Logging out...');
      await tokenStorage.removeToken();
      await AsyncStorage.removeItem('@user_data');
      
      Alert.alert('Sesión cerrada', msg || 'Tu sesión ha expirado.', [
        { text: 'OK', onPress: () => {
            if (navigationRef.isReady()) {
              navigationRef.reset({ index: 0, routes: [{ name: 'Login' as never }] });
            }
          }
        }
      ]);
    }
    
    else if (status === 403 && msg && (msg.includes('rol') || msg.includes('permisos') || msg.includes('role'))) {
      console.warn('Role changed! Re-fetching user data...');
      Alert.alert('Permisos cambiados', 'Tus permisos en la plataforma han cambiado. Te redirigiremos para actualizar tu sesión.', [
        { text: 'OK', onPress: async () => {
            try {
              const token = await tokenStorage.getToken();
              if (token) {
                const res = await axios.get(`${API_BASE_URL}/users/me`, {
                  headers: { Authorization: `Bearer ${token}` }
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
          }
        }
      ]);
    }
    return Promise.reject(error);
  }
);
