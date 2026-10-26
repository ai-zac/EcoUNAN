import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated, Easing, RefreshControl } from 'react-native';
import { Leaf, Gift, ArrowLeft, Target } from 'lucide-react-native';
import { useScrollToTop } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { goalService, GoalProgress } from '../api/services/goal.service';
import { userService } from '../api/services/user.service';
import { targetRewardService, PinnedRewardInfo } from '../api/services/targetReward.service';
import { rewardService } from '../api/services/reward.service';
import { Goal } from '../types';

const GOALS_CACHE_KEY = '@ecounan_goals_cache';
const PROGRESS_CACHE_KEY = '@ecounan_goals_prog_cache';

interface GoalCardItemProps {
  goal: Goal;
  progress: GoalProgress | undefined;
  claimingId: string | null;
  onClaim: (goal: Goal) => void;
  index: number;
  refreshKey: number;
  colors: any;
  styles: any;
}

const GoalCardItem = React.memo(({
  goal,
  progress,
  claimingId,
  onClaim,
  index,
  refreshKey,
  colors,
  styles,
}: GoalCardItemProps) => {
  const userRecyclesCount = progress?.progress ?? 0;
  const claimed = progress?.claimed ?? false;
  const isExpired = new Date(goal.endDate).getTime() < Date.now();
  const isCompleted = userRecyclesCount >= goal.targetRecycles;
  const percentage = Math.min((userRecyclesCount / goal.targetRecycles) * 100, 100);
  const remaining = Math.max(goal.targetRecycles - userRecyclesCount, 0);

  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(20)).current;
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    cardFade.setValue(0);
    cardSlide.setValue(20);
    cardScale.setValue(0.96);
    iconScale.setValue(0.6);
    progressAnim.setValue(0);

    const delay = Math.min(index * 60, 360);

    Animated.parallel([
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(cardFade, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.spring(cardSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
          Animated.spring(cardScale, { toValue: 1, tension: 75, friction: 7.5, useNativeDriver: true }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(delay + 60),
        Animated.spring(iconScale, { toValue: 1, tension: 90, friction: 6, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.delay(delay + 100),
        Animated.timing(progressAnim, {
          toValue: percentage,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [refreshKey, percentage]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.goalCard,
        claimed && styles.goalCardClaimed,
        {
          opacity: cardFade,
          transform: [{ translateY: cardSlide }, { scale: cardScale }],
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconInfoRow}>
          <Animated.View style={{ transform: [{ scale: iconScale }] }}>
            <View style={[styles.iconBg, { backgroundColor: isCompleted ? '#DCFCE7' : '#FEF3C7' }]}>
              <Leaf size={20} color={isCompleted ? '#16A34A' : '#D97706'} />
            </View>
          </Animated.View>
          <View style={{ flex: 1 }}>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={[styles.goalPoints, { color: isCompleted ? '#16A34A' : '#D97706' }]}>
              {goal.rewardPoints.toLocaleString()} puntos de recompensa
            </Text>
          </View>
        </View>

        {claimed ? (
          <View style={styles.statusBadgeGreen}>
            <Text style={styles.statusBadgeTextGreen}>Reclamada ✓</Text>
          </View>
        ) : isCompleted ? (
          <View style={styles.statusBadgeGreen}>
            <Text style={styles.statusBadgeTextGreen}>¡Lista para reclamar!</Text>
          </View>
        ) : (
          <View style={styles.statusBadgeOrange}>
            <Text style={styles.statusBadgeTextOrange}>{remaining} recic. faltantes</Text>
          </View>
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth, backgroundColor: isCompleted ? '#16A34A' : colors.primary },
            ]}
          />
        </View>
      </View>

      <View style={styles.progressDetailsRow}>
        <Text style={styles.progressPercentage}>Progreso: {percentage.toFixed(0)}%</Text>
        <Text style={styles.progressValues}>
          {isCompleted ? '¡Meta completada!' : `${userRecyclesCount}/${goal.targetRecycles} reciclajes`}
        </Text>
      </View>

      <View style={styles.rewardContainer}>
        <Text style={styles.rewardLabel}>Descripción: </Text>
        <Text style={styles.rewardValue}>{goal.description}</Text>
      </View>

      {isCompleted && !claimed && !isExpired && (
        <TouchableOpacity
          style={[styles.claimButton, claimingId === goal._id && { opacity: 0.6 }]}
          disabled={claimingId === goal._id}
          onPress={() => onClaim(goal)}
        >
          {claimingId === goal._id ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Gift size={18} color="#FFFFFF" />
              <Text style={styles.claimButtonText}>
                Reclamar +{goal.rewardPoints.toLocaleString()} pts
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {claimed && (
        <Text style={styles.claimedNote}>Recompensa ya reclamada para esta meta.</Text>
      )}
    </Animated.View>
  );
});

export const GoalsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, GoalProgress>>({});
  const [pinnedReward, setPinnedReward] = useState<PinnedRewardInfo | null>(null);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const scrollRef = useRef<any>(null);
  useScrollToTop(scrollRef);

  // Animaciones de entrada instantánea
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;
  const pinnedFade = useRef(new Animated.Value(0)).current;
  const pinnedSlide = useRef(new Animated.Value(16)).current;
  const pinnedScale = useRef(new Animated.Value(0.96)).current;
  const pinnedBarAnim = useRef(new Animated.Value(0)).current;

  const playEntranceAnimation = (targetPinned?: PinnedRewardInfo | null, points?: number) => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);

    pinnedFade.setValue(0);
    pinnedSlide.setValue(16);
    pinnedScale.setValue(0.96);
    pinnedBarAnim.setValue(0);

    const activeReward = targetPinned !== undefined ? targetPinned : pinnedReward;
    const activePoints = points !== undefined ? points : userPoints;
    const targetPct = activeReward && activeReward.pointsCost > 0
      ? Math.min(100, Math.round((activePoints / activeReward.pointsCost) * 100))
      : 0;

    Animated.stagger(60, [
      // 1. Cabecera y botón de retroceso
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(backButtonScale, { toValue: 1, tension: 85, friction: 7, useNativeDriver: true }),
      ]),

      // 2. Tarjeta de meta fijada
      Animated.parallel([
        Animated.timing(pinnedFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(pinnedSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(pinnedScale, { toValue: 1, tension: 75, friction: 7.5, useNativeDriver: true }),
        Animated.timing(pinnedBarAnim, {
          toValue: targetPct,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  };

  useEffect(() => {
    // 1. Cargar caché inmediatamente para renderizado instantáneo
    (async () => {
      try {
        const [cachedGoals, cachedProg, cachedTarget] = await Promise.all([
          AsyncStorage.getItem(GOALS_CACHE_KEY),
          AsyncStorage.getItem(PROGRESS_CACHE_KEY),
          targetRewardService.getTargetReward(),
        ]);
        if (cachedGoals) {
          setGoals(JSON.parse(cachedGoals));
        }
        if (cachedProg) {
          setProgressMap(JSON.parse(cachedProg));
        }
        if (cachedTarget) {
          setPinnedReward(cachedTarget);
        }
      } catch (e) {}
    })();

    const resetScrollToTop = (animated: boolean = false) => {
      scrollRef.current?.scrollTo({ y: 0, animated });
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    };

    // 2. Escuchar evento de focus: ¡DISPARA LA ANIMACIÓN DE INMEDIATO Y RESETEA SCROLL!
    const unsubscribeFocus = navigation.addListener('focus', () => {
      resetScrollToTop(false);
      playEntranceAnimation();
      setRefreshKey(prev => prev + 1);
      fetchData();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      resetScrollToTop(false);
    });

    // 3. Ejecutar de inmediato al entrar
    playEntranceAnimation();
    setRefreshKey(prev => prev + 1);
    fetchData();

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  // Polling automático en tiempo real en segundo plano mientras GoalsScreen esté activa
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(async () => {
        try {
          await fetchData();
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

  const fetchData = async () => {
    try {
      const [fetchedGoals, progressList, liveUser, savedTarget, myRewards] = await Promise.all([
        goalService.getGoals(),
        goalService.getMyProgress(),
        userService.getMe().catch(() => null),
        targetRewardService.getTargetReward().catch(() => null),
        rewardService.getMyRewards().catch(() => []),
      ]);
      setGoals(fetchedGoals);
      const map: Record<string, GoalProgress> = {};
      progressList.forEach(p => { map[p.goalId] = p; });
      setProgressMap(map);
      const points = liveUser?.ecoPoints || 0;
      setUserPoints(points);

      // Si la meta fijada ya fue canjeada por el usuario, limpiarla automáticamente
      let activePinned = savedTarget;
      if (savedTarget && myRewards && myRewards.length > 0) {
        const isRedeemed = myRewards.some(
          (r: any) => String(r.reward?._id || r.reward || r.rewardId) === String(savedTarget._id)
        );
        if (isRedeemed) {
          await targetRewardService.clearTargetReward();
          activePinned = null;
        }
      }
      setPinnedReward(activePinned);

      // Guardar en caché para que las próximas entradas sean instantáneas
      AsyncStorage.setItem(GOALS_CACHE_KEY, JSON.stringify(fetchedGoals)).catch(() => {});
      AsyncStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(map)).catch(() => {});

      // Animar la barra de la meta fijada al valor actualizado
      if (activePinned && activePinned.pointsCost > 0) {
        const livePct = Math.min(100, Math.round((points / activePinned.pointsCost) * 100));
        Animated.timing(pinnedBarAnim, {
          toValue: livePct,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } catch (e) {
      console.error('[GoalsScreen] Error al refrescar:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Inicio');
    }
  };

  const handleClaim = async (goal: Goal) => {
    setClaimingId(goal._id);
    try {
      const result = await goalService.claimGoal(goal._id);
      setProgressMap(prev => ({
        ...prev,
        [goal._id]: { ...prev[goal._id], claimed: true },
      }));
      setRefreshKey(prev => prev + 1);
      Alert.alert(
        '🎉 ¡Meta completada!',
        `Ganaste +${result.pointsAwarded} puntos. Nuevo saldo: ${result.ecoPoints.toLocaleString()} pts.`
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo reclamar la recompensa');
    } finally {
      setClaimingId(null);
    }
  };

  // Ordenar metas: las activas (en progreso) van arriba, y al completarse/reclamarse van hacia abajo
  const sortedGoals = [...goals].sort((a, b) => {
    const progA = progressMap[a._id];
    const progB = progressMap[b._id];
    const userRecyclesA = progA?.progress ?? 0;
    const userRecyclesB = progB?.progress ?? 0;
    const claimedA = progA?.claimed ?? false;
    const claimedB = progB?.claimed ?? false;
    const isCompletedA = userRecyclesA >= a.targetRecycles;
    const isCompletedB = userRecyclesB >= b.targetRecycles;

    // 1. Las ya reclamadas van al fondo absoluto
    if (claimedA !== claimedB) {
      return claimedA ? 1 : -1;
    }

    // 2. Las metas completadas van hacia abajo respecto a las que están en curso
    if (isCompletedA !== isCompletedB) {
      return isCompletedA ? 1 : -1;
    }

    // 3. Dentro de metas en progreso, las más cercanas a completarse van primero
    const pctA = userRecyclesA / a.targetRecycles;
    const pctB = userRecyclesB / b.targetRecycles;
    return pctB - pctA;
  });

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
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.titleRow}>
            <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Volver atrás"
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.title}>Mis metas</Text>
          </View>
          <Text style={styles.subtitle}>Cada meta te acerca a una universidad más sostenible.</Text>
        </Animated.View>

        {/* Sección de Meta de Canje Fijada */}
        {pinnedReward ? (
          <Animated.View 
            style={[
              styles.pinnedSection,
              {
                opacity: pinnedFade,
                transform: [
                  { translateY: pinnedSlide },
                  { scale: pinnedScale }
                ]
              }
            ]}
          >
            <View style={styles.pinnedCard}>
              <View style={styles.pinnedHeader}>
                <View style={styles.pinnedBadge}>
                  <Target size={13} color="#16A34A" style={{ marginRight: 4 }} />
                  <Text style={styles.pinnedBadgeText}>Meta de Canje Fijada</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('AvailableRewards')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.changeGoalText}>Cambiar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.pinnedBody}>
                <View style={styles.pinnedIconBg}>
                  <Gift size={24} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinnedTitle}>{pinnedReward.title}</Text>
                  <Text style={styles.pinnedPoints}>{pinnedReward.pointsCost.toLocaleString()} puntos requeridos</Text>
                </View>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <Animated.View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: pinnedBarAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                          extrapolate: 'clamp',
                        }), 
                        backgroundColor: '#16A34A' 
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.progressDetailsRow}>
                <Text style={styles.progressPercentage}>
                  Avance: {pinnedReward.pointsCost > 0 ? Math.min(100, Math.round((userPoints / pinnedReward.pointsCost) * 100)) : 0}%
                </Text>
                <Text style={styles.progressValues}>
                  {userPoints >= pinnedReward.pointsCost
                    ? '¡Meta alcanzada!'
                    : `${userPoints.toLocaleString()} / ${pinnedReward.pointsCost.toLocaleString()} pts`}
                </Text>
              </View>

              {userPoints >= pinnedReward.pointsCost ? (
                <TouchableOpacity
                  style={styles.redeemGoalBtn}
                  onPress={() => navigation.navigate('UserRewards')}
                >
                  <Gift size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.redeemGoalBtnText}>¡Canjear este premio ahora!</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.pinnedMissingText}>
                  Te faltan {Math.max(0, pinnedReward.pointsCost - userPoints).toLocaleString()} puntos para canjear este premio.
                </Text>
              )}
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: pinnedFade, transform: [{ translateY: pinnedSlide }] }}>
            <TouchableOpacity
              style={styles.emptyPinnedCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AvailableRewards')}
            >
              <View style={styles.emptyPinnedIcon}>
                <Target size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.emptyPinnedTitle}>Fija tu próxima recompensa</Text>
                <Text style={styles.emptyPinnedSubtitle}>
                  Elige un artículo de la tienda para seguir tu progreso diario de puntos.
                </Text>
              </View>
              <View style={styles.emptyPinnedBtn}>
                <Text style={styles.emptyPinnedBtnText}>Elegir meta</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Text style={styles.sectionDividerTitle}>Metas de reciclaje</Text>

        {goals.length === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          sortedGoals.map((goal, index) => (
            <GoalCardItem
              key={goal._id}
              goal={goal}
              progress={progressMap[goal._id]}
              claimingId={claimingId}
              onClaim={handleClaim}
              index={index}
              refreshKey={refreshKey}
              colors={colors}
              styles={styles}
            />
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { paddingHorizontal: theme.spacing.m, paddingTop: 4, paddingBottom: 100 },
  header: { marginBottom: 14, marginTop: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  backButton: { marginRight: 10, padding: 4, marginLeft: -4 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginLeft: 2 },
  goalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...theme.shadows.soft,
  },
  goalCardClaimed: {
    opacity: 0.78,
  },
  pinnedSection: { marginBottom: 16 },
  pinnedCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.soft,
  },
  pinnedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pinnedBadgeText: { fontSize: 11, fontWeight: '900', color: '#16A34A' },
  changeGoalText: { fontSize: 13, fontWeight: '800', color: '#16A34A' },
  pinnedBody: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pinnedIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pinnedTitle: { fontSize: 17, fontWeight: '900', color: colors.text, marginBottom: 2 },
  pinnedPoints: { fontSize: 13, fontWeight: '800', color: '#16A34A' },
  redeemGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
  },
  redeemGoalBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pinnedMissingText: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },

  emptyPinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  emptyPinnedIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emptyPinnedTitle: { fontSize: 14, fontWeight: '900', color: colors.text, marginBottom: 2 },
  emptyPinnedSubtitle: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
  emptyPinnedBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  emptyPinnedBtnText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },

  sectionDividerTitle: { fontSize: 15, fontWeight: '900', color: colors.text, marginBottom: 10, marginTop: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  iconInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  goalTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 2 },
  goalPoints: { fontSize: 13, fontWeight: '800' },
  statusBadgeGreen: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeTextGreen: { fontSize: 12, fontWeight: '800', color: '#16A34A' },
  statusBadgeOrange: { backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeTextOrange: { fontSize: 12, fontWeight: '800', color: '#D97706' },
  progressContainer: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressTrack: { flex: 1 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  progressPercentage: { fontSize: 12, color: colors.textSecondary },
  progressValues: { fontSize: 12, fontWeight: '800', color: colors.text },
  rewardContainer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  rewardLabel: { fontSize: 13, color: colors.textSecondary },
  rewardValue: { fontSize: 13, fontWeight: '800', color: colors.text, flex: 1 },

  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
  },
  claimButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  claimedNote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
});
