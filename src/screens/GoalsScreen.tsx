import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Leaf, Plus, Award } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { goalService } from '../api/services/goal.service';
import { RecycleService } from '../api/services/recycle.service';
import { Goal, RecycleRecord } from '../types';

export const GoalsScreen = ({ navigation }: any) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recycles, setRecycles] = useState<RecycleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const fetchedGoals = await goalService.getGoals();
      setGoals(fetchedGoals);
      
      const history = await RecycleService.getHistory();
      setRecycles(history);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las metas');
    } finally {
      setLoading(false);
    }
  };

  const userRecyclesCount = recycles.length;

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
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : goals.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.textSecondary }}>No hay metas disponibles en este momento.</Text>
        ) : (
          goals.map((goal) => {
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

                  {isCompleted ? (
                    <View style={styles.statusBadgeGreen}>
                      <Text style={styles.statusBadgeTextGreen}>Completada</Text>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  header: { marginBottom: 24, marginTop: theme.spacing.m },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B' },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20 
  },
  addButtonText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  iconInfoRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  goalTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  goalPoints: { fontSize: 13, fontWeight: '800' },
  statusBadgeGreen: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeTextGreen: { fontSize: 12, fontWeight: '800', color: '#16A34A' },
  statusBadgeOrange: { backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeTextOrange: { fontSize: 12, fontWeight: '800', color: '#D97706' },
  progressContainer: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressTrack: { flex: 1 },
  progressFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 4 },
  progressDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  progressPercentage: { fontSize: 12, color: '#64748B' },
  progressValues: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  rewardContainer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12 },
  rewardLabel: { fontSize: 13, color: '#64748B' },
  rewardValue: { fontSize: 13, fontWeight: '800', color: '#0F172A', flex: 1 },
  exploreSection: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  exploreTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 8 },
  exploreSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});
