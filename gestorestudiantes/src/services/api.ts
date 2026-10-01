import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Estudiante, LoginResponse, ApiResponse } from '../types/student.types';

const STORAGE_KEY_AUTH_TOKEN = '@gestor_estudiantes_token';
const STORAGE_KEY_AUTH_USER = '@gestor_estudiantes_user';

export const DEFAULT_API_URL = 'http://192.168.1.7:5000/api';

const apiClient = axios.create({
  baseURL: DEFAULT_API_URL,
  timeout: 15000,
});

export const apiService = {
  init: async (): Promise<string> => DEFAULT_API_URL,

  getBaseUrl: (): string => DEFAULT_API_URL,

  setBaseUrl: async (newUrl: string): Promise<void> => {
    apiClient.defaults.baseURL = newUrl;
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const res = await apiClient.get('/estudiantes', { timeout: 4000 });
      return res.status === 200;
    } catch {
      return false;
    }
  },

  getImageUrl: (path?: string | null): string | null => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const origin = DEFAULT_API_URL.replace(/\/api$/, '');
    return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
  },

  registerDocente: async (nombre: string, usuario: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/estudiantes/register', {
        nombre,
        usuario,
        password,
      });

      if (response.data.success && response.data.usuario) {
        await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(response.data.usuario));
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al registrar la cuenta docente.',
      };
    }
  },

  login: async (usuario: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/estudiantes/login', {
        usuario,
        password,
      });

      if (response.data.success && response.data.token) {
        await AsyncStorage.setItem(STORAGE_KEY_AUTH_TOKEN, response.data.token);
        if (response.data.usuario) {
          await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(response.data.usuario));
        }
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Credenciales inválidas o servidor desconectado.',
      };
    }
  },

  uploadPhoto: async (uri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

      formData.append('foto', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post<ApiResponse<any>>('/estudiantes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.url) {
        return response.data.url;
      }
      return null;
    } catch (error) {
      console.error('Error al subir imagen al backend:', error);
      return null;
    }
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH_USER);
  },

  getSavedUser: async (): Promise<any | null> => {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEY_AUTH_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getEstudiantes: async (
    searchQuery?: string,
    faculty?: string,
    career?: string,
    page: number = 1,
    limit: number = 25
  ): Promise<ApiResponse<Estudiante[]> & { page?: number; totalPages?: number; hasMore?: boolean; total?: number }> => {
    try {
      const params: any = { page, limit };
      if (searchQuery) params.q = searchQuery;
      if (faculty && faculty !== 'Todas') params.faculty = faculty;
      if (career && career !== 'Todas') params.career = career;

      const response = await apiClient.get<
        ApiResponse<Estudiante[]> & { page?: number; totalPages?: number; hasMore?: boolean; total?: number }
      >('/estudiantes', { params });
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener lista de estudiantes',
        data: [],
      };
    }
  },

  getStats: async (): Promise<ApiResponse<{ totalStudents: number }>> => {
    try {
      const response = await apiClient.get<ApiResponse<{ totalStudents: number }>>('/estudiantes/stats');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener estadísticas',
      };
    }
  },

  getEstudianteById: async (id: string): Promise<ApiResponse<Estudiante>> => {
    try {
      const response = await apiClient.get<ApiResponse<Estudiante>>(`/estudiantes/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al obtener estudiante',
      };
    }
  },

  createEstudiante: async (data: Omit<Estudiante, 'id'>): Promise<ApiResponse<Estudiante>> => {
    try {
      const response = await apiClient.post<ApiResponse<Estudiante>>('/estudiantes', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al registrar estudiante',
      };
    }
  },

  updateEstudiante: async (id: string, data: Partial<Estudiante>): Promise<ApiResponse<Estudiante>> => {
    try {
      const response = await apiClient.put<ApiResponse<Estudiante>>(`/estudiantes/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al actualizar estudiante',
      };
    }
  },

  deleteEstudiante: async (id: string): Promise<ApiResponse<Estudiante>> => {
    try {
      const response = await apiClient.delete<ApiResponse<Estudiante>>(`/estudiantes/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al eliminar estudiante',
      };
    }
  },

  seedEstudiantes: async (
    count: number = 6,
    clearExisting: boolean = true
  ): Promise<ApiResponse<{ inserted: number; total: number; timeMs?: number }>> => {
    try {
      const response = await apiClient.post<any>(
        '/estudiantes/seed',
        { count, clearExisting },
        { timeout: 120000 }
      );
      const res = response.data;
      if (res && res.success && !res.data) {
        res.data = {
          inserted: res.inserted ?? count,
          total: res.total ?? count,
          timeMs: res.timeMs ?? 0,
        };
      }
      return res;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al inicializar datos de prueba',
      };
    }
  },
};
