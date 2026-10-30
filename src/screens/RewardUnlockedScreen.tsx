import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import {
  Trophy,
  Gift,
  Award,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  PackageCheck,
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import QRCode from 'react-native-qrcode-svg';
import { rewardService } from '../api/services/reward.service';

const { width } = Dimensions.get('window');

export const RewardUnlockedScreen = ({ route, navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const { reward, redemption } = route.params || {
    reward: {
      title: 'Recompensa EcoUNAN',
      desc: 'Incentivo para estudiantes',
      points: 0,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      id: '1',
    },
  };

  const [isDelivered, setIsDelivered] = useState(
    redemption?.status === 'completed'
  );

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const successCircleScale = useRef(new Animated.Value(0.2)).current;
  const successFade = useRef(new Animated.Value(0)).current;
  const successSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {

    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, []);

  useEffect(() => {
    if (isDelivered) return;

    const targetId = redemption?._id || redemption?.id;
    const targetQr = redemption?.qrCodeData;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const myRewards = await rewardService.getMyRewards();
        if (!isMounted) return;

        const found = myRewards.find(
          (r: any) =>
            (targetId && (r._id === targetId || r.id === targetId)) ||
            (targetQr && r.qrCodeData === targetQr)
        );

        if (found && found.status === 'completed') {
          clearInterval(interval);
          triggerDeliverySuccess();
        }
      } catch (err) {

      }
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isDelivered, redemption]);

  const triggerDeliverySuccess = () => {
    setIsDelivered(true);
    Animated.sequence([
      Animated.spring(successCircleScale, {
        toValue: 1,
        tension: 65,
        friction: 6.5,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(successFade, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(successSlide, {
          toValue: 0,
          tension: 60,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const getIcon = (id: string, color: string) => {
    switch (id) {
      case '1': return <Gift size={22} color={color} />;
      case '2': return <Award size={22} color={color} />;
      case '3': return <Trophy size={22} color={color} />;
      default: return <Gift size={22} color={color} />;
    }
  };

  const handleGoHome = () => {
    navigation.navigate('MainTabs', { screen: 'Inicio' });
  };

  const handleGoRewards = () => {
    navigation.navigate('MyRewards');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.surface}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoHome}
          activeOpacity={0.7}
          accessibilityLabel="Volver al inicio"
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isDelivered ? 'Canje Completado' : 'Canje de Recompensa'}
        </Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isDelivered ? (

          <View style={styles.deliveredContainer}>
            <View style={styles.circleContainer}>
              <Animated.View
                style={[
                  styles.greenCircle,
                  { transform: [{ scale: successCircleScale }] },
                ]}
              >
                <Check size={56} color="#FFFFFF" strokeWidth={3} />
              </Animated.View>
            </View>

            <Animated.View
              style={{
                opacity: successFade,
                transform: [{ translateY: successSlide }],
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Text style={styles.deliveredTitle}>¡Recompensa entregada!</Text>
              <Text style={styles.deliveredSubtitle}>
                El brigadista o administrador ha confirmado la entrega física de tu premio. ¡Disfrútalo!
              </Text>

              <View style={styles.receiptCard}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptBadgeText}>ENTREGA COMPLETADA</Text>
                  <View style={styles.statusSuccessPill}>
                    <CheckCircle2 size={13} color="#16A34A" />
                    <Text style={styles.statusSuccessText}>Entregado</Text>
                  </View>
                </View>

                <View style={styles.receiptRow}>
                  <View
                    style={[
                      styles.smallIconBox,
                      { backgroundColor: reward.iconBg || '#FEF3C7' },
                    ]}
                  >
                    {getIcon(reward.id, reward.iconColor || '#D97706')}
                  </View>
                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptRewardName}>
                      {reward.title || 'Recompensa EcoUNAN'}
                    </Text>
                    <Text style={styles.receiptRewardDesc}>
                      {reward.desc || 'Premio entregado por reciclaje universitario'}
                    </Text>
                  </View>
                </View>

                <View style={styles.receiptDivider} />

                <View style={styles.receiptFooterRow}>
                  <Text style={styles.receiptPointsLabel}>EcoPoints canjeados:</Text>
                  <Text style={styles.receiptPointsValue}>
                    -{reward.points || reward.pointsCost || 0} EcoPoints
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        ) : (

          <View style={styles.pendingContainer}>
            <Animated.View
              style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}
            >
              <Trophy size={54} color="#FFFFFF" strokeWidth={1.8} />
            </Animated.View>

            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Text style={styles.title}>¡Recompensa{'\n'}desbloqueada!</Text>
              <Text style={styles.description}>
                Presenta este código al brigadista o administrador para recibir tu incentivo físico.
              </Text>

              <View style={styles.qrCard}>
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.smallIconBox,
                      { backgroundColor: reward.iconBg || '#FEF3C7' },
                    ]}
                  >
                    {getIcon(reward.id, reward.iconColor || '#D97706')}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardName}>{reward.title}</Text>
                    <Text style={styles.rewardSuccessText}>Listo para retirar</Text>
                  </View>
                </View>

                <View style={styles.qrPlaceholder}>
                  <QRCode
                    value={redemption?.qrCodeData || 'NO-DATA'}
                    size={160}
                    color="#0F172A"
                    backgroundColor="transparent"
                  />
                </View>

                <View style={styles.codePill}>
                  <Text style={styles.codePillText}>
                    {redemption?.qrCodeData || 'Sin código'}
                  </Text>
                </View>

                <View style={styles.waitingContainer}>
                  <Animated.View
                    style={[
                      styles.pulseDot,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  />
                  <Text style={styles.waitingText}>
                    Esperando escaneo del brigadista...
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoRewards}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Ver mis recompensas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
    },
    scrollContent: {
      flexGrow: 1,
      padding: theme.spacing.m,
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 36,
    },
    pendingContainer: {
      alignItems: 'center',
      width: '100%',
      paddingTop: 12,
    },
    deliveredContainer: {
      alignItems: 'center',
      width: '100%',
      paddingTop: 24,
    },
    circleContainer: {
      width: 120,
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    greenCircle: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: '#16A34A',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 6,
    },
    deliveredTitle: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    deliveredSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 16,
      marginBottom: 28,
      lineHeight: 20,
    },
    receiptCard: {
      width: '100%',
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1.5,
      borderColor: '#86EFAC',
      marginBottom: 24,
      ...theme.shadows.soft,
    },
    receiptHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    receiptBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#16A34A',
      letterSpacing: 0.8,
    },
    statusSuccessPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: '#DCFCE7',
    },
    statusSuccessText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#16A34A',
    },
    receiptRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    receiptInfo: {
      flex: 1,
    },
    receiptRewardName: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
    },
    receiptRewardDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    receiptDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    receiptFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    receiptPointsLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    receiptPointsValue: {
      fontSize: 16,
      fontWeight: '800',
      color: '#EF4444',
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#F59E0B',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 16,
      marginBottom: 20,
      lineHeight: 20,
    },
    qrCard: {
      width: '100%',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 22,
      padding: 20,
      alignItems: 'center',
      ...theme.shadows.soft,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: 16,
      width: '100%',
    },
    smallIconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rewardName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 2,
    },
    rewardSuccessText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#16A34A',
    },
    qrPlaceholder: {
      width: 200,
      height: 200,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      padding: 10,
    },
    codePill: {
      backgroundColor: colors.surface,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    codePillText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.8,
    },
    waitingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      width: '100%',
      justifyContent: 'center',
    },
    pulseDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#22C55E',
    },
    waitingText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    buttonsContainer: {
      width: '100%',
      gap: 10,
      marginTop: 20,
    },
    primaryButton: {
      width: '100%',
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    primaryButtonText: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    secondaryButton: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
  });
