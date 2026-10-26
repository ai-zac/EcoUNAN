import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
  Easing,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import {
  GlassWater,
  FileText,
  Trash2,
  Box,
  Gift,
  X,
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Package,
  Droplet,
} from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { userService } from '../api/services/user.service';
import { RecycleService } from '../api/services/recycle.service';
import { rewardService } from '../api/services/reward.service';
import { targetRewardService, PinnedRewardInfo } from '../api/services/targetReward.service';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get('window');

type HistoryEntry =
  | { kind: 'recycle'; data: any }
  | { kind: 'redemption'; data: any };

type DatePeriod = 'all' | 'today' | '7d' | 'month' | 'custom';

const FILTERS = ['Todo', 'Ganados', 'Canjeados'];

const PERIOD_OPTIONS: { id: DatePeriod; label: string }[] = [
  { id: 'all', label: 'Histórico' },
  { id: 'today', label: 'Hoy' },
  { id: '7d', label: '7 días' },
  { id: 'month', label: 'Este mes' },
];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Claves para persistencia en caché instantánea
const CACHE_USER_KEY = '@ecounan_pts_user';
const CACHE_RECYCLES_KEY = '@ecounan_pts_recycles';
const CACHE_REDEMPTIONS_KEY = '@ecounan_pts_redemptions';
const CACHE_REWARDS_KEY = '@ecounan_pts_rewards';

// Caché en memoria para renderizado instantáneo en Frame 0
let memoryUserCache: any = null;
let memoryRecyclesCache: any[] = [];
let memoryRedemptionsCache: any[] = [];
let memoryRewardsCache: any[] = [];
let memoryPinnedRewardCache: PinnedRewardInfo | null = null;

// Hidratar caché desde AsyncStorage al cargar módulo
AsyncStorage.multiGet([
  CACHE_USER_KEY,
  CACHE_RECYCLES_KEY,
  CACHE_REDEMPTIONS_KEY,
  CACHE_REWARDS_KEY,
])
  .then((results) => {
    results.forEach(([key, val]) => {
      if (!val) return;
      try {
        const parsed = JSON.parse(val);
        if (key === CACHE_USER_KEY && !memoryUserCache) memoryUserCache = parsed;
        if (key === CACHE_RECYCLES_KEY && memoryRecyclesCache.length === 0) memoryRecyclesCache = parsed;
        if (key === CACHE_REDEMPTIONS_KEY && memoryRedemptionsCache.length === 0) memoryRedemptionsCache = parsed;
        if (key === CACHE_REWARDS_KEY && memoryRewardsCache.length === 0) memoryRewardsCache = parsed;
      } catch (e) {}
    });
  })
  .catch(() => {});

interface AnimatedHistoryItemProps {
  entry: HistoryEntry;
  index: number;
  animationKey: number;
  onPress: () => void;
  colors: any;
  styles: any;
  getIconForType: (type: string, color: string) => React.ReactNode;
}

