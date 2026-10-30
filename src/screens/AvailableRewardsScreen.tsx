import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl
} from 'react-native';
import { ArrowLeft, Gift, CheckCircle, Target } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors, useThemeMode } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { targetRewardService } from '../api/services/targetReward.service';
import { Reward } from '../types';

export const AvailableRewardsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const { isDark } = useThemeMode();
  const styles = useStyles(colors, isDark);

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pinnedRewardId, setPinnedRewardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;
  const listFade = useRef(new Animated.Value(0)).current;
  const listSlide = useRef(new Animated.Value(20)).current;

  const playEntranceAnimation = () => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);
    listFade.setValue(0);
    listSlide.setValue(20);

    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      Animated.spring(backButtonScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(60),
        Animated.parallel([
          Animated.timing(listFade, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.spring(listSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
  };

  useEffect(() => {
    fetchRewards(false);

    let pollingInterval: NodeJS.Timeout | null = null;
    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(() => {
        fetchRewards(true);
      }, 3500);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const unsubscribeFocus = navigation?.addListener ? navigation.addListener('focus', () => {
      fetchRewards(true);
      startPolling();
    }) : null;

    const unsubscribeBlur = navigation?.addListener ? navigation.addListener('blur', stopPolling) : null;

    startPolling();

    return () => {
      stopPolling();
      if (unsubscribeFocus) unsubscribeFocus();
      if (unsubscribeBlur) unsubscribeBlur();
    };
  }, [navigation]);

  const fetchRewards = async (silent: boolean = false) => {
    try {
      const [data, savedTargetId] = await Promise.all([
        rewardService.getRewards(),
        targetRewardService.getTargetRewardId(),
      ]);
      setRewards(data);
      setPinnedRewardId(savedTargetId);
    } catch (error) {
      if (!silent) console.error(error);
    } finally {
      if (!silent) {
        setLoading(false);
        setTimeout(() => {
          playEntranceAnimation();
        }, 50);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchRewards();
    } catch (e) {
      console.error('[AvailableRewardsScreen] Error al refrescar:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleTargetGoal = async (reward: Reward) => {
    try {
      if (pinnedRewardId === reward._id) {
        Alert.alert(
          'Meta fijada',
          `"${reward.title}" ya es tu meta actual. ¿Deseas desmarcarla?`,
          [
            { text: 'Mantener', style: 'cancel' },
            {
              text: 'Desmarcar',
              style: 'destructive',
              onPress: async () => {
                await targetRewardService.clearTargetReward();
                setPinnedRewardId(null);
              }
            }
          ]
        );
      } else {
        await targetRewardService.setTargetReward(reward);
        setPinnedRewardId(reward._id);
        Alert.alert(
          '🎯 ¡Meta fijada con éxito!',
          `Has fijado "${reward.title}" (${reward.pointsCost.toLocaleString()} pts) como tu meta principal de canje.\n\nPodrás ver tu progreso en la rueda de "Mis puntos" y en la pantalla de "Metas".`,
          [
            { text: 'Seguir explorando', style: 'cancel' },
            { text: 'Ver mi progreso', onPress: () => navigation.goBack() }
          ]
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar la meta seleccionada');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
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
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Volver atrás"
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.title}>Catálogo de metas</Text>
          </View>
          <Text style={styles.subtitle}>Elige el artículo que deseas canjear para seguir tu progreso de puntos.</Text>
        </Animated.View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : rewards.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>
            No hay recompensas disponibles en este momento.
          </Text>
        ) : (
          <Animated.View style={{ opacity: listFade, transform: [{ translateY: listSlide }] }}>
            {rewards.map((reward) => {
              const isPinned = pinnedRewardId === reward._id;

              return (
                <View
                  key={reward._id}
                  style={[
                    styles.rewardCard,
                    isPinned && styles.rewardCardPinned
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBg, isPinned && styles.iconBgPinned]}>
                      <Gift size={22} color={isPinned ? '#16A34A' : colors.primary} />
                    </View>
                    <View style={styles.cardTitleContainer}>
                      <View style={styles.titleBadgeRow}>
                        <Text style={styles.rewardTitle}>{reward.title}</Text>
                        {isPinned && (
                          <View style={styles.pinnedBadge}>
                            <Target size={12} color="#16A34A" style={{ marginRight: 3 }} />
                            <Text style={styles.pinnedBadgeText}>Meta actual</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.rewardPoints}>{reward.pointsCost.toLocaleString()} puntos requeridos</Text>
                    </View>
                  </View>

                  <Text style={styles.rewardDescription}>{reward.description}</Text>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      isPinned && styles.actionButtonPinned
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleToggleTargetGoal(reward)}
                  >
                    <CheckCircle size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionButtonText}>
                      {isPinned ? 'Meta fijada ✓' : 'Fijar como mi meta'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors, isDark: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: theme.spacing.m, paddingTop: 4, paddingBottom: 100 },
  header: { marginBottom: 16, marginTop: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  backButton: { marginRight: 10, padding: 4, marginLeft: -4 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginLeft: 2, lineHeight: 18 },

  rewardCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    ...theme.shadows.soft,
  },
  rewardCardPinned: {
    borderColor: '#16A34A',
    backgroundColor: isDark ? '#16A34A15' : '#F0FDF4',
    borderWidth: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  iconBgPinned: {
    backgroundColor: isDark ? '#16A34A25' : '#DCFCE7',
    borderColor: '#16A34A',
  },
  cardTitleContainer: { flex: 1 },
  titleBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  rewardTitle: { fontSize: 16, fontWeight: '900', color: colors.text, flex: 1 },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#16A34A25' : '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginLeft: 6,
  },
  pinnedBadgeText: { fontSize: 11, fontWeight: '800', color: isDark ? '#22C55E' : '#16A34A' },
  rewardPoints: { fontSize: 14, fontWeight: '800', color: '#16A34A' },
  rewardDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionButtonPinned: {
    backgroundColor: '#16A34A',
  },
  actionButtonText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});
