import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Animated } from 'react-native';
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
import { AuthService } from '../api/services/auth.service';
import { userService } from '../api/services/user.service';
import { targetRewardService } from '../api/services/targetReward.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Reward } from '../types';

export const ConfirmRewardScreen = ({ route, navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const scrollRef = useRef<any>(null);

  const { reward } = route.params as { reward: Reward };
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Animaciones de entrada
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(18)).current;

  const refreshLiveUser = async () => {
    try {
      const live = await userService.getMe();
      if (live) {
        setCurrentUser(live);
        AsyncStorage.setItem('@user_data', JSON.stringify(live)).catch(() => {});
        return live;
      }
    } catch (e) {
      const local = await AuthService.getCurrentUser();
      if (local) setCurrentUser(local);
      return local;
    }
    return null;
  };

  useEffect(() => {
    refreshLiveUser();

    // Polling en tiempo real: si un admin aprueba un reciclaje mientras está en esta ventana, se actualiza al instante
    const interval = setInterval(() => {
      refreshLiveUser();
    }, 2500);

    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);
    contentFade.setValue(0);
    contentSlide.setValue(18);

    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(headerSlide, { toValue: 0, tension: 75, friction: 8, useNativeDriver: true }),
      Animated.spring(backButtonScale, { toValue: 1, tension: 85, friction: 7, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(60),
        Animated.parallel([
          Animated.timing(contentFade, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.spring(contentSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    return () => {
      clearInterval(interval);
    };
  }, []);

  const currentPoints = currentUser?.ecoPoints || 0;
  const remainingPoints = currentPoints - reward.pointsCost;

  const getIcon = () => {
    const iconColor = reward.iconColor || '#D97706';
    switch (reward.iconName) {
      case 'Coffee': return <Coffee size={26} color={iconColor} />;
      case 'Shirt': return <Shirt size={26} color={iconColor} />;
      case 'BookOpen': return <BookOpen size={26} color={iconColor} />;
      case 'Utensils': return <Utensils size={26} color={iconColor} />;
      case 'ShoppingBag': return <ShoppingBag size={26} color={iconColor} />;
      case 'Award': return <Award size={26} color={iconColor} />;
      case 'Trophy': return <Trophy size={26} color={iconColor} />;
      case 'Medal': return <Medal size={26} color={iconColor} />;
      case 'Ticket': return <Ticket size={26} color={iconColor} />;
      case 'Sparkles': return <Sparkles size={26} color={iconColor} />;
      case 'Droplet': return <Droplet size={26} color={iconColor} />;
      case 'Star': return <Star size={26} color={iconColor} />;
      case 'Zap': return <Zap size={26} color={iconColor} />;
      case 'Smartphone': return <Smartphone size={26} color={iconColor} />;
      case 'Package': return <Package size={26} color={iconColor} />;
      case 'Gift':
      default:
        return <Gift size={26} color={iconColor} />;
    }
  };

  const handleRedeem = async () => {
    setLoading(true);
    try {
      // 1. Verificar puntos en tiempo real directamente con el servidor antes de proceder
      const liveUser = await refreshLiveUser();
      const currentLivePoints = liveUser?.ecoPoints ?? currentUser?.ecoPoints ?? 0;

      if (currentLivePoints < reward.pointsCost) {
        Alert.alert(
          'Puntos insuficientes',
          `Tienes ${currentLivePoints.toLocaleString()} puntos disponibles y esta recompensa requiere ${reward.pointsCost.toLocaleString()} puntos.`
        );
        return;
      }

      // 2. Procesar el canje en backend
      const redemption = await rewardService.redeemReward(reward._id);

      // 3. Actualizar usuario local de inmediato
      if (liveUser) {
        const updatedLocal = { ...liveUser, ecoPoints: currentLivePoints - reward.pointsCost };
        setCurrentUser(updatedLocal);
        AsyncStorage.setItem('@user_data', JSON.stringify(updatedLocal)).catch(() => {});
      }

      // 4. Si la recompensa canjeada era la meta fijada, limpiarla para que no siga saliendo como meta
      try {
        const pinnedTargetId = await targetRewardService.getTargetRewardId();
        if (pinnedTargetId === reward._id) {
          await targetRewardService.clearTargetReward();
        }
      } catch (e) {
        console.error('[ConfirmReward] Error al limpiar meta fijada tras canje:', e);
      }

      navigation.navigate('RewardUnlocked', { reward, redemption });
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Error al canjear la recompensa';
      Alert.alert('No se pudo canjear', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        {/* Cabecera con botón volver y título alineado */}
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
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Volver atrás"
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.title}>Confirmar canje</Text>
          </View>
          <Text style={styles.subtitle}>Revisa los detalles antes de canjear.</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.contentWrapper,
            {
              opacity: contentFade,
              transform: [{ translateY: contentSlide }],
            },
          ]}
        >
          <View style={styles.rewardCard}>
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: reward.iconBg || '#FEF3C7' }]}>
                {getIcon()}
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.rewardName}>{reward.title}</Text>
                <Text style={styles.rewardDesc}>{reward.description}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.valueRow}>
              <Text style={styles.valueLabel}>Valor del incentivo:</Text>
              <Text style={[styles.valuePoints, { color: reward.iconColor || '#D97706' }]}>
                {reward.pointsCost.toLocaleString()} puntos
              </Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Puntos actuales:</Text>
              <Text style={styles.summaryValueBlack}>{currentPoints.toLocaleString()}</Text>
            </View>

            <View style={[styles.summaryRow, { marginBottom: 16 }]}>
              <Text style={styles.summaryLabel}>Costo de canje:</Text>
              <Text style={styles.summaryValueRed}>-{reward.pointsCost.toLocaleString()}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Puntos restantes:</Text>
              <Text style={[styles.summaryValueGreen, remainingPoints < 0 && { color: '#EF4444' }]}>
                {remainingPoints.toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={styles.warningText}>
            Esta acción descontará los puntos correspondientes de tu saldo disponible de forma inmediata.
          </Text>

          <TouchableOpacity
            style={[styles.confirmButton, (loading || remainingPoints < 0) && { opacity: 0.5 }]}
            onPress={handleRedeem}
            disabled={loading || remainingPoints < 0}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirmar canje</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    container: { padding: theme.spacing.m, paddingBottom: 100 },

    header: { marginBottom: 18, marginTop: 2 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    backButton: { marginRight: 10, padding: 4, marginLeft: -4 },
    title: { fontSize: 24, fontWeight: '900', color: colors.text },
    subtitle: { fontSize: 13, color: colors.textSecondary, marginLeft: 2 },

    contentWrapper: { width: '100%', alignItems: 'center' },

    rewardCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.7)',
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
      ...theme.shadows.soft,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    cardInfo: { flex: 1, justifyContent: 'center' },
    rewardName: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 4 },
    rewardDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 14 },
    valueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    valueLabel: { fontSize: 14, color: colors.textSecondary },
    valuePoints: { fontSize: 16, fontWeight: '900' },

    summaryCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: 'rgba(226, 232, 240, 0.7)',
      borderRadius: 18,
      padding: 18,
      marginBottom: 20,
      ...theme.shadows.soft,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    summaryLabel: { fontSize: 15, color: colors.textSecondary },
    summaryLabelBold: { fontSize: 15, fontWeight: '900', color: colors.text },
    summaryValueBlack: { fontSize: 16, fontWeight: '900', color: colors.text },
    summaryValueRed: { fontSize: 16, fontWeight: '900', color: '#EF4444' },
    summaryValueGreen: { fontSize: 18, fontWeight: '900', color: '#16A34A' },

    warningText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
      paddingHorizontal: 16,
      marginBottom: 24,
    },
    confirmButton: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      ...theme.shadows.soft,
    },
    confirmButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
    cancelButton: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  });
