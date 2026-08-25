import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Animated, TouchableOpacity } from 'react-native';
import { Trophy, Gift, Award, QrCode } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

export const RewardUnlockedScreen = ({ route, navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const { reward } = route.params || { 
    reward: { 
      name: 'Kit EcoUNAN', 
      desc: 'Kit ecológico para estudiantes', 
      points: 2000, 
      iconBg: '#FEF3C7', 
      iconColor: '#D97706',
      id: '1'
    } 
  };

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ]).start();
  }, []);

  const getIcon = (id: string, color: string) => {
    switch (id) {
      case '1': return <Gift size={20} color={color} />;
      case '2': return <Award size={20} color={color} />;
      case '3': return <Trophy size={20} color={color} />;
      default: return <Gift size={20} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
            <Trophy size={60} color="#FFFFFF" strokeWidth={1.5} />
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: 'center', width: '100%' }}>
            <Text style={styles.title}>¡Recompensa{'\n'}desbloqueada!</Text>
            <Text style={styles.description}>
              Presenta este código al administrador para recibir tu incentivo.
            </Text>

            <View style={styles.qrCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.smallIconBox, { backgroundColor: reward.iconBg }]}>
                  {getIcon(reward.id, reward.iconColor)}
                </View>
                <View>
                  <Text style={styles.rewardName}>{reward.name}</Text>
                  <Text style={styles.rewardSuccessText}>Canjeado con éxito</Text>
                </View>
              </View>

              <View style={styles.qrPlaceholder}>
                <QrCode size={140} color="#0F172A" strokeWidth={1} />
              </View>

              <View style={styles.codePill}>
                <Text style={styles.codePillText}>ECO-2026-00125</Text>
              </View>
            </View>
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: fadeAnim, paddingBottom: theme.spacing.m, width: '100%' }}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('MyRewards')}
          >
            <Text style={styles.actionButtonText}>Ver mis recompensas</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, padding: theme.spacing.m, justifyContent: 'space-between', alignItems: 'center' },
  
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  
  iconContainer: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#F59E0B', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24,
    ...theme.shadows.medium,
  },
  
  title: { fontSize: 32, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 12, lineHeight: 36 },
  description: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20, marginBottom: 32, lineHeight: 22 },
  
  qrCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 24 },
  smallIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rewardName: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 2 },
  rewardSuccessText: { fontSize: 13, color: colors.textSecondary },

  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  codePill: { backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  codePillText: { fontSize: 15, fontWeight: '900', color: colors.text, letterSpacing: 1 },

  actionButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
