import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode, getThemeMode, setThemeMode, theme } from '../theme/theme';

const STORAGE_KEY = '@theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  toggle: () => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  isDark: false,
  toggle: () => {},
  ready: false,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setLocal] = useState<ThemeMode>(getThemeMode());
  const [ready, setReady] = useState(false);

  
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'dark' || saved === 'light') {
          setThemeMode(saved);
          setLocal(saved);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value: ThemeContextValue = {
    mode,
    isDark: mode === 'dark',
    ready,
    toggle: () => {
      const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
      setThemeMode(next);
      setLocal(next);
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = (): ThemeContextValue => useContext(ThemeContext);

export const useThemeColors = () => {
  useThemeMode(); 
  return theme.colors; 
};
