import React from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';
import { ToastHost } from './src/components/Toast';

const ThemedApp = () => {
  // El key fuerza un remontaje completo al alternar el modo:
  // todas las pantallas vuelven a resolver theme.colors.* en render.
  const { mode, ready } = useThemeMode();

  if (!ready) return null;

  return (
    <>
      <AppNavigator key={mode} />
      <ToastHost />
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
