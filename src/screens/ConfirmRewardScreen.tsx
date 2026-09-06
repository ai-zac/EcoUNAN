import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Gift, Award, Trophy } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { AuthService } from '../api/services/auth.service';
import { User, Reward } from '../types';

export const ConfirmRewardScreen = ({ route, navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const { reward } = route.params as { reward: Reward };
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AuthService.getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  const currentPoints = currentUser?.ecoPoints || 0;
  const remainingPoints = currentPoints - reward.pointsCost;

  const getIcon = () => {
    switch (reward.iconName) {
      case 'Gift': return <Gift size={24} color={reward.iconColor || '#D97706'} />;
      case 'Award': return <Award size={24} color={reward.iconColor || '#D97706'} />;
      case 'Trophy': return <Trophy size={24} color={reward.iconColor || '#D97706'} />;
      default: return <Gift size={24} color={reward.iconColor || '#D97706'} />;
    }
  };

  const handleRedeem = async () => {
    if (remainingPoints < 0) {
      Alert.alert('Error', 'No tienes suficientes puntos para canjear esta recompensa.');
      return;
    }
    
    setLoading(true);
    try {
      const redemption = await rewardService.redeemReward(reward._id);
      navigation.navigate('RewardUnlocked', { reward, redemption });
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Error al canjear la recompensa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Confirmar canje</Text>
          <Text style={styles.subtitle}>Revisa los detalles antes de canjear.</Text>
        </View>

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
          Esta acción no se puede deshacer. Al confirmar, los puntos se descontarán de tu saldo disponible.
        </Text>

        <TouchableOpacity 
          style={[styles.confirmButton, (loading || remainingPoints < 0) && { opacity: 0.5 }]}
          onPress={handleRedeem}
          disabled={loading || remainingPoints < 0}
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
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { padding: theme.spacing.m, paddingBottom: 100, alignItems: 'center' },
  header: { marginBottom: 32, marginTop: 40, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary },
  rewardCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...theme.shadows.soft,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  iconBox: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1, justifyContent: 'center' },
  rewardName: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4 },
  rewardDesc: { fontSize: 14, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.surface, marginBottom: 16 },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  valueLabel: { fontSize: 15, color: colors.textSecondary },
  valuePoints: { fontSize: 16, fontWeight: '900' },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    ...theme.shadows.soft,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { fontSize: 16, color: colors.textSecondary },
  summaryLabelBold: { fontSize: 16, fontWeight: '900', color: colors.text },
  summaryValueBlack: { fontSize: 16, fontWeight: '900', color: colors.text },
  summaryValueRed: { fontSize: 16, fontWeight: '900', color: '#EF4444' },
  summaryValueGreen: { fontSize: 18, fontWeight: '900', color: '#16A34A' },
  warningText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  confirmButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  cancelButton: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '800', color: colors.textSecondary },
});
