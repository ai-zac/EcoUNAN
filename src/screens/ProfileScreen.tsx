import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Animated, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { User as UserIcon, Target, Gift, Recycle, Bell, Settings, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { useUnreadCount } from '../hooks/useUnreadCount';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { RecycleService } from '../api/services/recycle.service';
import { API_BASE_URL } from '../api/apiClient';

import { userService } from '../api/services/user.service';

const getLevelInfo = (points: number) => {
  if (points < 500) return { level: 'Nivel 1', title: 'Principiante' };
  if (points < 1000) return { level: 'Nivel 2', title: 'Eco Amigo' };
  if (points < 2000) return { level: 'Nivel 3', title: 'Reciclador' };
  return { level: 'Nivel 4', title: 'Eco Hero' };
};

const MENU_ITEMS = [
  { id: 'edit', title: 'Editar perfil', icon: UserIcon, color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'goals', title: 'Mis metas', icon: Target, color: '#10B981', bg: '#D1FAE5' },
  { id: 'rewards', title: 'Mis recompensas', icon: Gift, color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'history', title: 'Historial de reciclaje', icon: Recycle, color: '#14B8A6', bg: '#CCFBF1' },
  { id: 'notifications', title: 'Notificaciones', icon: Bell, color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'settings', title: 'Configuración', icon: Settings, color: '#64748B', bg: '#F1F5F9' },
  { id: 'help', title: 'Ayuda y soporte', icon: HelpCircle, color: '#3B82F6', bg: '#EFF6FF' },
];

export const ProfileScreen = ({ navigation }: any) => {
  const unreadCount = useUnreadCount();
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const fadeAnimHeader = useRef(new Animated.Value(0)).current;
  const scaleAnimHeader = useRef(new Animated.Value(0.5)).current;
  const fadeAnimStats = useRef(new Animated.Value(0)).current;
  const slideAnimStats = useRef(new Animated.Value(30)).current;
  
  // Array of Animated values for each menu item (including logout)
  const menuFades = useRef([...MENU_ITEMS, 'logout'].map(() => new Animated.Value(0))).current;
  const menuSlides = useRef([...MENU_ITEMS, 'logout'].map(() => new Animated.Value(20))).current;

  const [user, setUser] = useState<User | null>(null);
  const [recycleCount, setRecycleCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    
    // 1. Header bounce animation
    Animated.parallel([
      Animated.timing(fadeAnimHeader, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnimHeader, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    // 2. Stats row slide up
    Animated.parallel([
      Animated.timing(fadeAnimStats, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
      Animated.spring(slideAnimStats, { toValue: 0, tension: 50, friction: 7, delay: 100, useNativeDriver: true }),
    ]).start();

    // 3. Staggered menu list
    const menuAnimations = menuFades.map((fade, i) => {
      return Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(menuSlides[i], { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ]);
    });
    
    setTimeout(() => {
      Animated.stagger(50, menuAnimations).start();
    }, 200);

    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      // First try to load from backend
      try {
        const liveUser = await userService.getMe();
        setUser(liveUser);
        await AsyncStorage.setItem('@user_data', JSON.stringify(liveUser));
      } catch (err) {
        // Fallback to storage
        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) setUser(JSON.parse(userData));
      }

      // Fetch history stats
      const history = await RecycleService.getHistory();
      setRecycleCount(history.length);
      const weight = history.reduce((sum, item) => sum + (item.totalWeight || (item as any).weight || 0), 0);
      setTotalWeight(weight);

    } catch (error) {
      console.error(error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@user_data');
    navigation.replace('Login');
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploading(true);
        const updatedUser = await userService.uploadProfilePicture(result.assets[0].uri);
        setUser(updatedUser);
        await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
        Alert.alert('Éxito', 'Foto de perfil actualizada');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    } finally {
      setIsUploading(false);
    }
  };

  const levelInfo = getLevelInfo(user?.ecoPoints || 0);

  const getProfileImageUrl = (profilePicture?: string) => {
    if (!profilePicture) return null;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return profilePicture.startsWith('http') ? profilePicture : `${baseUrl}${profilePicture}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        
        {/* Header / User Info */}
        <Animated.View style={[styles.header, { opacity: fadeAnimHeader, transform: [{ scale: scaleAnimHeader }] }]}>
          <TouchableOpacity style={styles.avatar} onPress={pickImage} disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : user && (user as any).profilePicture ? (
              <Image source={{ uri: getProfileImageUrl((user as any).profilePicture) as string }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name || 'Cargando...'}</Text>
          {user && (user as any).career ? (
            <Text style={styles.extraInfo}>{(user as any).career}</Text>
          ) : null}
        </Animated.View>

        {/* Stats Row */}
        <Animated.View style={[styles.statsContainer, { opacity: fadeAnimStats, transform: [{ translateY: slideAnimStats }] }]}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.ecoPoints || 0}</Text>
            <Text style={styles.statLabel}>Puntos Disp.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{recycleCount}</Text>
            <Text style={styles.statLabel}>Reciclajes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalWeight} kg</Text>
            <Text style={styles.statLabel}>Reciclado</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{levelInfo.level}</Text>
            <Text style={styles.statLabel}>{levelInfo.title}</Text>
          </View>
        </Animated.View>

        {/* Menu List */}
        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Animated.View key={item.id} style={{ opacity: menuFades[index], transform: [{ translateY: menuSlides[index] }] }}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  activeOpacity={0.7}
                  onPress={() => {
                    switch (item.id) {
                      case 'edit': navigation.navigate('EditProfile'); break;
                      case 'goals': navigation.navigate('MainTabs', { screen: 'Metas' }); break;
                      case 'rewards': navigation.navigate('MyRewards'); break;
                      case 'history': navigation.navigate('MainTabs', { screen: 'Puntos' }); break;
                      case 'notifications': navigation.navigate('Notifications'); break;
                      case 'settings': navigation.navigate('Settings'); break;
                      case 'help': navigation.navigate('Help'); break;
                    }
                  }}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                    <Icon size={20} color={item.color} />
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <ChevronRight size={20} color={theme.colors.border} />
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* Logout Button */}
          <Animated.View style={{ opacity: menuFades[MENU_ITEMS.length], transform: [{ translateY: menuSlides[MENU_ITEMS.length] }] }}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomWidth: 0, marginTop: theme.spacing.m }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// Estilos reactivos al modo activo
const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  
  header: { alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.l },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.m, ...theme.shadows.soft, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  name: { ...theme.typography.h2, color: colors.text, marginBottom: 4 },
  subtitle: { ...theme.typography.bodySecondary, color: colors.textSecondary },
  extraInfo: { fontSize: 14, color: colors.textSecondary, marginTop: 2, fontWeight: '500' },

  scrollView: { flex: 1 },

  statsContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: 'space-between', 
    marginBottom: theme.spacing.xl,
    gap: 8,
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.m,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: colors.surface,
    ...theme.shadows.soft,
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  statLabel: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },

  menuContainer: { 
    borderWidth: 1, 
    borderColor: colors.border,
    borderRadius: theme.borderRadius.l, 
    padding: theme.spacing.m,
    backgroundColor: colors.surface,
    ...theme.shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
  },
  iconBox: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.m },
  unreadBadge: {
    position: 'absolute',
    top: -6,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    overflow: 'visible',
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  menuTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
});
