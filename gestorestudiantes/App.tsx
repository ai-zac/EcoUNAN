import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/screens/SplashScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { MenuScreen } from './src/screens/MenuScreen';
import { EstudiantesScreen } from './src/screens/EstudiantesScreen';
import { apiService } from './src/services/api';

type Screen = 'splash' | 'login' | 'menu' | 'estudiantes';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [listFocusMode, setListFocusMode] = useState<'all' | 'edit' | 'delete'>('all');
  const [openCreateOnList, setOpenCreateOnList] = useState(false);
  const pendingUserRef = useRef<any>(null);

  useEffect(() => {
    apiService.init();

    apiService.getSavedUser().then((user) => {
      if (user) {
        pendingUserRef.current = user;
        setCurrentUser(user);
      }
    });
  }, []);

  const handleSplashFinish = () => {
    if (pendingUserRef.current) {
      setCurrentScreen('menu');
    } else {
      setCurrentScreen('login');
    }
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    pendingUserRef.current = user;
    setCurrentScreen('menu');
  };

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
    pendingUserRef.current = null;
    setCurrentScreen('login');
  };

  const handleNavigateToList = (focusMode: 'all' | 'edit' | 'delete' = 'all') => {
    setListFocusMode(focusMode);
    setOpenCreateOnList(false);
    setCurrentScreen('estudiantes');
  };

  const handleOpenCreate = () => {
    setListFocusMode('all');
    setOpenCreateOnList(true);
    setCurrentScreen('estudiantes');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />

      {currentScreen === 'splash' && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}

      {currentScreen === 'login' && (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      )}

      {currentScreen === 'menu' && (
        <MenuScreen
          user={currentUser}
          onNavigateToList={handleNavigateToList}
          onOpenCreate={handleOpenCreate}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'estudiantes' && (
        <EstudiantesScreen
          initialFocus={listFocusMode}
          openCreateDirectly={openCreateOnList}
          onBack={() => setCurrentScreen('menu')}
        />
      )}
    </SafeAreaProvider>
  );
}
