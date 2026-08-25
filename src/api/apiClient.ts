import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  // IP Local para dispositivos físicos (Asegúrate de que tu celular y PC estén en la misma red Wi-Fi)
  // Cambia esta IP si tu computadora tiene otra dirección en la red.
  return 'http://172.20.10.5:5000/api';
};

export const API_BASE_URL = getBaseUrl();

// Origen sin sufijo /api, para construir URLs de archivos estaticos (/uploads/*)
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

// Interceptor to handle global errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized! Logging out...');
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@user_data');
    }
    return Promise.reject(error);
  }
);
