import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  User as UserIcon,
  Target,
  Gift,
  Recycle,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { useUnreadCount, refreshUnreadCount } from '../hooks/useUnreadCount';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';
import { User } from '../types';
import { RecycleService } from '../api/services/recycle.service';
import { API_BASE_URL } from '../api/apiClient';
import { userService } from '../api/services/user.service';
import { getUserRank } from '../utils/ranks';

const MENU_ITEMS = [
  { id: 'edit', title: 'Editar perfil', icon: UserIcon, color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'goals', title: 'Mis metas', icon: Target, color: '#10B981', bg: '#D1FAE5' },
  { id: 'rewards', title: 'Mis recompensas', icon: Gift, color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'history', title: 'Historial de reciclaje', icon: Recycle, color: '#14B8A6', bg: '#CCFBF1' },
  { id: 'notifications', title: 'Notificaciones', icon: Bell, color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'settings', title: 'Configuración', icon: Settings, color: '#64748B', bg: '#F1F5F9' },
  { id: 'help', title: 'Ayuda y soporte', icon: HelpCircle, color: '#3B82F6', bg: '#EFF6FF' },
];

const LOGOUT_ITEM = {
  id: 'logout',
  title: 'Cerrar sesión',
  icon: LogOut,
  color: '#EF4444',
  bg: '#FEE2E2',
};

let memoryProfileUser: User | null = null;
let memoryRecycleCount: number = 0;
let memoryTotalWeight: number = 0;

AsyncStorage.multiGet(['@user_data', '@ecounan_profile_stats'])
  .then((pairs) => {
    pairs.forEach(([key, val]) => {
      if (!val) return;
      try {
        const parsed = JSON.parse(val);
        if (key === '@user_data' && !memoryProfileUser) memoryProfileUser = parsed;
        if (key === '@ecounan_profile_stats') {
          if (!memoryRecycleCount) memoryRecycleCount = parsed.recycleCount || 0;
          if (!memoryTotalWeight) memoryTotalWeight = parsed.totalWeight || 0;
        }
      } catch (e) {}
    });
  })
  .catch(() => {});

interface AnimatedMenuItemProps {
  item: {
    id: string;
    title: string;
    icon: any;
    color: string;
    bg: string;
  };
  index: number;
  refreshKey: number;
  unreadCount?: number;
  onPress: () => void;
  isLogout?: boolean;
  colors: any;
  styles: any;
}

const AnimatedMenuItem: React.FC<AnimatedMenuItemProps> = React.memo(({
  item,
  index,
  refreshKey,
  unreadCount = 0,
  onPress,
  isLogout = false,
  colors,
  styles,
}) => {

  const slideAnim = useRef(new Animated.Value(-18)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const iconScale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    slideAnim.setValue(-18);
    fadeAnim.setValue(0);
    cardScale.setValue(0.96);
    iconScale.setValue(0.3);

    const delay = Math.min(index * 25, 160);
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(20),
          Animated.spring(iconScale, {
            toValue: 1,
            tension: 110,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    anim.start();

    return () => {
      anim.stop();
    };
  }, [refreshKey]);

  const Icon = item.icon;

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: cardScale }],
      }}
    >
      <TouchableOpacity
        style={[styles.menuItem, isLogout && { borderBottomWidth: 0, marginTop: theme.spacing.m }]}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <Animated.View
          style={[
            styles.iconBox,
            { backgroundColor: item.bg, transform: [{ scale: iconScale }] },
          ]}
        >
          <Icon size={20} color={item.color} />
          {item.id === 'notifications' && unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Animated.View>
        <Text style={[styles.menuTitle, isLogout && { color: '#EF4444' }]}>
          {item.title}
        </Text>
        {!isLogout && <ChevronRight size={20} color={theme.colors.border} />}
      </TouchableOpacity>
    </Animated.View>
  );
});

