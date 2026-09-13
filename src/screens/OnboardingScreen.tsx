import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { Gift, Recycle, Target } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Button } from '../components/Button';

const ONBOARDING_DATA = [
  {
    title: 'Reciclar tiene\nrecompensa',
    description: 'Convierte tus materiales reciclables en puntos y contribuye a una UNAN más sostenible.',
    icon: Gift,
  },
  {
    title: 'Cada acción\ncuenta',
    description: 'Registra tu reciclaje en los puntos de recolección y observa tu impacto positivo.',
    icon: Recycle,
  },
  {
    title: 'Alcanza tus\nmetas',
    description: 'Sube de nivel, compite en el ranking y canjea tus puntos por recompensas increíbles.',
    icon: Target,
  },
];

export const OnboardingScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

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
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <Icon size={80} color={colors.accent} strokeWidth={1.5} />
          </Animated.View>
          
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
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
          
          <Button 
            title={currentIndex === ONBOARDING_DATA.length - 1 ? "Comenzar" : "Siguiente"} 
            onPress={handleNext} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.l,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 250,
    height: 250,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xxl,
  },
  title: {
    ...theme.typography.h1,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
  },
  description: {
    ...theme.typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.m,
    lineHeight: 24,
  },
  footer: {
    paddingBottom: theme.spacing.l,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
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
    backgroundColor: colors.primary,
  },
});
