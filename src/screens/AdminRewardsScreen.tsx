import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Animated, RefreshControl } from 'react-native';
import { 
  ArrowLeft, 
  Edit, 
  EyeOff, 
  Power, 
  Trash2, 
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
  Package, 
  Plus 
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { Reward } from '../types';

// Caché en memoria para entrada instantánea
let cachedRewards: Reward[] | null = null;

// Renderizador dinámico de íconos de recompensas
const renderRewardIcon = (name?: string, color: string = '#D97706', size: number = 22) => {
  switch (name) {
    case 'Coffee': return <Coffee size={size} color={color} />;
    case 'Shirt': return <Shirt size={size} color={color} />;
    case 'BookOpen': return <BookOpen size={size} color={color} />;
    case 'Utensils': return <Utensils size={size} color={color} />;
    case 'ShoppingBag': return <ShoppingBag size={size} color={color} />;
    case 'Award': return <Award size={size} color={color} />;
    case 'Trophy': return <Trophy size={size} color={color} />;
    case 'Medal': return <Medal size={size} color={color} />;
    case 'Ticket': return <Ticket size={size} color={color} />;
    case 'Sparkles': return <Sparkles size={size} color={color} />;
    case 'Droplet': return <Droplet size={size} color={color} />;
    case 'Star': return <Star size={size} color={color} />;
    case 'Zap': return <Zap size={size} color={color} />;
    case 'Smartphone': return <Smartphone size={size} color={color} />;
    case 'Package': return <Package size={size} color={color} />;
    case 'Gift':
    default:
      return <Gift size={size} color={color} />;
  }
};

export const AdminRewardsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [rewards, setRewards] = useState<Reward[]>(cachedRewards || []);
  const [loading, setLoading] = useState(!cachedRewards);
  const [refreshing, setRefreshing] = useState(false);

  // Animaciones de entrada idénticas a RecycleScreen
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;
  const addButtonScale = useRef(new Animated.Value(0.7)).current;

  // Pools dinámicos de Animated.Value para las tarjetas de recompensas
  const fadeAnims = useRef<Animated.Value[]>([]).current;
  const slideAnims = useRef<Animated.Value[]>([]).current;
  const cardScales = useRef<Animated.Value[]>([]).current;
  const iconScales = useRef<Animated.Value[]>([]).current;

  const ensureAnimCapacity = (count: number) => {
    while (fadeAnims.length < count) {
      fadeAnims.push(new Animated.Value(1));
      slideAnims.push(new Animated.Value(0));
      cardScales.push(new Animated.Value(1));
      iconScales.push(new Animated.Value(1));
    }
  };

  const playEntranceAnimation = (rewardsCount?: number) => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);
    addButtonScale.setValue(0.7);

    const count = typeof rewardsCount === 'number' ? rewardsCount : (cachedRewards?.length ?? rewards.length);
    ensureAnimCapacity(count);

    for (let i = 0; i < count; i++) {
      fadeAnims[i].setValue(0);
      slideAnims[i].setValue(18);
      cardScales[i].setValue(0.96);
      iconScales[i].setValue(0.3);
    }

    const animations: Animated.CompositeAnimation[] = [
      // Cabecera y botón atrás / botón agregar
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(backButtonScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
        Animated.spring(addButtonScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      ]),
    ];

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        animations.push(
          Animated.parallel([
            Animated.timing(fadeAnims[i], { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.spring(slideAnims[i], { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
            Animated.spring(cardScales[i], { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(40),
              Animated.spring(iconScales[i], { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
            ]),
          ])
        );
      }
    }

    Animated.stagger(65, animations).start();
  };

  const playCardsAnimation = (count: number) => {
    ensureAnimCapacity(count);
    for (let i = 0; i < count; i++) {
      fadeAnims[i].setValue(0);
      slideAnims[i].setValue(18);
      cardScales[i].setValue(0.96);
      iconScales[i].setValue(0.3);
    }

    if (count === 0) return;

    Animated.stagger(
      65,
      Array.from({ length: count }, (_, i) =>
        Animated.parallel([
          Animated.timing(fadeAnims[i], { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.spring(slideAnims[i], { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
          Animated.spring(cardScales[i], { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(40),
            Animated.spring(iconScales[i], { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
          ]),
        ])
      )
    ).start();
  };

  useEffect(() => {
    playEntranceAnimation();
    fetchRewards(cachedRewards ? true : false);

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

    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchRewards(true);
      startPolling();
    });

    const unsubscribeBlur = navigation.addListener('blur', stopPolling);

    startPolling();

    return () => {
      stopPolling();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const fetchRewards = async (silent: boolean = false) => {
    if (!silent && !cachedRewards) {
      setLoading(true);
    }
    try {
      const data = await rewardService.getRewards();
      cachedRewards = data;
      setRewards(data);
      if (!silent) {
        playCardsAnimation(data.length);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las recompensas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRewards(false);
  };

  const toggleRewardStatus = async (id: string, currentStatus: boolean) => {
    try {
      await rewardService.updateReward(id, { isActive: !currentStatus });
      setRewards(prev => {
        const next = prev.map(reward => 
          reward._id === id ? { ...reward, isActive: !currentStatus } : reward
        );
        cachedRewards = next;
        return next;
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la recompensa.');
    }
  };

  const deleteReward = (id: string) => {
    Alert.alert('Confirmar eliminación', '¿Estás seguro de que deseas eliminar esta recompensa del catálogo?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Eliminar', 
        style: 'destructive',
        onPress: async () => {
          try {
            await rewardService.deleteReward(id);
            setRewards(prev => {
              const next = prev.filter(r => r._id !== id);
              cachedRewards = next;
              return next;
            });
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo eliminar la recompensa.');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
        <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Volver atrás"
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.title}>Recompensas</Text>
        <Animated.View style={{ transform: [{ scale: addButtonScale }] }}>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => navigation.navigate('AdminEditReward')}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={3} style={{ marginRight: 4 }} />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={styles.sectionTitle}>Recompensas registradas</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : rewards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Gift size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No hay recompensas registradas aún.</Text>
            <TouchableOpacity 
              style={styles.emptyAddBtn} 
              onPress={() => navigation.navigate('AdminEditReward')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyAddBtnText}>+ Crear primera recompensa</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rewards.map((item, index) => {
            ensureAnimCapacity(index + 1);

            return (
              <Animated.View 
                key={item._id} 
                style={[
                  styles.cardWrapper,
                  {
                    opacity: fadeAnims[index],
                    transform: [
                      { translateY: slideAnims[index] },
                      { scale: cardScales[index] }
                    ]
                  }
                ]}
              >
                <View style={styles.rewardCard}>
                  <View style={styles.cardHeader}>
                    <Animated.View 
                      style={[
                        styles.iconBox, 
                        { 
                          backgroundColor: item.iconBg || '#FEF3C7',
                          transform: [{ scale: iconScales[index] }] 
                        }
                      ]}
                    >
                      {renderRewardIcon(item.iconName, item.iconColor || '#D97706', 22)}
                    </Animated.View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.rewardName} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.rewardDetails}>
                        {item.pointsCost.toLocaleString()} pts • {item.stock === -1 ? 'Stock ilimitado' : `${item.stock} disponibles`}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#DCFCE7' : '#F1F5F9' }]}>
                      <Text style={[styles.statusText, { color: item.isActive ? '#16A34A' : '#64748B' }]}>
                        {item.isActive ? 'Activa' : 'Inactiva'}
                      </Text>
                    </View>
                  </View>

                  {!!item.description && (
                    <Text style={styles.rewardDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}

                  <View style={styles.divider} />

                  <View style={styles.actionsRow}>
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => navigation.navigate('AdminEditReward', { rewardId: item._id })}
                      activeOpacity={0.7}
                    >
                      <Edit size={15} color={colors.text} style={styles.actionIcon} />
                      <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>

                    <View style={styles.actionSpacing} />

                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => toggleRewardStatus(item._id, item.isActive)}
                      activeOpacity={0.7}
                    >
                      {item.isActive ? (
                        <EyeOff size={15} color={colors.text} style={styles.actionIcon} />
                      ) : (
                        <Power size={15} color="#16A34A" style={styles.actionIcon} />
                      )}
                      <Text style={[styles.actionText, !item.isActive && { color: '#16A34A' }]}>
                        {item.isActive ? 'Ocultar' : 'Activar'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionSpacing} />

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]} 
                      onPress={() => deleteReward(item._id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={15} color="#EF4444" style={styles.actionIcon} />
                      <Text style={[styles.actionText, { color: '#EF4444' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: theme.spacing.m, 
    paddingTop: theme.spacing.xl, 
    paddingBottom: theme.spacing.m 
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: colors.border, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12 
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, flex: 1 },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.primary, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    ...theme.shadows.soft,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: theme.spacing.m },

  cardWrapper: { marginBottom: theme.spacing.m },
  rewardCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: theme.spacing.m,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: { flex: 1 },
  rewardName: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 2 },
  rewardDetails: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  rewardDescription: { fontSize: 12, color: colors.textSecondary, lineHeight: 16, marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  actionsRow: { flexDirection: 'row' },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 9,
    backgroundColor: colors.surface,
  },
  deleteButton: { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  actionSpacing: { width: 8 },
  actionIcon: { marginRight: 6 },
  actionText: { fontSize: 12, fontWeight: '800', color: colors.text },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { textAlign: 'center', marginTop: 16, color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  emptyAddBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyAddBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