const AnimatedHistoryItem: React.FC<AnimatedHistoryItemProps> = React.memo(({
  entry,
  index,
  animationKey,
  onPress,
  colors,
  styles,
  getIconForType,
}) => {
  // Animación en cascada idéntica a RecycleScreen: baja desde -18 a 0 con resorte suave y micro-pop del ícono
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
  }, [animationKey]);

  const item = entry.data;

  if (entry.kind === 'redemption') {
    const rewardTitle =
      typeof item.reward === 'object' && item.reward !== null
        ? item.reward.title
        : 'Recompensa canjeada';
    const isPending = item.status === 'pending';

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <Animated.View
          style={[
            styles.historyItem,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: cardScale }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.historyIconBg,
              { backgroundColor: '#FEF3C7', transform: [{ scale: iconScale }] },
            ]}
          >
            <Gift size={22} color="#D97706" />
          </Animated.View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyAction} numberOfLines={1}>
              {rewardTitle} {isPending ? '(Pendiente)' : ''}
            </Text>
            <Text style={styles.historyDate}>
              {new Date(item.createdAt).toLocaleDateString([], {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <Text style={[styles.historyPoints, { color: colors.textSecondary }]}>
            -{item.pointsSpent} pts
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  // Entrada de reciclaje
  let iconBg = '#DCFCE7';
  let iconColor = '#16A34A';
  let iconType = 'plastic';

  const firstMaterial =
    item.items && item.items.length > 0
      ? item.items[0].materialType
      : (item as any).materialType;

  if (firstMaterial === 'aluminio') {
    iconBg = '#FEF9C3';
    iconColor = '#CA8A04';
    iconType = 'metal';
  } else if (firstMaterial === 'papel') {
    iconBg = '#EDE9FE';
    iconColor = '#8B5CF6';
    iconType = 'paper';
  } else if (firstMaterial === 'carton') {
    iconBg = '#DBEAFE';
    iconColor = '#2563EB';
    iconType = 'carton';
  }

  const materialsText =
    item.items && item.items.length > 0
      ? item.items.map((i: any) => `${i.weight}x ${i.materialType}`).join(', ')
      : (item as any).materialType || 'Varios';

  const itemPoints =
    item.totalPoints !== undefined
      ? item.totalPoints
      : (item as any).pointsEarned || 0;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Animated.View
        style={[
          styles.historyItem,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: cardScale }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.historyIconBg,
            { backgroundColor: iconBg, transform: [{ scale: iconScale }] },
          ]}
        >
          {getIconForType(iconType, iconColor)}
        </Animated.View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyAction} numberOfLines={1}>
            {materialsText} {item.status === 'pending' ? '(Pendiente)' : ''}
          </Text>
          <Text style={styles.historyDate}>
            {new Date(item.createdAt).toLocaleDateString([], {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Text
          style={[
            styles.historyPoints,
            {
              color:
                item.status === 'pending'
                  ? colors.textSecondary
                  : colors.accent,
            },
          ]}
        >
          {itemPoints > 0 ? `+${itemPoints} pts` : '--'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

export const PointsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const insets = useSafeAreaInsets();
  const scrollRef = useRef<any>(null);
  useScrollToTop(scrollRef);
  const hasOpenedChildScreenRef = useRef(false);

  // Animaciones independientes por sección para disparo instantáneo
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;

  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(16)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const circleScale = useRef(new Animated.Value(0.85)).current;
  const controlsFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Estados de datos con hidratación inmediata desde caché
  const [user, setUser] = useState<any>(memoryUserCache);
  const [recycles, setRecycles] = useState<any[]>(memoryRecyclesCache);
  const [redemptions, setRedemptions] = useState<any[]>(memoryRedemptionsCache);
  const [rewards, setRewards] = useState<any[]>(memoryRewardsCache);
  const [pinnedReward, setPinnedReward] = useState<PinnedRewardInfo | null>(memoryPinnedRewardCache);

  // Estados de filtros y calendario
  const [activeFilter, setActiveFilter] = useState('Todo');
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [animationKey, setAnimationKey] = useState(0);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HistoryEntry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const currentPoints = user?.ecoPoints || 0;

  // Recompensas ordenadas por costo para encontrar la meta fijada o más cercana
  const sortedRewards = useMemo(() => {
    return [...rewards].sort((a, b) => a.pointsCost - b.pointsCost);
  }, [rewards]);

  const targetReward = useMemo(() => {
    const redeemedIds = new Set(
      redemptions.map((r: any) => String(r.reward?._id || r.reward || r.rewardId))
    );

    if (pinnedReward && !redeemedIds.has(String(pinnedReward._id))) {
      const liveMatched = rewards.find((r) => r._id === pinnedReward._id);
      return {
        ...(liveMatched || pinnedReward),
        isPinned: true,
      };
    }
    if (!sortedRewards.length) return null;
    const unredeemed = sortedRewards.filter((r) => !redeemedIds.has(String(r._id)));
    const upcoming = (unredeemed.length ? unredeemed : sortedRewards).find((r) => r.pointsCost > currentPoints);
    return {
      ...(upcoming || unredeemed[0] || sortedRewards[0]),
      isPinned: false,
    };
  }, [pinnedReward, rewards, sortedRewards, currentPoints, redemptions]);

  const targetPoints = targetReward?.pointsCost || 100;
  const progressPercent = targetReward
    ? Math.min(100, Math.max(0, Math.round((currentPoints / targetPoints) * 100)))
    : currentPoints > 0
    ? 100
    : 0;
  const pointsRemaining = Math.max(0, targetPoints - currentPoints);

  // Animación de entrada instantánea para cabecera, tarjeta de balance y controles
  const playEntranceAnimation = () => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);

    cardFade.setValue(0);
    cardSlide.setValue(16);
    cardScale.setValue(0.96);
    circleScale.setValue(0.85);
    controlsFade.setValue(0);
    progressAnim.setValue(0);

    Animated.stagger(45, [
      // 1. Cabecera y botón de retroceso
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 75, friction: 8, useNativeDriver: true }),
        Animated.spring(backButtonScale, { toValue: 1, tension: 85, friction: 7, useNativeDriver: true }),
      ]),

      // 2. Tarjeta de balance y donut chart
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(40),
          Animated.spring(circleScale, { toValue: 1, tension: 85, friction: 6, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(80),
          Animated.timing(progressAnim, {
            toValue: 1,
            duration: 850,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
      ]),

      // 3. Botón de canje y filtros
      Animated.timing(controlsFade, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
  };

  const runInstantEntrance = () => {
    playEntranceAnimation();
    setAnimationKey((k) => k + 1);
  };

  // 1. Hidratación de AsyncStorage en caso de caché fría
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [u, rec, red, rew, pin] = await Promise.all([
          AsyncStorage.getItem(CACHE_USER_KEY),
          AsyncStorage.getItem(CACHE_RECYCLES_KEY),
          AsyncStorage.getItem(CACHE_REDEMPTIONS_KEY),
          AsyncStorage.getItem(CACHE_REWARDS_KEY),
          targetRewardService.getTargetReward(),
        ]);
        if (!isMounted) return;
        let hasData = false;
        if (u && !memoryUserCache) {
          const parsed = JSON.parse(u);
          memoryUserCache = parsed;
          setUser(parsed);
        }
        if (rec && memoryRecyclesCache.length === 0) {
          const parsed = JSON.parse(rec);
          memoryRecyclesCache = parsed;
          setRecycles(parsed);
          hasData = true;
        }
        if (red && memoryRedemptionsCache.length === 0) {
          const parsed = JSON.parse(red);
          memoryRedemptionsCache = parsed;
          setRedemptions(parsed);
          hasData = true;
        }
        if (rew && memoryRewardsCache.length === 0) {
          const parsed = JSON.parse(rew);
          memoryRewardsCache = parsed;
          setRewards(parsed);
        }
        if (pin) {
          memoryPinnedRewardCache = pin;
          setPinnedReward(pin);
        }
        if (hasData) {
          setAnimationKey((k) => k + 1);
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

  // 2. Disparo instantáneo al entrar a la pantalla y reseteo de posición al inicio de la pantalla
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

  // Polling automático en tiempo real en segundo plano mientras PointsScreen esté activa
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(async () => {
        try {
          await loadData();
        } catch (e) {
          // Polling silencioso
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

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 850,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
      runInstantEntrance();
    } catch (e) {
      console.error('[PointsScreen] Error al refrescar:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const loadData = async () => {
    try {
      const [liveUser, historyData, myRedemptions, storeRewards, savedTarget] = await Promise.all([
        userService.getMe().catch(() => null),
        RecycleService.getHistory().catch(() => []),
        rewardService.getMyRewards().catch(() => []),
        rewardService.getRewards().catch(() => []),
        targetRewardService.getTargetReward().catch(() => null),
      ]);

      if (liveUser) {
        setUser(liveUser);
        memoryUserCache = liveUser;
        AsyncStorage.setItem(CACHE_USER_KEY, JSON.stringify(liveUser)).catch(() => {});
      }
      if (historyData) {
        const prevCount = recycles.length;
        setRecycles(historyData);
        memoryRecyclesCache = historyData;
        AsyncStorage.setItem(CACHE_RECYCLES_KEY, JSON.stringify(historyData)).catch(() => {});
        // Si no había datos al inicio y llegaron ahora, anima la cascada
        if (prevCount === 0 && historyData.length > 0) {
          setAnimationKey((k) => k + 1);
        }
      }
      if (myRedemptions) {
        setRedemptions(myRedemptions);
        memoryRedemptionsCache = myRedemptions;
        AsyncStorage.setItem(CACHE_REDEMPTIONS_KEY, JSON.stringify(myRedemptions)).catch(() => {});
      }
      if (storeRewards) {
        setRewards(storeRewards);
        memoryRewardsCache = storeRewards;
        AsyncStorage.setItem(CACHE_REWARDS_KEY, JSON.stringify(storeRewards)).catch(() => {});
      }
      if (savedTarget !== undefined) {
        let activeTarget = savedTarget;
        if (savedTarget && myRedemptions && myRedemptions.length > 0) {
          const isRedeemed = myRedemptions.some(
            (r: any) => String(r.reward?._id || r.reward || r.rewardId) === String(savedTarget._id)
          );
          if (isRedeemed) {
            await targetRewardService.clearTargetReward();
            activeTarget = null;
          }
        }
        setPinnedReward(activeTarget);
        memoryPinnedRewardCache = activeTarget;
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Mapeo de fechas con actividad para mostrar puntitos en el calendario
  const activityDates = useMemo(() => {
    const map: Record<string, { hasRecycle: boolean; hasRedemption: boolean }> = {};
    recycles.forEach((r) => {
      if (r.createdAt) {
        const d = new Date(r.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = { hasRecycle: false, hasRedemption: false };
        map[key].hasRecycle = true;
      }
    });
    redemptions.forEach((r) => {
      if (r.createdAt) {
        const d = new Date(r.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!map[key]) map[key] = { hasRecycle: false, hasRedemption: false };
        map[key].hasRedemption = true;
      }
    });
    return map;
  }, [recycles, redemptions]);

  // Historial filtrado tanto por tipo (Todo, Ganados, Canjeados) como por período de fecha
  const filteredHistory: HistoryEntry[] = useMemo(() => {
    let list: HistoryEntry[] = [];
    if (activeFilter === 'Ganados') {
      list = recycles.map((data) => ({ kind: 'recycle', data }));
    } else if (activeFilter === 'Canjeados') {
      list = redemptions.map((data) => ({ kind: 'redemption', data }));
    } else {
      list = [
        ...recycles.map((data) => ({ kind: 'recycle' as const, data })),
        ...redemptions.map((data) => ({ kind: 'redemption' as const, data })),
      ];
    }

    list.sort(
      (a, b) =>
        new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime()
    );

    if (datePeriod === 'all') {
      return list;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

    if (datePeriod === 'today') {
      return list.filter((entry) => {
        const t = new Date(entry.data.createdAt).getTime();
        return t >= startOfToday && t <= endOfToday;
      });
    }

    if (datePeriod === '7d') {
      const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
      return list.filter((entry) => {
        const t = new Date(entry.data.createdAt).getTime();
        return t >= sevenDaysAgo && t <= endOfToday;
      });
    }

    if (datePeriod === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return list.filter((entry) => {
        const t = new Date(entry.data.createdAt).getTime();
        return t >= startOfMonth && t <= endOfMonth;
      });
    }

    if (datePeriod === 'custom' && selectedDate) {
      const selectedStart = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      ).getTime();
      const selectedEnd = selectedStart + 24 * 60 * 60 * 1000 - 1;
      return list.filter((entry) => {
        const t = new Date(entry.data.createdAt).getTime();
        return t >= selectedStart && t <= selectedEnd;
      });
    }

    return list;
  }, [activeFilter, datePeriod, selectedDate, recycles, redemptions]);

  // Handlers que re-activan la animación en cascada de los elementos
  const handleFilterChange = (filter: string) => {
    if (activeFilter === filter) return;
    setActiveFilter(filter);
    setAnimationKey((k) => k + 1);
  };

  const handlePeriodChange = (period: DatePeriod) => {
    if (datePeriod === period && period !== 'custom') return;
    setDatePeriod(period);
    if (period !== 'custom') {
      setSelectedDate(null);
    }
    setAnimationKey((k) => k + 1);
  };

  const handleSelectDay = (dayNum: number) => {
    const chosen = new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), dayNum);
    setSelectedDate(chosen);
    setDatePeriod('custom');
    setCalendarModalVisible(false);
    setAnimationKey((k) => k + 1);
  };

  const handleSelectToday = () => {
    const today = new Date();
    setCurrentCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
    setDatePeriod('today');
    setCalendarModalVisible(false);
    setAnimationKey((k) => k + 1);
  };

  const handlePrevMonth = () => {
    setCurrentCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Celdas del calendario para el mes seleccionado
  const calendarGrid = useMemo(() => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const rawFirstDay = new Date(year, month, 1).getDay();
    // Lunes = 0, Domingo = 6
    const firstDayOffset = rawFirstDay === 0 ? 6 : rawFirstDay - 1;

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOffset; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [currentCalendarMonth]);

  const getIconForType = (type: string, color: string) => {
    switch (type) {
      case 'plastic':
      case 'pet':
        return <GlassWater size={20} color={color} />;
      case 'metal':
      case 'aluminio':
        return <Coffee size={20} color={color} />;
      case 'papel':
        return <FileText size={20} color={color} />;
      case 'carton':
        return <Package size={20} color={color} />;
      default:
        return <Box size={20} color={color} />;
    }
  };

  const renderDonutChart = () => {
    const size = 160;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const targetOffset = circumference - (progressPercent / 100) * circumference;

    return (
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <Circle
            stroke={colors.border}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <AnimatedCircle
            stroke={colors.accent}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, targetOffset],
            })}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.chartTextContainer}>
          <Text style={styles.chartValue}>{currentPoints}</Text>
          <Text style={styles.chartSubValue}>/ {targetPoints} pts</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, colors.accent]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Cabecera con animación propia */}
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.titleRow}>
            <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate('Inicio');
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Volver atrás"
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.title}>Mis puntos</Text>
          </View>
          <Text style={styles.subtitle}>Gestiona tus logros y canjes ambientales.</Text>
        </Animated.View>

        {/* Tarjeta de Balance animada con escala y resorte */}
        <Animated.View
          style={[
            styles.balanceCard,
            {
              opacity: cardFade,
              transform: [{ translateY: cardSlide }, { scale: cardScale }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: circleScale }] }}>
            {renderDonutChart()}
          </Animated.View>
          <View style={styles.balanceTextWrapper}>
            <Text style={styles.balanceTitle}>Puntos disponibles</Text>
            <Text style={styles.balanceSubtitle}>
              {targetReward
                ? targetReward.isPinned
                  ? currentPoints >= targetPoints
                    ? `¡Meta alcanzada! Ya puedes canjear ${targetReward.title}.`
                    : `Te faltan ${pointsRemaining.toLocaleString()} pts para alcanzar tu meta: ${targetReward.title} (${progressPercent}%).`
                  : currentPoints >= targetPoints
                  ? `¡Ya puedes canjear ${targetReward.title}!`
                  : `Te faltan ${pointsRemaining.toLocaleString()} pts para ${targetReward.title} (${progressPercent}%).`
                : `${progressPercent}% completado.`}
            </Text>
          </View>
        </Animated.View>

        {/* Controles de Canje y Filtros */}
        <Animated.View style={{ opacity: controlsFade }}>
          <TouchableOpacity
            style={styles.redeemButton}
            onPress={() => {
              hasOpenedChildScreenRef.current = true;
              navigation.navigate('UserRewards');
            }}
          >
            <Gift size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.redeemButtonText}>Canjear recompensas</Text>
          </TouchableOpacity>

          {/* Filtros de Categoría: Todo, Ganados, Canjeados */}
          <View style={styles.filtersContainer}>
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => handleFilterChange(filter)}
                  activeOpacity={0.7}
                  style={[
                    styles.filterPill,
                    isActive ? styles.filterPillActive : styles.filterPillInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isActive ? styles.filterTextActive : styles.filterTextInactive,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Filtros de Período y Botón de Calendario */}
          <View style={styles.periodRowWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.periodScrollContent}
            >
              {PERIOD_OPTIONS.map((item) => {
                const isSelected = datePeriod === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    onPress={() => handlePeriodChange(item.id)}
                    style={[styles.periodChip, isSelected && styles.periodChipActive]}
                  >
                    <Text
                      style={[
                        styles.periodChipText,
                        isSelected && styles.periodChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Chip de Calendario con fecha seleccionada o botón */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCalendarModalVisible(true)}
                style={[
                  styles.calendarChip,
                  datePeriod === 'custom' && styles.calendarChipActive,
                ]}
              >
                <Calendar
                  size={14}
                  color={datePeriod === 'custom' ? '#FFFFFF' : colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.calendarChipText,
                    datePeriod === 'custom' && styles.calendarChipTextActive,
                  ]}
                >
                  {datePeriod === 'custom' && selectedDate
                    ? `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()].slice(0, 3)}.`
                    : 'Calendario'}
                </Text>
                {datePeriod === 'custom' && (
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={(e) => {
                      e.stopPropagation();
                      handlePeriodChange('all');
                    }}
                    style={styles.clearDateBtn}
                  >
                    <X size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Encabezado del historial con contador */}
          <View style={styles.historyHeaderRow}>
            <Text style={styles.sectionTitle}>Historial de puntos</Text>
            <View style={styles.historyCountBadge}>
              <Text style={styles.historyCountText}>
                {filteredHistory.length} {filteredHistory.length === 1 ? 'movimiento' : 'movimientos'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Lista animada con efecto cascada (bajan los elementos con micro-pop) */}
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Calendar size={28} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>Sin movimientos</Text>
            <Text style={styles.emptySubtitle}>
              {datePeriod === 'custom' && selectedDate
                ? `No se encontraron registros para el ${selectedDate.toLocaleDateString()}.`
                : datePeriod === 'today'
                ? 'No hay movimientos registrados hoy.'
                : activeFilter === 'Canjeados'
                ? 'No has realizado canjes en este período.'
                : activeFilter === 'Ganados'
                ? 'No has ganado puntos en este período.'
                : 'No se encontraron actividades para este período.'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.emptyResetBtn}
              onPress={() => {
                setActiveFilter('Todo');
                handlePeriodChange('all');
              }}
            >
              <Text style={styles.emptyResetText}>Ver todo el historial</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredHistory.map((entry, index) => {
            const key = entry.data._id || `${entry.kind}-${index}`;
            return (
              <AnimatedHistoryItem
                key={key}
                entry={entry}
                index={index}
                animationKey={animationKey}
                onPress={() => {
                  setSelectedItem(entry);
                  setModalVisible(true);
                }}
                colors={colors}
                styles={styles}
                getIconForType={getIconForType}
              />
            );
          })
        )}
      </ScrollView>

      {/* Modal Interactivo de Calendario */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={calendarModalVisible}
        onRequestClose={() => setCalendarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            {/* Cabecera del Calendario */}
            <View style={styles.calendarModalHeader}>
              <View>
                <Text style={styles.calendarModalTitle}>Calendario de actividad</Text>
                <Text style={styles.calendarModalSubtitle}>Selecciona un día para ver tus movimientos</Text>
              </View>
              <TouchableOpacity
                style={styles.calendarCloseBtn}
                onPress={() => setCalendarModalVisible(false)}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Selector de Mes */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={handlePrevMonth}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.monthNavTitle}>
                {MONTH_NAMES[currentCalendarMonth.getMonth()]} {currentCalendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity
                style={styles.monthNavBtn}
                onPress={handleNextMonth}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronRight size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Días de la semana */}
            <View style={styles.weekdaysRow}>
              {WEEKDAYS.map((day) => (
                <Text key={day} style={styles.weekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Cuadrícula de días */}
            <View style={styles.calendarGrid}>
              {calendarGrid.map((dayNum, idx) => {
                if (dayNum === null) {
                  return <View key={`blank-${idx}`} style={styles.dayCellPlaceholder} />;
                }

                const today = new Date();
                const isToday =
                  today.getDate() === dayNum &&
                  today.getMonth() === currentCalendarMonth.getMonth() &&
                  today.getFullYear() === currentCalendarMonth.getFullYear();

                const isSelected =
                  selectedDate !== null &&
                  selectedDate.getDate() === dayNum &&
                  selectedDate.getMonth() === currentCalendarMonth.getMonth() &&
                  selectedDate.getFullYear() === currentCalendarMonth.getFullYear();

                const dateKey = `${currentCalendarMonth.getFullYear()}-${String(
                  currentCalendarMonth.getMonth() + 1
                ).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const activity = activityDates[dateKey];

                return (
                  <TouchableOpacity
                    key={`day-${dayNum}`}
                    activeOpacity={0.65}
                    onPress={() => handleSelectDay(dayNum)}
                    style={[
                      styles.dayCell,
                      isToday && styles.dayCellToday,
                      isSelected && styles.dayCellSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isToday && styles.dayCellTextToday,
                        isSelected && styles.dayCellTextSelected,
                      ]}
                    >
                      {dayNum}
                    </Text>

                    {/* Puntitos de actividad */}
                    <View style={styles.activityDotsRow}>
                      {activity?.hasRecycle && (
                        <View
                          style={[
                            styles.activityDot,
                            { backgroundColor: isSelected ? '#FFFFFF' : '#10B981' },
                          ]}
                        />
                      )}
                      {activity?.hasRedemption && (
                        <View
                          style={[
                            styles.activityDot,
                            { backgroundColor: isSelected ? '#FFFFFF' : '#F59E0B' },
                          ]}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Leyenda de actividad */}
            <View style={styles.calendarLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Reciclaje</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Canje</Text>
              </View>
            </View>

            {/* Botones de acción inferior */}
            <View style={styles.calendarFooterRow}>
              <TouchableOpacity
                style={styles.calendarFooterSecondaryBtn}
                onPress={handleSelectToday}
              >
                <Text style={styles.calendarFooterSecondaryText}>Hoy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarFooterSecondaryBtn}
                onPress={() => handlePeriodChange('all')}
              >
                <Text style={styles.calendarFooterSecondaryText}>Ver todo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.calendarFooterPrimaryBtn}
                onPress={() => setCalendarModalVisible(false)}
              >
                <Text style={styles.calendarFooterPrimaryText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Detalle de Movimiento */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>

            {selectedItem && selectedItem.kind === 'redemption' && (
              <>
                <Text style={styles.modalTitle}>Detalle de Canje</Text>

                <View style={styles.modalStatusBadge}>
                  <Text
                    style={[
                      styles.modalStatusText,
                      { color: selectedItem.data.status === 'completed' ? '#16A34A' : '#CA8A04' },
                    ]}
                  >
                    {selectedItem.data.status === 'completed' ? 'Completado' : 'Pendiente de recoger'}
                  </Text>
                </View>

                <Text style={styles.modalDate}>
                  Canjeado el {new Date(selectedItem.data.createdAt).toLocaleDateString()} a las{' '}
                  {new Date(selectedItem.data.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>

                <View style={styles.modalRedemptionBox}>
                  <Text style={styles.modalPointsLabel}>Puntos canjeados</Text>
                  <Text style={styles.modalRedemptionValue}>-{selectedItem.data.pointsSpent}</Text>
                </View>

                {typeof selectedItem.data.reward === 'object' && selectedItem.data.reward?.description ? (
                  <View style={styles.modalDescBox}>
                    <Text style={styles.modalDescTitle}>Recompensa:</Text>
                    <Text style={styles.modalDescText}>{selectedItem.data.reward.description}</Text>
                  </View>
                ) : null}

                {selectedItem.data.status === 'pending' && (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                        marginBottom: 12,
                        textAlign: 'center',
                      }}
                    >
                      Muestra este QR al administrador para completar la entrega.
                    </Text>
                    <QRCode
                      value={selectedItem.data.qrCodeData}
                      size={180}
                      backgroundColor="#FFFFFF"
                    />
                  </View>
                )}
              </>
            )}

            {selectedItem && selectedItem.kind === 'recycle' && (
              <>
                <Text style={styles.modalTitle}>Detalle de Registro</Text>

                <View style={styles.modalStatusBadge}>
                  <Text
                    style={[
                      styles.modalStatusText,
                      {
                        color:
                          selectedItem.data.status === 'validated'
                            ? '#16A34A'
                            : selectedItem.data.status === 'rejected'
                            ? '#EF4444'
                            : '#CA8A04',
                      },
                    ]}
                  >
                    {selectedItem.data.status === 'validated'
                      ? 'Completado'
                      : selectedItem.data.status === 'rejected'
                      ? 'Rechazado'
                      : 'En proceso'}
                  </Text>
                </View>

                <Text style={styles.modalDate}>
                  Registrado el {new Date(selectedItem.data.createdAt).toLocaleDateString()} a las{' '}
                  {new Date(selectedItem.data.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>

                <View style={styles.modalPointsBox}>
                  <Text style={styles.modalPointsLabel}>Puntos Obtenidos</Text>
                  <Text style={styles.modalPointsValue}>+{selectedItem.data.totalPoints || 0}</Text>
                </View>

                <Text style={styles.modalSectionTitle}>Materiales entregados:</Text>
                {selectedItem.data.items?.map((m: any, idx: number) => (
                  <View key={idx} style={styles.modalMaterialRow}>
                    <Text style={styles.modalMaterialText}>
                      • {m.weight}x {m.materialType}
                    </Text>
                    <Text style={styles.modalMaterialPoints}>+{m.pointsEarned || 0} pts</Text>
                  </View>
                ))}

                {selectedItem.data.description ? (
                  <View style={styles.modalDescBox}>
                    <Text style={styles.modalDescTitle}>Tus Notas:</Text>
                    <Text style={styles.modalDescText}>{selectedItem.data.description}</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: theme.spacing.m, paddingTop: 4, paddingBottom: 100 },
    header: { marginBottom: 14, marginTop: 2 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    backButton: { marginRight: 10, padding: 4, marginLeft: -4 },
    title: { fontSize: 24, fontWeight: '900', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginLeft: 2 },

    balanceCard: {
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.xl,
      alignItems: 'center',
      marginBottom: theme.spacing.l,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.6)',
      ...theme.shadows.soft,
    },
    chartContainer: {
      width: 160,
      height: 160,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.l,
    },
    chartTextContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartValue: {
      fontSize: 32,
      fontWeight: '900',
      color: colors.primary,
    },
    chartSubValue: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: -2,
    },
    balanceTextWrapper: { alignItems: 'center' },
    balanceTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    balanceSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    redeemButton: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.l,
    },
    redeemButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },

    filtersContainer: {
      flexDirection: 'row',
      marginBottom: theme.spacing.m,
      gap: theme.spacing.s,
    },
    filterPill: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.round,
    },
    filterPillActive: {
      backgroundColor: colors.accent,
    },
    filterPillInactive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '600',
    },
    filterTextActive: { color: colors.white },
    filterTextInactive: { color: colors.textSecondary },

    periodRowWrapper: {
      marginBottom: theme.spacing.l,
      marginHorizontal: -theme.spacing.m,
    },
    periodScrollContent: {
      paddingHorizontal: theme.spacing.m,
      gap: 8,
      alignItems: 'center',
    },
    periodChip: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    periodChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    periodChipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },

    calendarChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      paddingHorizontal: 13,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    calendarChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    calendarChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    calendarChipTextActive: {
      color: '#FFFFFF',
    },
    clearDateBtn: {
      marginLeft: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderRadius: 10,
      padding: 2,
    },

    historyHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.m,
    },
    sectionTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.text,
    },
    historyCountBadge: {
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyCountText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },

    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      marginBottom: theme.spacing.s,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.6)',
      ...theme.shadows.soft,
    },
    historyIconBg: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
    },
    historyInfo: { flex: 1 },
    historyAction: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    historyDate: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    historyPoints: {
      fontSize: 16,
      fontWeight: '800',
    },

    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 36,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 6,
    },
    emptyIconBg: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 18,
    },
    emptyResetBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    emptyResetText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },

    // Modal de Calendario
    calendarModalContent: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      ...theme.shadows.medium,
    },
    calendarModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    calendarModalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    calendarModalSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    calendarCloseBtn: {
      padding: 4,
    },
    monthNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      paddingHorizontal: 6,
    },
    monthNavBtn: {
      padding: 8,
      borderRadius: 10,
      backgroundColor: colors.background,
    },
    monthNavTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    weekdaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 8,
    },
    weekdayText: {
      width: (width - 80) / 7,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCellPlaceholder: {
      width: (width - 80) / 7,
      height: 42,
    },
    dayCell: {
      width: (width - 80) / 7,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      marginVertical: 2,
    },
    dayCellToday: {
      borderWidth: 1.5,
      borderColor: colors.accent,
    },
    dayCellSelected: {
      backgroundColor: colors.primary,
    },
    dayCellText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    dayCellTextToday: {
      color: colors.accent,
      fontWeight: '800',
    },
    dayCellTextSelected: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    activityDotsRow: {
      flexDirection: 'row',
      gap: 2,
      marginTop: 2,
      height: 4,
    },
    activityDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    calendarLegendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    calendarFooterRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 16,
    },
    calendarFooterSecondaryBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    calendarFooterSecondaryText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    calendarFooterPrimaryBtn: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    calendarFooterPrimaryText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    // Modal Detalle
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      ...theme.shadows.medium,
    },
    closeModalButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      padding: 8,
      zIndex: 1,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8,
      paddingRight: 32,
    },
    modalStatusBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 12,
    },
    modalStatusText: {
      fontSize: 12,
      fontWeight: '700',
    },
    modalDate: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 24,
    },
    modalPointsBox: {
      backgroundColor: '#F0FDF4',
      borderWidth: 1,
      borderColor: '#BBF7D0',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginBottom: 24,
    },
    modalPointsLabel: {
      fontSize: 14,
      color: '#16A34A',
      fontWeight: '600',
      marginBottom: 4,
    },
    modalPointsValue: {
      fontSize: 32,
      fontWeight: '900',
      color: '#16A34A',
    },
    modalRedemptionBox: {
      backgroundColor: '#FFF7ED',
      borderWidth: 1,
      borderColor: '#FED7AA',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      marginBottom: 24,
    },
    modalRedemptionValue: {
      fontSize: 32,
      fontWeight: '900',
      color: '#D97706',
    },
    modalSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    modalMaterialRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    modalMaterialText: {
      fontSize: 15,
      color: colors.text,
    },
    modalMaterialPoints: {
      fontSize: 15,
      fontWeight: '600',
      color: '#10B981',
    },
    modalDescBox: {
      marginTop: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      borderRadius: 12,
    },
    modalDescTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    modalDescText: {
      fontSize: 14,
      color: colors.text,
    },
  });
