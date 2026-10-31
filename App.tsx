import React from 'react';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';
import { ToastHost } from './src/components/Toast';

const ThemedApp = () => {

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
