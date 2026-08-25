import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import { navigationRef } from '../navigation/navigationRef';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  
  
  return 'http://10.244.92.156:5000/api';
};

export const API_BASE_URL = getBaseUrl();


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
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from AsyncStorage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


let isRoleChangeAlertVisible = false;


apiClient.interceptors.response.use(
  async (response) => {
    
    const currentRole = response.headers['x-user-role'];
    if (currentRole && !isRoleChangeAlertVisible) {
      try {
        const userStr = await AsyncStorage.getItem('@user_data');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role && user.role !== currentRole) {
            isRoleChangeAlertVisible = true;
            console.warn(`Role changed from ${user.role} to ${currentRole}! Re-fetching user data...`);
            
            Alert.alert('Permisos actualizados', 'Tus permisos en la plataforma han cambiado. Te redirigiremos para actualizar tu sesión.', [
              { text: 'OK', onPress: async () => {
                  try {
                    const token = await AsyncStorage.getItem('@auth_token');
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
                    isRoleChangeAlertVisible = false;
                    if (navigationRef.isReady()) {
                      navigationRef.reset({ index: 0, routes: [{ name: 'Splash' as never }] });
                    }
                  }
                }
              }
            ]);
          }
        }
      } catch (e) {
        
      }
    }
    return response;
  },
  async (error) => {
    if (!error.response) return Promise.reject(error);
    const status = error.response.status;
    const msg = error.response.data?.error || '';

    // 1. Account disabled (403 + deshabilitada) or Token expired (401)
    if (status === 401 || (status === 403 && msg.includes('deshabilitada'))) {
      console.warn('Unauthorized/Disabled! Logging out...');
      await AsyncStorage.removeItem('@auth_token');
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
    
    else if (status === 403) {
      console.warn('Role changed! Re-fetching user data...');
      Alert.alert('Permisos cambiados', 'Tus permisos en la plataforma han cambiado. Te redirigiremos para actualizar tu sesión.', [
        { text: 'OK', onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('@auth_token');
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
