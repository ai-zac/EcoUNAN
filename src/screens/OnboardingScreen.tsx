import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gift, Recycle, Target, ArrowRight } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

const ONBOARDING_DATA = [
  {
    title: 'EcoUNAN\nReciclaje inteligente',
    description: 'La plataforma oficial de la UNAN para reciclar, sumar EcoPoints y canjear recompensas universitarias.',
    localImage: require('../../assets/images/ecounan_logo_transparent.png'),
    badge: 'UNAN Sostenible',
  },
  {
    title: 'Reciclar tiene\nrecompensa',
    description: 'Convierte tus botellas, latas, papel y cartón en EcoPoints acumulables para tu cuenta estudiantil.',
    icon: Gift,
    badge: 'Beneficios y Premios',
  },
  {
    title: 'Cada acción\ncuenta',
    description: 'Entrega tus materiales en los puntos de recolección del campus escaneando el código QR del brigadista.',
    icon: Recycle,
    badge: 'Entrega Rápida con QR',
  },
  {
    title: 'Alcanza tus\nmetas',
    description: 'Compite en el ranking por facultad, sube de liga y desbloquea cupones de cafetería y matrícula.',
    icon: Target,
    badge: 'Compite y Crece',
  },
];

export const OnboardingScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useStyles(colors, insets);

  const [currentIndex, setCurrentIndex] = useState(0);
  const data = ONBOARDING_DATA[currentIndex];
  const Icon = data.icon;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    scaleAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const handleSkip = () => {
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{data.badge}</Text>
        </View>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.visualContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            {data.localImage ? (
              <Image
                source={data.localImage}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : Icon ? (
              <View style={styles.iconCircle}>
                <Icon size={70} color="#16A34A" strokeWidth={1.8} />
              </View>
            ) : null}
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], width: '100%' }}>
            <Text style={styles.title} testID="onboarding-title">{data.title}</Text>
            <Text style={styles.description}>{data.description}</Text>
          </Animated.View>
        </View>

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {ONBOARDING_DATA.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  currentIndex === index && styles.activeDot,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNext}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={currentIndex === ONBOARDING_DATA.length - 1 ? 'Comenzar' : 'Siguiente'}
          >
            <Text style={styles.primaryButtonText}>
              {currentIndex === ONBOARDING_DATA.length - 1 ? 'Comenzar ahora' : 'Siguiente'}
            </Text>
            <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.l,
      paddingTop: 8,
      paddingBottom: 4,
    },
    badgeContainer: {
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 12,
    },
    badgeText: {
      color: '#16A34A',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    skipButton: {
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    skipText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    container: {
      flex: 1,
      paddingHorizontal: theme.spacing.l,
      paddingBottom: Math.max(insets.bottom, 16),
      justifyContent: 'space-between',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },
    visualContainer: {
      width: 220,
      height: 220,
      borderRadius: 36,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 3,
    },
    logoImage: {
      width: 170,
      height: 170,
    },
    iconCircle: {
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...theme.typography.h1,
      fontSize: 30,
      lineHeight: 36,
      textAlign: 'center',
      marginBottom: 12,
      color: colors.text,
      fontWeight: '900',
    },
    description: {
      ...theme.typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 12,
      lineHeight: 23,
      fontSize: 15,
    },
    footer: {
      paddingTop: 12,
      paddingBottom: 16,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    activeDot: {
      width: 24,
      backgroundColor: '#16A34A',
    },
    primaryButton: {
      height: 56,
      borderRadius: 18,
      backgroundColor: '#16A34A',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      width: '100%',
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 5,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: 'bold',
      letterSpacing: 0.2,
    },
  });
