import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Leaf, Plus, Award, Gift } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { goalService, GoalProgress } from '../api/services/goal.service';
import { Goal } from '../types';

export const GoalsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, GoalProgress>>({});
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fetchedGoals, progressList] = await Promise.all([
        goalService.getGoals(),
        goalService.getMyProgress(),
      ]);
      setGoals(fetchedGoals);
      const map: Record<string, GoalProgress> = {};
      progressList.forEach(p => { map[p.goalId] = p; });
      setProgressMap(map);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las metas');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (goal: Goal) => {
    setClaimingId(goal._id);
    try {
      const result = await goalService.claimGoal(goal._id);
      setProgressMap(prev => ({
        ...prev,
        [goal._id]: { ...prev[goal._id], claimed: true },
      }));
      Alert.alert(
        '🎉 ¡Meta completada!',
        `Ganaste +${result.pointsAwarded} puntos. Nuevo saldo: ${result.ecoPoints.toLocaleString()} pts.`
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo reclamar la recompensa');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Mis metas</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AvailableRewards')}>
              <Plus size={16} color="#0F172A" style={{ marginRight: 4 }} />
              <Text style={styles.addButtonText}>Agregar</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Cada meta te acerca a una universidad más sostenible.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : goals.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>No hay metas disponibles en este momento.</Text>
        ) : (
          goals.map((goal) => {
            const prog = progressMap[goal._id];
            const userRecyclesCount = prog?.progress ?? 0;
            const claimed = prog?.claimed ?? false;
            const isExpired = new Date(goal.endDate).getTime() < Date.now();
            const isCompleted = userRecyclesCount >= goal.targetRecycles;
            const percentage = Math.min((userRecyclesCount / goal.targetRecycles) * 100, 100);
            const remaining = goal.targetRecycles - userRecyclesCount;

            return (
              <View key={goal._id} style={styles.goalCard}>
                
                <View style={styles.cardHeader}>
                  <View style={styles.iconInfoRow}>
                    <View style={[styles.iconBg, { backgroundColor: isCompleted ? '#DCFCE7' : '#FEF3C7' }]}>
                      <Leaf size={20} color={isCompleted ? '#16A34A' : '#D97706'} />
                    </View>
                    <View>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={[styles.goalPoints, { color: isCompleted ? '#16A34A' : '#D97706' }]}>
                        {goal.rewardPoints.toLocaleString()} puntos de recompensa
                      </Text>
                    </View>
                  </View>

                  {claimed ? (
                    <View style={styles.statusBadgeGreen}>
                      <Text style={styles.statusBadgeTextGreen}>Reclamada ✓</Text>
                    </View>
                  ) : isCompleted ? (
                    <View style={styles.statusBadgeGreen}>
                      <Text style={styles.statusBadgeTextGreen}>¡Lista para reclamar!</Text>
                    </View>
                  ) : (
                    <View style={styles.statusBadgeOrange}>
                      <Text style={styles.statusBadgeTextOrange}>{remaining} recic. faltantes</Text>
                    </View>
                  )}
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                  </View>
                </View>

                <View style={styles.progressDetailsRow}>
                  <Text style={styles.progressPercentage}>Progreso: {percentage.toFixed(0)}%</Text>
                  <Text style={styles.progressValues}>
                    {isCompleted ? 'completada' : `${userRecyclesCount}/${goal.targetRecycles} reciclajes`}
                  </Text>
                </View>

                <View style={styles.rewardContainer}>
                  <Text style={styles.rewardLabel}>Descripción: </Text>
                  <Text style={styles.rewardValue}>{goal.description}</Text>
                </View>

                {isCompleted && !claimed && !isExpired && (
                  <TouchableOpacity
                    style={[styles.claimButton, claimingId === goal._id && { opacity: 0.6 }]}
                    disabled={claimingId === goal._id}
                    onPress={() => handleClaim(goal)}
                  >
                    {claimingId === goal._id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Gift size={18} color="#FFFFFF" />
                        <Text style={styles.claimButtonText}>
                          Reclamar +{goal.rewardPoints.toLocaleString()} pts
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                {claimed && (
                  <Text style={styles.claimedNote}>Recompensa ya reclamada para esta meta.</Text>
                )}

              </View>
            );
          })
        )}

        <View style={styles.exploreSection}>
          <Text style={styles.exploreTitle}>¿Buscas nuevas recompensas?</Text>
          <Text style={styles.exploreSubtitle}>Añade una nueva meta para seguir tu progreso hacia ese gran premio que deseas.</Text>
          <TouchableOpacity style={styles.exploreButton} onPress={() => navigation.navigate('AvailableRewards')}>
            <Award size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.exploreButtonText}>Explorar recompensas</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  header: { marginBottom: 24, marginTop: theme.spacing.m },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.surface, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  addButtonText: { fontSize: 13, fontWeight: '800', color: colors.text },
  goalCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  goalTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 2 },
  goalPoints: { fontSize: 13, fontWeight: '800' },
  statusBadgeGreen: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeTextGreen: { fontSize: 12, fontWeight: '800', color: '#16A34A' },
  statusBadgeOrange: { backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeTextOrange: { fontSize: 12, fontWeight: '800', color: '#D97706' },
  progressContainer: { height: 8, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressTrack: { flex: 1 },
  progressFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 4 },
  progressDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  progressPercentage: { fontSize: 12, color: colors.textSecondary },
  progressValues: { fontSize: 12, fontWeight: '800', color: colors.text },
  rewardContainer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  rewardLabel: { fontSize: 13, color: colors.textSecondary },
  rewardValue: { fontSize: 13, fontWeight: '800', color: colors.text, flex: 1 },

  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
  },
  claimButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  claimedNote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
  exploreSection: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  exploreTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 8 },
  exploreSubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
