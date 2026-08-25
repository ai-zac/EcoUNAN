import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Gift, CheckCircle } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { Reward } from '../types';

export const AvailableRewardsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const data = await rewardService.getRewards();
      setRewards(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowGoal = (rewardTitle: string) => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Recompensas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Catálogo de recompensas</Text>
        <Text style={styles.sectionSubtitle}>Elige tu próxima meta a alcanzar reciclando.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : rewards.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>No hay recompensas disponibles.</Text>
        ) : (
          rewards.map((reward) => (
            <View key={reward._id} style={styles.rewardCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconBg}>
                  <Gift size={22} color="#0F172A" />
                </View>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.rewardTitle}>{reward.title}</Text>
                  <Text style={styles.rewardPoints}>{reward.pointsCost.toLocaleString()} puntos</Text>
                </View>
              </View>
              
              <Text style={styles.rewardDescription}>{reward.description}</Text>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleFollowGoal(reward.title)}
              >
                <CheckCircle size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Fijar como meta</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  rewardCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBg: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardTitleContainer: { flex: 1 },
  rewardTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 4 },
  rewardPoints: { fontSize: 14, fontWeight: '800', color: '#16A34A' },
  rewardDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  actionButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
