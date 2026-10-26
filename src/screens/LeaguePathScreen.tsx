import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, RefreshControl, StatusBar, Platform } from 'react-native';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Lock,
  Trophy,
  Sparkles,
  ShieldCheck,
  Leaf,
  TrendingUp,
  Award,
  ChevronRight,
  Info,
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors, useThemeMode } from '../context/ThemeContext';
import { RANKS, getUserRank, LeagueRank } from '../utils/ranks';
import { userService } from '../api/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useScrollToTop } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const LeaguePathScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const { isDark } = useThemeMode();
  const styles = useStyles(colors, isDark);

  const scrollRef = useRef<any>(null);
  useScrollToTop(scrollRef);

  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Entrance Animations
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-15)).current;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;

  // Progress Bar Animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Subtle breathing pulse for current rank emblem
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Staggered animations for rank tier cards (5 tiers)
  const rankCardAnims = useRef(
    RANKS.map(() => ({
      fade: new Animated.Value(0),
      slide: new Animated.Value(25),
      scale: new Animated.Value(0.95),
    }))
  ).current;

  // Back button tactile spring scale
  const backButtonScale = useRef(new Animated.Value(1)).current;

  // Calculate current rank data
  const rankData = getUserRank(lifetimePoints);

  // Load cached user data initially
  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem('@user_data').then((data) => {
      if (data && isMounted) {
        try {
          const parsed = JSON.parse(data);
          const pts = parsed.lifetimePoints || parsed.ecoPoints || 0;
          setLifetimePoints(pts);
        } catch {
          // fallback
        }
      }
    });

    // Also fetch fresh from server
    fetchFreshUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchFreshUser = async () => {
    try {
      const freshUser = await userService.getMe();
      if (freshUser) {
        const pts = freshUser.lifetimePoints || freshUser.ecoPoints || 0;
        setLifetimePoints(pts);
        await AsyncStorage.setItem('@user_data', JSON.stringify(freshUser));
      }
    } catch {
      // offline or silent
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFreshUser();
    setRefreshing(false);
  }, []);

  // Polling automático en tiempo real en segundo plano mientras LeaguePathScreen esté activa
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(async () => {
        try {
          await fetchFreshUser();
        } catch (e) {
          // Polling silencioso
        }
      }, 4000);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const unsubscribeFocus = navigation?.addListener ? navigation.addListener('focus', startPolling) : null;
    const unsubscribeBlur = navigation?.addListener ? navigation.addListener('blur', stopPolling) : null;

    startPolling();

    return () => {
      stopPolling();
      if (unsubscribeFocus) unsubscribeFocus();
      if (unsubscribeBlur) unsubscribeBlur();
    };
  }, [navigation]);

  // Trigger cascade animations on mount
  useEffect(() => {
    // Header & Hero cascade
    Animated.parallel([
      Animated.timing(headerFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(headerSlide, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(heroFade, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.spring(heroScale, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(heroSlide, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Staggered entrance for each rank card
    const rankAnimations = rankCardAnims.map((anim) =>
      Animated.parallel([
        Animated.timing(anim.fade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(anim.slide, {
          toValue: 0,
          friction: 8,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.sequence([
      Animated.delay(200),
      Animated.stagger(90, rankAnimations),
    ]).start();

    // Pulse loop for the emblem
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.07,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  // Animate progress bar fill whenever lifetimePoints changes
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: rankData.progressPercentage,
      duration: 850,
      useNativeDriver: false,
    }).start();
  }, [rankData.progressPercentage]);

  const handleBackPressIn = () => {
    Animated.spring(backButtonScale, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handleBackPressOut = () => {
    Animated.spring(backButtonScale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      {/* Top Navigation Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            onPressIn={handleBackPressIn}
            onPressOut={handleBackPressOut}
            activeOpacity={0.8}
            accessibilityLabel="Volver atrás"
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Camino de Rangos</Text>
          <Text style={styles.headerSubtitle}>Tu evolución ecológica</Text>
        </View>

        <View style={styles.headerBadge}>
          <Leaf size={14} color={colors.primary} />
          <Text style={styles.headerBadgeText}>Nivel {rankData.currentRank.level}</Text>
        </View>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary, '#84CC16']}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Card: Current Rank Status */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              borderColor: rankData.currentRank.color + '50',
              opacity: heroFade,
              transform: [{ translateY: heroSlide }, { scale: heroScale }],
            },
          ]}
        >
          {/* Subtle Ambient Background Highlight */}
          <View
            style={[
              styles.heroGlowBackdrop,
              { backgroundColor: rankData.currentRank.color + (isDark ? '18' : '10') },
            ]}
          />

          <View style={styles.heroTopRow}>
            {/* Animated Emblem */}
            <Animated.View
              style={[
                styles.emblemContainer,
                {
                  borderColor: rankData.currentRank.color,
                  backgroundColor: rankData.currentRank.color + '22',
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.emblemEmoji}>{rankData.currentRank.icon}</Text>
              <View
                style={[
                  styles.emblemLevelBadge,
                  { backgroundColor: rankData.currentRank.color },
                ]}
              >
                <Text style={styles.emblemLevelText}>Nv {rankData.currentRank.level}</Text>
              </View>
            </Animated.View>

            {/* Rank Identity & Lifetime Points */}
            <View style={styles.heroIdentity}>
              <View style={styles.rankStatusPill}>
                <Sparkles size={11} color={rankData.currentRank.color} />
                <Text style={[styles.rankStatusPillText, { color: rankData.currentRank.color }]}>
                  TU RANGO ACTUAL
                </Text>
              </View>

              <Text style={styles.heroRankName}>{rankData.currentRank.name}</Text>
              <Text style={styles.heroRankSubtitle}>{rankData.currentRank.subtitle}</Text>

              <View style={styles.pointsPill}>
                <Text style={styles.pointsPillValue}>{lifetimePoints.toLocaleString()}</Text>
                <Text style={styles.pointsPillLabel}>pts históricos</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar towards Next Rank */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLabelWrap}>
                <TrendingUp size={13} color={colors.textSecondary} />
                <Text style={styles.progressTargetText}>
                  {rankData.nextRank
                    ? `Hacia ${rankData.nextRank.name} (Nivel ${rankData.nextRank.level})`
                    : '¡Rango Máximo Alcanzado!'}
                </Text>
              </View>
              <Text style={[styles.progressPercentText, { color: rankData.currentRank.color }]}>
                {rankData.isMaxRank ? '100%' : `${rankData.progressPercentage}%`}
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressBarWidth,
                    backgroundColor: rankData.currentRank.color,
                  },
                ]}
              />
            </View>

            <Text style={styles.progressFooterHint}>
              {rankData.nextRank
                ? `Faltan ${rankData.pointsNeeded.toLocaleString()} pts para subir al siguiente nivel`
                : '🏆 Eres una Leyenda Ecológica de la UNAN. ¡Felicidades!'}
            </Text>
          </View>
        </Animated.View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Escalera de Rangos</Text>
          <Text style={styles.sectionCaption}>
            Conoce cada nivel y los beneficios que desbloqueas al reciclar
          </Text>
        </View>

        {/* Vertical Roadmap / Timeline */}
        <View style={styles.timelineContainer}>
          {/* Continuous Left Connector Line */}
          <View style={styles.timelineConnectorTrack} />

          {RANKS.map((rank, index) => {
            const isUnlocked = lifetimePoints >= rank.minPoints;
            const isCurrent = rankData.currentRank.id === rank.id;
            const isCompleted = isUnlocked && !isCurrent;
            const anim = rankCardAnims[index];

            return (
              <Animated.View
                key={rank.id}
                style={[
                  styles.timelineItem,
                  {
                    opacity: anim.fade,
                    transform: [{ translateY: anim.slide }, { scale: anim.scale }],
                  },
                ]}
              >
                {/* Node Anchor on the left */}
                <View style={styles.nodeColumn}>
                  <View
                    style={[
                      styles.nodeAnchor,
                      isCurrent && {
                        backgroundColor: rank.color,
                        borderColor: colors.surface,
                        transform: [{ scale: 1.15 }],
                        shadowColor: rank.color,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.5,
                        shadowRadius: 4,
                        elevation: 5,
                      },
                      isCompleted && {
                        backgroundColor: colors.primary,
                        borderColor: colors.surface,
                      },
                      !isUnlocked && styles.nodeAnchorLocked,
                    ]}
                  >
                    {isCurrent ? (
                      <Sparkles size={13} color="#FFFFFF" />
                    ) : isCompleted ? (
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Lock size={11} color={colors.textSecondary} />
                    )}
                  </View>
                </View>

                {/* Rank Card */}
                <View
                  style={[
                    styles.rankCard,
                    isCurrent && [
                      styles.rankCardCurrent,
                      {
                        borderColor: rank.color,
                        backgroundColor: isDark
                          ? rank.color + '14'
                          : rank.color + '0B',
                      },
                    ],
                    !isUnlocked && styles.rankCardLocked,
                  ]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.cardIconWrap,
                        {
                          backgroundColor: isUnlocked
                            ? rank.color + '1A'
                            : isDark
                            ? '#27272A'
                            : '#F1F5F9',
                          borderColor: isUnlocked ? rank.color + '40' : colors.border,
                        },
                      ]}
                    >
                      <Text style={styles.cardEmoji}>{rank.icon}</Text>
                    </View>

                    <View style={styles.cardTitleColumn}>
                      <View style={styles.cardNameRow}>
                        <Text style={styles.cardRankName}>{rank.name}</Text>
                        <View
                          style={[
                            styles.levelPill,
                            { backgroundColor: isUnlocked ? rank.color + '22' : colors.border + '60' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.levelPillText,
                              { color: isUnlocked ? rank.color : colors.textSecondary },
                            ]}
                          >
                            Nivel {rank.level}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.cardSubtitle}>{rank.subtitle}</Text>
                    </View>

                    {/* Status Badge */}
                    <View>
                      {isCurrent ? (
                        <View style={[styles.badgeCurrent, { backgroundColor: rank.color }]}>
                          <Text style={styles.badgeCurrentText}>ACTUAL</Text>
                        </View>
                      ) : isCompleted ? (
                        <View style={styles.badgeCompleted}>
                          <CheckCircle2 size={13} color={colors.primary} />
                          <Text style={styles.badgeCompletedText}>Logrado</Text>
                        </View>
                      ) : (
                        <View style={styles.badgeLocked}>
                          <Lock size={11} color={colors.textSecondary} />
                          <Text style={styles.badgeLockedText}>
                            {rank.minPoints.toLocaleString()} pts
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Description */}
                  <Text style={styles.cardDescription}>{rank.description}</Text>

                  {/* Perk / Benefit Row */}
                  <View
                    style={[
                      styles.perkContainer,
                      {
                        backgroundColor: isUnlocked
                          ? rank.color + (isDark ? '18' : '0E')
                          : isDark
                          ? '#18181B'
                          : '#F8FAFC',
                        borderColor: isUnlocked ? rank.color + '30' : colors.border,
                      },
                    ]}
                  >
                    <Award
                      size={14}
                      color={isUnlocked ? rank.color : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.perkText,
                        { color: isUnlocked ? colors.text : colors.textSecondary },
                      ]}
                    >
                      {rank.perk}
                    </Text>
                  </View>

                  {/* Card Footer: Points range & progress state */}
                  <View style={styles.cardFooter}>
                    <Text style={styles.pointsRangeText}>
                      Requisito: {rank.minPoints.toLocaleString()} {rank.maxPoints !== Infinity ? `a ${rank.maxPoints.toLocaleString()} pts` : '+ pts'}
                    </Text>

                    {isCurrent && rankData.nextRank && (
                      <Text style={[styles.currentTierProgress, { color: rank.color }]}>
                        {rankData.progressPercentage}% completado
                      </Text>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>

        {/* Informative & Gamification FAQ Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIconCircle}>
              <Trophy size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>¿Cómo funcionan los Rangos?</Text>
              <Text style={styles.infoSubtitle}>
                Reglas claras de progreso en EcoUNAN
              </Text>
            </View>
          </View>

          <View style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <ShieldCheck size={18} color={colors.primary} style={styles.infoBulletIcon} />
            <Text style={styles.infoText}>
              <Text style={styles.infoHighlight}>Tus puntos nunca bajan de rango:</Text> Canjear
              tus recompensas en la tienda descuenta puntos disponibles, pero tu nivel de rango
              se calcula con tus <Text style={styles.infoHighlight}>puntos históricos totales</Text>.
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Leaf size={18} color="#84CC16" style={styles.infoBulletIcon} />
            <Text style={styles.infoText}>
              <Text style={styles.infoHighlight}>Cada gramo suma:</Text> Cada botella, lata o
              material que deposites en los puntos ecológicos te acerca al siguiente nivel.
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Sparkles size={18} color="#D97706" style={styles.infoBulletIcon} />
            <Text style={styles.infoText}>
              <Text style={styles.infoHighlight}>Beneficios exclusivos:</Text> Al subir de rango
              desbloqueas insignias honoríficas y prioridad en premios del campus.
            </Text>
          </View>
        </View>

        {/* Bottom space */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      zIndex: 10,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#27272A' : '#F1F5F9',
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
      fontWeight: '500',
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: colors.primary + '18',
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    headerBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.m,
      paddingTop: 16,
      paddingBottom: 30,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1.5,
      marginBottom: 24,
      overflow: 'hidden',
      position: 'relative',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    heroGlowBackdrop: {
      position: 'absolute',
      top: -30,
      right: -30,
      width: 180,
      height: 180,
      borderRadius: 90,
      opacity: 0.8,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    emblemContainer: {
      width: 76,
      height: 76,
      borderRadius: 38,
      borderWidth: 3,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      marginRight: 16,
    },
    emblemEmoji: {
      fontSize: 36,
    },
    emblemLevelBadge: {
      position: 'absolute',
      bottom: -6,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    emblemLevelText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    heroIdentity: {
      flex: 1,
    },
    rankStatusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    rankStatusPillText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    heroRankName: {
      fontSize: 24,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: -0.5,
    },
    heroRankSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 6,
    },
    pointsPill: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    pointsPillValue: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.primary,
    },
    pointsPillLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    progressSection: {
      marginTop: 2,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border + '60',
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    progressLabelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    progressTargetText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    progressPercentText: {
      fontSize: 13,
      fontWeight: '800',
    },
    progressBarTrack: {
      height: 10,
      backgroundColor: isDark ? '#27272A' : '#E2E8F0',
      borderRadius: 5,
      overflow: 'hidden',
      marginBottom: 6,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 5,
    },
    progressFooterHint: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    sectionHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
    },
    sectionCaption: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 3,
    },
    timelineContainer: {
      position: 'relative',
      marginBottom: 20,
    },
    timelineConnectorTrack: {
      position: 'absolute',
      left: 17,
      top: 30,
      bottom: 40,
      width: 2,
      backgroundColor: colors.border,
      zIndex: 1,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      zIndex: 2,
    },
    nodeColumn: {
      width: 36,
      alignItems: 'center',
      paddingTop: 18,
      marginRight: 10,
      zIndex: 3,
    },
    nodeAnchor: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    nodeAnchorLocked: {
      backgroundColor: isDark ? '#27272A' : '#E2E8F0',
      borderColor: colors.border,
    },
    rankCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    rankCardCurrent: {
      borderWidth: 2,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    rankCardLocked: {
      opacity: 0.88,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    cardIconWrap: {
      width: 46,
      height: 46,
      borderRadius: 23,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardEmoji: {
      fontSize: 24,
    },
    cardTitleColumn: {
      flex: 1,
    },
    cardNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    cardRankName: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    levelPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    levelPillText: {
      fontSize: 10,
      fontWeight: '700',
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 1,
    },
    badgeCurrent: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeCurrentText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    badgeCompleted: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: colors.primary + '16',
    },
    badgeCompletedText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
    },
    badgeLocked: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: isDark ? '#27272A' : '#F1F5F9',
    },
    badgeLockedText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    cardDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.text,
      marginBottom: 10,
    },
    perkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 10,
    },
    perkText: {
      fontSize: 12,
      fontWeight: '600',
      flex: 1,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border + '50',
    },
    pointsRangeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    currentTierProgress: {
      fontSize: 11,
      fontWeight: '800',
    },
    infoCard: {
      backgroundColor: isDark ? '#1C1917' : '#FFFBEB',
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: isDark ? '#78350F' : '#FDE68A',
      marginTop: 8,
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#78350F33' : '#FEF3C7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: isDark ? '#FDE68A' : '#92400E',
    },
    infoSubtitle: {
      fontSize: 12,
      color: isDark ? '#D97706' : '#B45309',
      marginTop: 1,
    },
    infoDivider: {
      height: 1,
      backgroundColor: isDark ? '#78350F55' : '#FDE68A',
      marginVertical: 14,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 10,
    },
    infoBulletIcon: {
      marginTop: 2,
    },
    infoText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 18,
      color: isDark ? '#F5F5F4' : '#78350F',
    },
    infoHighlight: {
      fontWeight: '700',
      color: isDark ? '#FBBF24' : '#92400E',
    },
  });
