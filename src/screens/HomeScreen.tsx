import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Alert, Easing, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';
import { Leaf, Gift, Trophy, Activity, ArrowRight, ScanLine, Medal, Bell, QrCode } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useUnreadCount, refreshUnreadCount } from '../hooks/useUnreadCount';
import { getUserRank } from '../utils/ranks';
import { Button } from '../components/Button';
import { userService } from '../api/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Reward } from '../types';
import { RecycleService } from '../api/services/recycle.service';
import { rewardService } from '../api/services/reward.service';
import { targetRewardService } from '../api/services/targetReward.service';
import { API_BASE_URL, assetUrl } from '../api/apiClient';

export const HomeScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const scrollRef = useRef<any>(null);
  useScrollToTop(scrollRef);
  const unreadCount = useUnreadCount();

  // Valores animados para la entrada sutil de componentes
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const avatarScale = useRef(new Animated.Value(0.7)).current;

  const pointsFade = useRef(new Animated.Value(0)).current;
  const pointsSlide = useRef(new Animated.Value(18)).current;
  const pointsScale = useRef(new Animated.Value(0.97)).current;
  const badgeScale = useRef(new Animated.Value(0.4)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(18)).current;
  const stat1Scale = useRef(new Animated.Value(0.3)).current;
  const stat2Scale = useRef(new Animated.Value(0.3)).current;
  const stat3Scale = useRef(new Animated.Value(0.3)).current;

  const actionsFade = useRef(new Animated.Value(0)).current;
  const actionsSlide = useRef(new Animated.Value(18)).current;

  const rewardFade = useRef(new Animated.Value(0)).current;
  const rewardSlide = useRef(new Animated.Value(18)).current;
  const rewardIconScale = useRef(new Animated.Value(0.4)).current;

  const [user, setUser] = useState<User | null>(null);
  const [recycleCount, setRecycleCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);
  const [nextReward, setNextReward] = useState<Reward | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentPoints = user?.ecoPoints || 0;
  const lifetimePoints = user?.lifetimePoints || currentPoints;
  const rankData = getUserRank(lifetimePoints);

  const targetPoints = rankData.nextRank ? rankData.nextRank.minPoints : rankData.currentRank.minPoints;
  const progressPercent = Math.min(100, Math.max(0, Math.round(rankData.progressPercentage || 0)));

  /**
   * Animación sutil y fluida que hace aparecer los elementos propios de la pantalla
   * con una cascada elegante y micro-rebote en los íconos para atraer la mirada.
   */
  const playEntranceAnimation = () => {
    // 1. Reiniciar valores a su posición inicial
    headerFade.setValue(0);
    headerSlide.setValue(14);
    avatarScale.setValue(0.7);

    pointsFade.setValue(0);
    pointsSlide.setValue(18);
    pointsScale.setValue(0.97);
    badgeScale.setValue(0.4);
    progressAnim.setValue(0);

    statsFade.setValue(0);
    statsSlide.setValue(18);
    stat1Scale.setValue(0.3);
    stat2Scale.setValue(0.3);
    stat3Scale.setValue(0.3);

    actionsFade.setValue(0);
    actionsSlide.setValue(18);

    rewardFade.setValue(0);
    rewardSlide.setValue(18);
    rewardIconScale.setValue(0.4);

    // 2. Orquestar la cascada en cadena
    Animated.stagger(75, [
      // Cabecera y Avatar
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(avatarScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      ]),

      // Tarjeta de Puntos y Badge de Rango
      Animated.parallel([
        Animated.timing(pointsFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(pointsSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(pointsScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(60),
          Animated.spring(badgeScale, { toValue: 1, tension: 90, friction: 6, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(progressAnim, {
            toValue: progressPercent,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
      ]),

      // Fila de Estadísticas y brote sutil de sus 3 íconos
      Animated.parallel([
        Animated.timing(statsFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(statsSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.stagger(50, [
          Animated.spring(stat1Scale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
          Animated.spring(stat2Scale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
          Animated.spring(stat3Scale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
        ]),
      ]),

      // Botones de acción principales
      Animated.parallel([
        Animated.timing(actionsFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(actionsSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      ]),

      // Tarjeta de Próxima Recompensa con su ícono
      Animated.parallel([
        Animated.timing(rewardFade, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(rewardSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(70),
          Animated.spring(rewardIconScale, { toValue: 1, tension: 90, friction: 6, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  };

  const resetScrollToTop = (animated: boolean = false) => {
    scrollRef.current?.scrollTo({ y: 0, animated });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  useEffect(() => {
    // Escuchar el evento 'focus' para volver al inicio y reanimar siempre que se acceda o regrese a HomeScreen
    const unsubscribeFocus = navigation.addListener('focus', () => {
      resetScrollToTop(false);
      refreshUnreadCount();
      loadData();
      playEntranceAnimation();
    });

    const unsubscribeBlur = navigation.addListener('blur', () => {
      resetScrollToTop(false);
    });

    // Ejecutar al montar
    playEntranceAnimation();

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation, progressPercent]);

  // Polling automático en tiempo real en segundo plano mientras HomeScreen esté activa
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(async () => {
        try {
          await loadData();
          refreshUnreadCount();
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

  // Animar suavemente el llenado de la barra cuando los puntos o la meta se actualicen
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 750,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressPercent]);

  const loadData = async () => {
    try {
      try {
        const liveUser = await userService.getMe();
        setUser(liveUser);
        await AsyncStorage.setItem('@user_data', JSON.stringify(liveUser));
      } catch (e) {
        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) setUser(JSON.parse(userData));
      }

      const history = await RecycleService.getHistory();
      setRecycleCount(history.length);
      const rawWeight = history.reduce((sum, item) => sum + (item.totalWeight || (item as any).weight || 0), 0);
      setTotalWeight(Math.round(rawWeight * 10) / 10);

      try {
        const [rewards, myRewards, savedTarget] = await Promise.all([
          rewardService.getRewards(),
          rewardService.getMyRewards().catch(() => []),
          targetRewardService.getTargetReward().catch(() => null),
        ]);

        if (rewards.length > 0) {
          const redeemedIds = new Set(
            myRewards.map((r: any) => String(r.reward?._id || r.reward || r.rewardId))
          );

          // Si la meta fijada ya fue canjeada, limpiarla automáticamente
          if (savedTarget && redeemedIds.has(String(savedTarget._id))) {
            await targetRewardService.clearTargetReward();
          }

          // 1. Si el usuario fijó una meta y aún no la canjea, mostrarla
          const activePinned = savedTarget && !redeemedIds.has(String(savedTarget._id))
            ? rewards.find((r) => r._id === savedTarget._id) || savedTarget
            : null;

          if (activePinned) {
            setNextReward(activePinned as Reward);
          } else {
            // 2. Si no tiene meta fijada, buscar la próxima recompensa que aún NO ha canjeado
            const unredeemed = rewards.filter((r) => !redeemedIds.has(String(r._id)));
            const sortedUnredeemed = [...unredeemed].sort((a, b) => a.pointsCost - b.pointsCost);

            if (sortedUnredeemed.length > 0) {
              const livePoints = user?.ecoPoints || 0;
              const upcoming = sortedUnredeemed.find((r) => r.pointsCost > livePoints);
              setNextReward(upcoming || sortedUnredeemed[0]);
            } else {
              // Si ya canjeó todas las recompensas del catálogo, mostrar la de mayor valor
              const sortedAll = [...rewards].sort((a, b) => b.pointsCost - a.pointsCost);
              setNextReward(sortedAll[0] || null);
            }
          }
        }
      } catch (e) {}
    } catch (error) {
      console.error(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadData(), refreshUnreadCount()]);
      playEntranceAnimation();
    } catch (e) {
      console.error('[HomeScreen] Error al refrescar:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return '??';
    return nameStr.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getFirstName = (nameStr: string) => {
    if (!nameStr) return '';
    return nameStr.split(' ')[0];
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        ref={scrollRef}
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary, colors.accent]}
            tintColor={colors.primary}
          />
        }
      >
        
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.greeting} numberOfLines={1}>Hola, {getFirstName(user?.name || 'Estudiante')}</Text>
            <Text style={styles.subtitle}>Hoy puedes hacer la diferencia.</Text>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={styles.qrButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('QRScanner', { awaitingApproval: true })}
              accessibilityRole="button"
              accessibilityLabel="Escanear QR de reciclaje"
            >
              <QrCode size={20} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notificaciones"
            >
              <Bell size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
              <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={() => navigation.navigate('Perfil')}>
                {user?.profilePicture ? (
                  <Image source={{ uri: assetUrl(user.profilePicture) ?? undefined }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Points Card */}
        <Animated.View style={[{ opacity: pointsFade, transform: [{ translateY: pointsSlide }, { scale: pointsScale }] }]}>
          <TouchableOpacity style={styles.pointsCard} activeOpacity={0.9} onPress={() => navigation.navigate('Puntos')}>
            <View style={styles.pointsHeader}>
              <Text style={styles.pointsTitle}>MIS PUNTOS</Text>
              <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
                <TouchableOpacity 
                  style={[styles.premiumBadge, { backgroundColor: rankData.currentRank.color + '20' }]} 
                  onPress={() => navigation.navigate('LeaguePath')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.premiumText, { color: rankData.currentRank.color }]}>
                    {rankData.currentRank.icon} {rankData.currentRank.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
            <Text style={styles.pointsValue}>{currentPoints}</Text>
            <Text style={styles.pointsSubtitle}>puntos</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>{progressPercent}% completado</Text>
                <Text style={styles.progressLabel}>Meta: {targetPoints} puntos</Text>
              </View>
            </View>

            <Text style={styles.pointsHint}>
              Sigue reciclando para alcanzar tu próxima recompensa.
            </Text>
          </TouchableOpacity>

          {/* Stats Row */}
          <Animated.View style={[styles.statsRow, { opacity: statsFade, transform: [{ translateY: statsSlide }] }]}>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
              <Animated.View style={[styles.statIcon, { backgroundColor: '#F0FDF4', transform: [{ scale: stat1Scale }] }]}>
                <Activity size={20} color={theme.colors.accent} />
              </Animated.View>
              <Text style={styles.statValue}>{recycleCount}</Text>
              <Text style={styles.statLabel}>Reciclajes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
              <Animated.View style={[styles.statIcon, { backgroundColor: '#EFF6FF', transform: [{ scale: stat2Scale }] }]}>
                <Leaf size={20} color="#3B82F6" />
              </Animated.View>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{Number(totalWeight.toFixed(1))} kg</Text>
              <Text style={styles.statLabel}>Material</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
              <Animated.View style={[styles.statIcon, { backgroundColor: '#FFFBEB', transform: [{ scale: stat3Scale }] }]}>
                <Trophy size={20} color="#F59E0B" />
              </Animated.View>
              <Text style={styles.statValue}>{rankData.currentRank.icon}</Text>
              <Text style={[styles.statLabel, { color: rankData.currentRank.color, fontWeight: 'bold' }]}>
                {rankData.currentRank.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Action Buttons & Next Reward */}
        <Animated.View style={[{ opacity: actionsFade, transform: [{ translateY: actionsSlide }] }]}>
          <Button 
            title="Registrar reciclaje" 
            icon={<ScanLine size={20} color={theme.colors.white} />}
            onPress={() => navigation.navigate('Reciclar')} 
            style={styles.actionButton}
          />
          
          <Button 
            title="Ver Ranking EcoUNAN" 
            icon={<Medal size={20} color={colors.primary} />}
            onPress={() => navigation.navigate('Ranking')} 
            style={[styles.actionButton, { backgroundColor: colors.surface }]}
            textStyle={{ color: colors.text }}
          />

          {nextReward && (
            <Animated.View style={[{ opacity: rewardFade, transform: [{ translateY: rewardSlide }] }]}>
              <TouchableOpacity
                style={styles.rewardCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ConfirmReward', { reward: nextReward })}
              >
                <View style={styles.rewardLeft}>
                  <Animated.View style={[styles.rewardIconBg, { transform: [{ scale: rewardIconScale }] }]}>
                    <Gift size={24} color={nextReward.iconColor || '#F59E0B'} />
                  </Animated.View>
                  <View>
                    <Text style={styles.rewardTitle}>{nextReward.title}</Text>
                    <Text style={styles.rewardSubtitle}>
                      {currentPoints >= nextReward.pointsCost
                        ? '¡Ya puedes canjearlo!'
                        : `Te faltan ${nextReward.pointsCost - currentPoints} puntos`}
                    </Text>
                  </View>
                </View>
                <View style={styles.rewardRight}>
                  <Text style={styles.rewardLink}>Ver</Text>
                  <ArrowRight size={16} color={theme.colors.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { padding: theme.spacing.m, paddingBottom: 100 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.l,
      marginTop: theme.spacing.s,
    },
    greeting: { ...theme.typography.h2, color: colors.text },
    subtitle: { ...theme.typography.bodySecondary, color: colors.textSecondary, marginTop: 2 },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    qrButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...theme.shadows.soft,
    },
    bellButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      ...theme.shadows.soft,
    },
    bellBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#EF4444',
      borderWidth: 2,
      borderColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    bellBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarText: { fontWeight: 'bold', fontSize: 16, color: colors.text },
    avatarImage: { width: 48, height: 48, borderRadius: 24, resizeMode: 'cover' },

    pointsCard: {
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: theme.spacing.m,
      ...theme.shadows.soft,
    },
    pointsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    pointsTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    premiumText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#D97706',
    },
    premiumBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    pointsValue: {
      fontSize: 48,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginTop: theme.spacing.m,
    },
    pointsSubtitle: { textAlign: 'center', color: colors.textSecondary, marginBottom: theme.spacing.l },

    progressContainer: { marginBottom: theme.spacing.m },
    progressBarBg: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 4 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    progressLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
    pointsHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.s },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.l },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
      alignItems: 'center',
      marginHorizontal: 4,
      ...theme.shadows.soft,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    statLabel: { fontSize: 12, color: colors.textSecondary },

    actionButton: { marginBottom: theme.spacing.l, ...theme.shadows.soft },

    rewardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.l,
      ...theme.shadows.soft,
    },
    rewardLeft: { flexDirection: 'row', alignItems: 'center' },
    rewardIconBg: {
      width: 48,
      height: 48,
      borderRadius: 8,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
    },
    rewardTitle: { fontWeight: 'bold', fontSize: 16, color: colors.text },
    rewardSubtitle: { fontSize: 14, color: colors.textSecondary },
    rewardRight: { flexDirection: 'row', alignItems: 'center' },
    rewardLink: { fontWeight: 'bold', fontSize: 14, color: colors.text, marginRight: 4 },
  });
