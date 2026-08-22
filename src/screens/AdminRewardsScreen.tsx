import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, Edit, EyeOff, Power, Trash2, Gift, Award, Trophy } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { rewardService } from '../api/services/reward.service';
import { Reward } from '../types';

export const AdminRewardsScreen = ({ navigation }: any) => {
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
      Alert.alert('Error', 'No se pudieron cargar las recompensas');
    } finally {
      setLoading(false);
    }
  };

  const toggleRewardStatus = async (id: string, currentStatus: boolean) => {
    try {
      await rewardService.updateReward(id, { isActive: !currentStatus });
      setRewards(prev => prev.map(reward => 
        reward._id === id ? { ...reward, isActive: !currentStatus } : reward
      ));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const deleteReward = (id: string) => {
    Alert.alert('Confirmar', '¿Estás seguro de eliminar esta recompensa?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Eliminar', 
        style: 'destructive',
        onPress: async () => {
          try {
            await rewardService.deleteReward(id);
            setRewards(prev => prev.filter(r => r._id !== id));
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'No se pudo eliminar la recompensa');
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Recompensas</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AdminEditReward')}>
          <Text style={styles.addButtonText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Recompensas registradas</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : rewards.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: theme.colors.textSecondary }}>No hay recompensas.</Text>
        ) : (
          rewards.map((item) => (
            <View key={item._id} style={styles.rewardCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rewardName}>{item.title}</Text>
                  <Text style={styles.rewardDetails}>
                    {item.pointsCost} pts • {item.stock === -1 ? 'Stock ilimitado' : `${item.stock} disponibles`}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#DCFCE7' : '#F1F5F9' }]}>
                  <Text style={[styles.statusText, { color: item.isActive ? '#16A34A' : '#0F172A' }]}>{item.isActive ? 'Activa' : 'Inactiva'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AdminEditReward', { rewardId: item._id })}>
                  <Edit size={16} color="#0F172A" style={styles.actionIcon} />
                  <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <View style={styles.actionSpacing} />
                <TouchableOpacity style={styles.actionButton} onPress={() => toggleRewardStatus(item._id, item.isActive)}>
                  {item.isActive ? (
                    <EyeOff size={16} color="#0F172A" style={styles.actionIcon} />
                  ) : (
                    <Power size={16} color="#0F172A" style={styles.actionIcon} />
                  )}
                  <Text style={styles.actionText}>{item.isActive ? 'Ocultar' : 'Activar'}</Text>
                </TouchableOpacity>
                <View style={styles.actionSpacing} />
                <TouchableOpacity style={[styles.actionButton, { borderColor: '#FECACA' }]} onPress={() => deleteReward(item._id)}>
                  <Trash2 size={16} color="#EF4444" style={styles.actionIcon} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A', flex: 1 },
  addButton: { backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: theme.spacing.m },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  rewardName: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  rewardDetails: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  statusBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12 },
  actionsRow: { flexDirection: 'row' },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
  },
  actionSpacing: { width: 8 },
  actionIcon: { marginRight: 8 },
  actionText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
});