export const ProfileScreen = ({ navigation }: any) => {
  const unreadCount = useUnreadCount();
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const hasOpenedChildScreenRef = useRef(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;
  const avatarScale = useRef(new Animated.Value(0.85)).current;

  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(16)).current;
  const statsScale = useRef(new Animated.Value(0.96)).current;

  const [user, setUser] = useState<User | null>(memoryProfileUser);
  const [recycleCount, setRecycleCount] = useState<number>(memoryRecycleCount);
  const [totalWeight, setTotalWeight] = useState<number>(memoryTotalWeight);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const playEntranceAnimation = () => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);
    avatarScale.setValue(0.85);

    statsFade.setValue(0);
    statsSlide.setValue(16);
    statsScale.setValue(0.96);

    Animated.stagger(30, [

      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.spring(backButtonScale, { toValue: 1, tension: 90, friction: 7, useNativeDriver: true }),
        Animated.spring(avatarScale, { toValue: 1, tension: 85, friction: 6, useNativeDriver: true }),
      ]),

      Animated.parallel([
        Animated.timing(statsFade, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(statsSlide, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.spring(statsScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const runInstantEntrance = () => {
    playEntranceAnimation();
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [uStr, sStr] = await Promise.all([
          AsyncStorage.getItem('@user_data'),
          AsyncStorage.getItem('@ecounan_profile_stats'),
        ]);
        if (!isMounted) return;
        if (uStr && !memoryProfileUser) {
          const parsed = JSON.parse(uStr);
          memoryProfileUser = parsed;
          setUser(parsed);
        }
        if (sStr && memoryRecycleCount === 0) {
          const parsed = JSON.parse(sStr);
          memoryRecycleCount = parsed.recycleCount || 0;
          memoryTotalWeight = parsed.totalWeight || 0;
          setRecycleCount(parsed.recycleCount || 0);
          setTotalWeight(parsed.totalWeight || 0);
        }
      } catch (e) {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const resetScrollToTop = (animated: boolean = false) => {
    scrollRef.current?.scrollTo({ y: 0, animated });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      refreshUnreadCount();
      if (hasOpenedChildScreenRef.current) {

        hasOpenedChildScreenRef.current = false;
        loadUserData();
        return;
      }

      resetScrollToTop(false);
      runInstantEntrance();
      loadUserData();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {

      if (!hasOpenedChildScreenRef.current) {
        resetScrollToTop(false);
      }
    });

    runInstantEntrance();
    loadUserData();
    refreshUnreadCount();

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(async () => {
        try {
          await Promise.all([loadUserData(), refreshUnreadCount()]);
        } catch (e) {

        }
      }, 3500);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const unsubscribeFocus = navigation.addListener('focus', startPolling);
    const unsubscribeBlur = navigation.addListener('blur', stopPolling);

    startPolling();

    return () => {
      stopPolling();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadUserData(), refreshUnreadCount()]);
      runInstantEntrance();
    } catch (e) {
      console.error('[ProfileScreen] Error al refrescar:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [liveUser, history] = await Promise.all([
        userService.getMe().catch(async () => {
          const userData = await AsyncStorage.getItem('@user_data');
          return userData ? JSON.parse(userData) : null;
        }),
        RecycleService.getHistory().catch(() => []),
      ]);

      if (liveUser) {
        setUser(liveUser);
        memoryProfileUser = liveUser;
        AsyncStorage.setItem('@user_data', JSON.stringify(liveUser)).catch(() => {});
      }

      if (history) {
        const count = history.length;
        const rawWeight = history.reduce(
          (sum, item) => sum + (item.totalWeight || (item as any).weight || 0),
          0
        );
        const weight = Math.round(rawWeight * 10) / 10;
        setRecycleCount(count);
        setTotalWeight(weight);
        memoryRecycleCount = count;
        memoryTotalWeight = weight;
        AsyncStorage.setItem(
          '@ecounan_profile_stats',
          JSON.stringify({ recycleCount: count, totalWeight: weight })
        ).catch(() => {});
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = async () => {
    await tokenStorage.removeToken();
    await AsyncStorage.removeItem('@user_data');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const handleImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (!result.canceled && result.assets && result.assets.length > 0) {
      try {
        setIsUploading(true);
        const updatedUser = await userService.uploadProfilePicture(result.assets[0].uri);
        setUser(updatedUser);
        memoryProfileUser = updatedUser;
        await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
        Alert.alert('Éxito', 'Foto de perfil actualizada con éxito.');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const pickImage = () => {
    Alert.alert('Cambiar foto', '¿De dónde quieres obtener la imagen?', [
      {
        text: 'Tomar foto',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          handleImageResult(result);
        },
      },
      {
        text: 'Elegir de galería',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          handleImageResult(result);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const getProfileImageUrl = (profilePicture?: string) => {
    if (!profilePicture) return null;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return profilePicture.startsWith('http') ? profilePicture : `${baseUrl}${profilePicture}`;
  };

  const userRankInfo = getUserRank((user as any)?.lifetimePoints || user?.ecoPoints || 0);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, colors.accent]}
            tintColor={colors.primary}
          />
        }
      >

        <Animated.View
          style={[
            styles.topRow,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('MainTabs', { screen: 'Inicio' });
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Volver atrás"
            >
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.screenTitle}>Mi Perfil</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }] }]}>
            <TouchableOpacity style={styles.avatar} onPress={pickImage} disabled={isUploading}>
              {isUploading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : user && (user as any).profilePicture ? (
                <Image
                  source={{ uri: getProfileImageUrl((user as any).profilePicture) as string }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={pickImage}
              disabled={isUploading}
              activeOpacity={0.8}
            >
              <Camera size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.name}>{user?.name || 'Usuario'}</Text>
          {user && (user as any).career ? (
            <Text style={styles.extraInfo}>{(user as any).career}</Text>
          ) : (
            <Text style={styles.extraInfo}>Miembro EcoUNAN</Text>
          )}
        </Animated.View>

        <Animated.View
          style={[
            styles.statsContainer,
            {
              opacity: statsFade,
              transform: [{ translateY: statsSlide }, { scale: statsScale }],
            },
          ]}
        >
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.ecoPoints || 0}</Text>
            <Text style={styles.statLabel}>EcoPoints</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{recycleCount}</Text>
            <Text style={styles.statLabel}>Reciclajes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{Number(totalWeight.toFixed(1))} kg</Text>
            <Text style={styles.statLabel}>Reciclado</Text>
          </View>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={() => {
              hasOpenedChildScreenRef.current = true;
              navigation.navigate('LeaguePath');
            }}
          >
            <Text style={styles.statValue}>{userRankInfo.currentRank.icon}</Text>
            <Text
              style={[
                styles.statLabel,
                { color: userRankInfo.currentRank.color, fontWeight: 'bold' },
              ]}
            >
              {userRankInfo.currentRank.name}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.menuContainer}>
          {MENU_ITEMS.map((item, index) => (
            <AnimatedMenuItem
              key={item.id}
              item={item}
              index={index}
              refreshKey={refreshKey}
              unreadCount={item.id === 'notifications' ? unreadCount : 0}
              colors={colors}
              styles={styles}
              onPress={() => {
                switch (item.id) {
                  case 'edit':
                    hasOpenedChildScreenRef.current = true;
                    navigation.navigate('EditProfile');
                    break;
                  case 'goals':
                    navigation.navigate('MainTabs', { screen: 'Metas' });
                    break;
                  case 'rewards':
                    hasOpenedChildScreenRef.current = true;
                    navigation.navigate('MyRewards');
                    break;
                  case 'history':
                    navigation.navigate('MainTabs', { screen: 'Puntos' });
                    break;
                  case 'notifications':
                    hasOpenedChildScreenRef.current = true;
                    navigation.navigate('Notifications');
                    break;
                  case 'settings':
                    hasOpenedChildScreenRef.current = true;
                    navigation.navigate('Settings');
                    break;
                  case 'help':
                    hasOpenedChildScreenRef.current = true;
                    navigation.navigate('Help');
                    break;
                }
              }}
            />
          ))}

          <AnimatedMenuItem
            item={LOGOUT_ITEM}
            index={MENU_ITEMS.length}
            refreshKey={refreshKey}
            isLogout={true}
            colors={colors}
            styles={styles}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { padding: theme.spacing.m, paddingTop: 4, paddingBottom: 100 },
    scrollView: { flex: 1 },

    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      marginTop: 2,
    },
    backButton: { marginRight: 10, padding: 4, marginLeft: -4 },
    screenTitle: { fontSize: 24, fontWeight: '900', color: colors.text },

    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.l,
      marginTop: 4,
    },
    avatarWrapper: {
      position: 'relative',
      marginBottom: theme.spacing.s,
    },
    avatar: {
      width: 86,
      height: 86,
      borderRadius: 43,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.shadows.soft,
      borderWidth: 2,
      borderColor: 'rgba(226, 232, 240, 0.7)',
      overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%', borderRadius: 43 },
    avatarText: { fontSize: 26, fontWeight: 'bold', color: colors.text },
    cameraBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
      ...theme.shadows.soft,
    },
    name: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 2 },
    extraInfo: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

    statsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.l,
      gap: 8,
    },
    statCard: {
      width: '48%',
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.7)',
      borderRadius: theme.borderRadius.m,
      paddingVertical: theme.spacing.m,
      paddingHorizontal: 8,
      alignItems: 'center',
      backgroundColor: colors.surface,
      ...theme.shadows.soft,
    },
    statValue: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4 },
    statLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },

    menuContainer: {
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.7)',
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
      backgroundColor: colors.surface,
      ...theme.shadows.soft,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
    },
    unreadBadge: {
      position: 'absolute',
      top: -5,
      right: -6,
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
    menuTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  });
