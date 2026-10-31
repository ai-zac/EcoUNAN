import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
let SecureStore: typeof import('expo-secure-store') | null = null;
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}
const TOKEN_KEY = 'auth_token';
export const tokenStorage = {
  async getToken(): Promise<string | null> {
    if (SecureStore) {
      return SecureStore.getItemAsync(TOKEN_KEY);
    }
    return AsyncStorage.getItem(`@${TOKEN_KEY}`);
  },
  async setToken(token: string): Promise<void> {
    if (SecureStore) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await AsyncStorage.setItem(`@${TOKEN_KEY}`, token);
    }
  },
  async removeToken(): Promise<void> {
    if (SecureStore) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      await AsyncStorage.removeItem(`@${TOKEN_KEY}`);
    }
  },
};