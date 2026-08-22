import { apiClient } from '../apiClient';
import { AuthResponse, User } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      const authData = response.data.data;
      
      const user: User = {
        _id: authData._id,
        name: authData.name,
        email: authData.email,
        role: authData.role === 'admin' ? 'admin' : 'user',
        ecoPoints: (authData as any).ecoPoints || 0,
      };
      
      await AsyncStorage.setItem('@auth_token', authData.token);
      await AsyncStorage.setItem('@user_data', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  register: async (name: string, email: string, password: string, faculty: string, career: string, studentId: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', { name, email, password, role: 'user', faculty, career, studentId });
      const authData = response.data.data;
      
      const user: User = {
        _id: authData._id,
        name: authData.name,
        email: authData.email,
        role: 'user',
        ecoPoints: 0,
      };
      
      await AsyncStorage.setItem('@auth_token', authData.token);
      await AsyncStorage.setItem('@user_data', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@user_data');
  },

  getCurrentUser: async (): Promise<User | null> => {
    const userData = await AsyncStorage.getItem('@user_data');
    return userData ? JSON.parse(userData) : null;
  }
};
