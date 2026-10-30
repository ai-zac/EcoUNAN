import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScrollToTop } from '@react-navigation/native';
import {
  ArrowLeft,
  Gift,
  Coffee,
  Shirt,
  BookOpen,
  Utensils,
  ShoppingBag,
  Award,
  Trophy,
  Medal,
  Ticket,
  Sparkles,
  Droplet,
  Star,
  Zap,
  Smartphone,
  Package
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { userService } from '../api/services/user.service';
import { AuthService } from '../api/services/auth.service';
import { Reward } from '../types';

const CACHE_REWARDS_KEY = '@ecounan_user_rewards';
const CACHE_POINTS_KEY = '@ecounan_user_pts';

let memoryRewardsCache: Reward[] = [];
let memoryPointsCache: number = 0;

AsyncStorage.multiGet([CACHE_REWARDS_KEY, CACHE_POINTS_KEY])
  .then((results) => {
    results.forEach(([key, val]) => {
      if (!val) return;
      try {
        if (key === CACHE_REWARDS_KEY && memoryRewardsCache.length === 0) {
          memoryRewardsCache = JSON.parse(val);
        }
        if (key === CACHE_POINTS_KEY && memoryPointsCache === 0) {
          memoryPointsCache = JSON.parse(val);
        }
      } catch (e) {}
    });
  })
  .catch(() => {});

interface AnimatedRewardCardProps {
  item: Reward;
  index: number;
  refreshKey: number;
  canAfford: boolean;
  isOutOfStock: boolean;
  onRedeem: () => void;
  colors: any;
  styles: any;
  getIcon: (name: string, color: string) => React.ReactNode;
}

const AnimatedRewardCard: React.FC<AnimatedRewardCardProps> = React.memo(({
  item,
  index,
  refreshKey,
  canAfford,
  isOutOfStock,
  onRedeem,
  colors,
  styles,
  getIcon,
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

    const delay = Math.min((index % 8) * 25, 160);
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

  return (
    <Animated.View
      style={[
        styles.rewardCard,
        isOutOfStock && { opacity: 0.6 },
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: cardScale }],
        },
      ]}
    >
      <View style={styles.cardTop}>
        <Animated.View
          style={[
            styles.iconBox,
            {
              backgroundColor: item.iconBg || '#F1F5F9',
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          {getIcon(item.iconName || 'Gift', item.iconColor || '#64748B')}
        </Animated.View>
        <View style={styles.cardInfo}>
          <Text style={styles.rewardName}>{item.title}</Text>
          <Text style={styles.rewardDesc}>{item.description}</Text>
          <View
            style={[
              styles.pointsBadge,
              { backgroundColor: canAfford ? '#DCFCE7' : '#FEF2F2' },
            ]}
          >
            <Text
              style={[
                styles.pointsBadgeText,
                { color: canAfford ? '#16A34A' : '#EF4444' },
              ]}
            >
              {item.pointsCost.toLocaleString()} EcoPoints
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBottom}>
        <Text
          style={[
            styles.availabilityText,
            isOutOfStock && { color: '#EF4444', fontWeight: 'bold' },
          ]}
        >
          {item.stock === -1
            ? 'Disponibilidad inmediata'
            : item.stock === 0
            ? 'Agotado'
            : `Quedan ${item.stock} unidades`}
        </Text>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (isOutOfStock || !canAfford) && styles.actionButtonDisabled,
          ]}
          disabled={isOutOfStock || !canAfford}
          onPress={onRedeem}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.actionButtonText,
              (isOutOfStock || !canAfford) && styles.actionButtonDisabledText,
            ]}
          >
            Canjear
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export const UserRewardsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [rewards, setRewards] = useState<Reward[]>(memoryRewardsCache);
  const [userPoints, setUserPoints] = useState<number>(memoryPointsCache);
  const [loading, setLoading] = useState(memoryRewardsCache.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Animaciones de entrada instantánea
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;

  const pointsCardFade = useRef(new Animated.Value(0)).current;
  const pointsCardSlide = useRef(new Animated.Value(16)).current;
  const pointsCardScale = useRef(new Animated.Value(0.96)).current;

  const playEntranceAnimation = () => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);

    pointsCardFade.setValue(0);
    pointsCardSlide.setValue(16);
    pointsCardScale.setValue(0.96);

    Animated.stagger(50, [
      // 1. Cabecera y botón de retroceso
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 75, friction: 8, useNativeDriver: true }),
        Animated.spring(backButtonScale, { toValue: 1, tension: 85, friction: 7, useNativeDriver: true }),
      ]),

      // 2. Tarjeta de puntos del usuario
      Animated.parallel([
        Animated.timing(pointsCardFade, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(pointsCardSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(pointsCardScale, { toValue: 1, tension: 75, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const runInstantEntrance = () => {
    playEntranceAnimation();
    setRefreshKey((k) => k + 1);
  };

  // Hidratación desde AsyncStorage si la memoria estaba vacía
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [cachedR, cachedP] = await Promise.all([
          AsyncStorage.getItem(CACHE_REWARDS_KEY),
          AsyncStorage.getItem(CACHE_POINTS_KEY),
        ]);
        if (!isMounted) return;
        let hasData = false;
        if (cachedR && memoryRewardsCache.length === 0) {
          const parsed = JSON.parse(cachedR);
          memoryRewardsCache = parsed;
          setRewards(parsed);
          setLoading(false);
          hasData = true;
        }
        if (cachedP && memoryPointsCache === 0) {
          const pts = JSON.parse(cachedP);
          memoryPointsCache = pts;
          setUserPoints(pts);
        }
        if (hasData) {
          setRefreshKey((k) => k + 1);
        }
      } catch (e) {}
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const hasOpenedChildScreenRef = useRef(false);

  const resetScrollToTop = (animated: boolean = false) => {
    scrollRef.current?.scrollTo({ y: 0, animated });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  // Disparo instantáneo al enfocar la pantalla y reseteo de posición
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      if (hasOpenedChildScreenRef.current) {
        hasOpenedChildScreenRef.current = false;
        loadData();
        return;
      }

      resetScrollToTop(false);
      runInstantEntrance();
      loadData();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (!hasOpenedChildScreenRef.current) {
        resetScrollToTop(false);
      }
    });

    runInstantEntrance();
    loadData();

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  // Actualización automática en tiempo real mientras el estudiante observa la pantalla
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(async () => {
        try {
          const [liveUser, fetchedRewards] = await Promise.all([
            userService.getMe().catch(() => null),
            rewardService.getRewards().catch(() => null),
          ]);

          if (liveUser && typeof liveUser.ecoPoints === 'number') {
            setUserPoints((prev) => {
              if (prev !== liveUser.ecoPoints) {
                memoryPointsCache = liveUser.ecoPoints;
                AsyncStorage.setItem(CACHE_POINTS_KEY, JSON.stringify(liveUser.ecoPoints)).catch(() => {});
                AsyncStorage.setItem('@user_data', JSON.stringify(liveUser)).catch(() => {});
                return liveUser.ecoPoints;
              }
              return prev;
            });
          }

          if (fetchedRewards && fetchedRewards.length > 0) {
            setRewards(fetchedRewards);
            memoryRewardsCache = fetchedRewards;
            AsyncStorage.setItem(CACHE_REWARDS_KEY, JSON.stringify(fetchedRewards)).catch(() => {});
          }
        } catch (e) {
          // Polling silencioso
        }
      }, 3000);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
      startPolling();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      stopPolling();
    });

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
      await loadData();
      runInstantEntrance();
    } catch (e) {
      console.error('[UserRewardsScreen] Error al refrescar:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const loadData = async () => {
    try {
      const [localUser, fetchedRewards, liveUser] = await Promise.all([
        AuthService.getCurrentUser().catch(() => null),
        rewardService.getRewards().catch(() => []),
        userService.getMe().catch(() => null),
      ]);

      const currentPts = liveUser?.ecoPoints ?? localUser?.ecoPoints ?? userPoints;
      setUserPoints(currentPts);
      memoryPointsCache = currentPts;
      AsyncStorage.setItem(CACHE_POINTS_KEY, JSON.stringify(currentPts)).catch(() => {});

      if (liveUser) {
        AsyncStorage.setItem('@user_data', JSON.stringify(liveUser)).catch(() => {});
      }

      if (fetchedRewards && fetchedRewards.length > 0) {
        const prevLen = rewards.length;
        setRewards(fetchedRewards);
        memoryRewardsCache = fetchedRewards;
        AsyncStorage.setItem(CACHE_REWARDS_KEY, JSON.stringify(fetchedRewards)).catch(() => {});
        if (prevLen === 0) {
          setRefreshKey((k) => k + 1);
        }
      }
    } catch (error: any) {
      console.error('Error al cargar recompensas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (name: string, color: string) => {
    switch (name) {
      case 'Coffee': return <Coffee size={26} color={color} />;
      case 'Shirt': return <Shirt size={26} color={color} />;
      case 'BookOpen': return <BookOpen size={26} color={color} />;
      case 'Utensils': return <Utensils size={26} color={color} />;
      case 'ShoppingBag': return <ShoppingBag size={26} color={color} />;
      case 'Award': return <Award size={26} color={color} />;
      case 'Trophy': return <Trophy size={26} color={color} />;
      case 'Medal': return <Medal size={26} color={color} />;
      case 'Ticket': return <Ticket size={26} color={color} />;
      case 'Sparkles': return <Sparkles size={26} color={color} />;
      case 'Droplet': return <Droplet size={26} color={color} />;
      case 'Star': return <Star size={26} color={color} />;
      case 'Zap': return <Zap size={26} color={color} />;
      case 'Smartphone': return <Smartphone size={26} color={color} />;
      case 'Package': return <Package size={26} color={color} />;
      case 'Gift':
      default:
        return <Gift size={26} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
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
            styles.header,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('Puntos');
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Volver atrás"
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.title}>Canjear recompensas</Text>
          </View>
          <Text style={styles.subtitle}>Canjea tus EcoPoints por incentivos ecológicos.</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.pointsCard,
            {
              opacity: pointsCardFade,
              transform: [
                { translateY: pointsCardSlide },
                { scale: pointsCardScale },
              ],
            },
          ]}
        >
          <View style={styles.pointsLeft}>
            <View style={styles.pointsIconWrapper}>
              <Sparkles size={20} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.pointsLabel}>TUS ECOPOINTS DISPONIBLES</Text>
              <Text style={styles.pointsValue}>{userPoints.toLocaleString()} EcoPoints</Text>
            </View>
          </View>
          <View style={styles.pointsBadgeRight}>
            <Text style={styles.pointsBadgeRightText}>Saldo activo</Text>
          </View>
        </Animated.View>

        {loading && rewards.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : rewards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Gift size={36} color={colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No hay recompensas disponibles</Text>
            <Text style={styles.emptySubtitle}>
              Pronto agregaremos nuevos incentivos para canjear con tus EcoPoints.
            </Text>
          </View>
        ) : (
          rewards.map((item, index) => {
            const isOutOfStock = item.stock === 0;
            const canAfford = userPoints >= item.pointsCost;

            return (
              <AnimatedRewardCard
                key={item._id || index}
                item={item}
                index={index}
                refreshKey={refreshKey}
                canAfford={canAfford}
                isOutOfStock={isOutOfStock}
                onRedeem={() => {
                  hasOpenedChildScreenRef.current = true;
                  navigation.navigate('ConfirmReward', { reward: item });
                }}
                colors={colors}
                styles={styles}
                getIcon={getIcon}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { padding: theme.spacing.m, paddingBottom: 100 },

    header: { marginBottom: 14, marginTop: 2 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    backButton: { marginRight: 10, padding: 4, marginLeft: -4 },
    title: { fontSize: 24, fontWeight: '900', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginLeft: 2 },

    pointsCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.7)',
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      ...theme.shadows.soft,
    },
    pointsLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pointsIconWrapper: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pointsLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.8,
    },
    pointsValue: {
      fontSize: 20,
      fontWeight: '900',
      color: '#16A34A',
      marginTop: 2,
    },
    pointsBadgeRight: {
      backgroundColor: 'rgba(22, 163, 74, 0.08)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    pointsBadgeRightText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#16A34A',
    },

    rewardCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.7)',
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      ...theme.shadows.soft,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    iconBox: {
      width: 58,
      height: 58,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    cardInfo: { flex: 1, alignItems: 'flex-start' },
    rewardName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 3 },
    rewardDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
    },
    pointsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    pointsBadgeText: { fontSize: 12, fontWeight: '800' },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },

    cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    availabilityText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
    actionButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 22,
      paddingVertical: 10,
      borderRadius: 12,
      ...theme.shadows.soft,
    },
    actionButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
    actionButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.65,
      elevation: 0,
      shadowOpacity: 0,
    },
    actionButtonDisabledText: {
      color: colors.textSecondary,
    },

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
