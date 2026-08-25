import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Gift, Award, Trophy } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { userService } from '../api/services/user.service';
import { AuthService } from '../api/services/auth.service';
import { Reward } from '../types';

export const UserRewardsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [userPoints, setUserPoints] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar puntos locales inmediatamente para UI más rápida
      const localUser = await AuthService.getCurrentUser();
      if (localUser) {
        setUserPoints(localUser.ecoPoints || 0);
      }

      // Obtener recompensas
      const fetchedRewards = await rewardService.getRewards();
      setRewards(fetchedRewards);

      // Actualizar puntos de forma silenciosa en segundo plano
      userService.getMe().then(user => {
        if (user) setUserPoints(user.ecoPoints || 0);
      }).catch(err => console.log('Error silenciado al actualizar usuario:', err));

    } catch (error: any) {
      console.error('Error al cargar recompensas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (name: string, color: string) => {
    switch (name) {
      case 'Gift': return <Gift size={24} color={color} />;
      case 'Award': return <Award size={24} color={color} />;
      case 'Trophy': return <Trophy size={24} color={color} />;
      default: return <Gift size={24} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Recompensas</Text>
          <Text style={styles.subtitle}>Canjea tus puntos por incentivos.</Text>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>TUS PUNTOS ACTUALES</Text>
          <Text style={styles.pointsValue}>{userPoints.toLocaleString()} puntos</Text>
        </View>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>Cargando recompensas...</Text>
        ) : rewards.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>No hay recompensas disponibles en este momento.</Text>
        ) : (
          rewards.map((item) => {
            const isOutOfStock = item.stock === 0;
            const canAfford = userPoints >= item.pointsCost;
            
            return (
              <View key={item._id} style={[styles.rewardCard, isOutOfStock && { opacity: 0.6 }]}>
                
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, { backgroundColor: item.iconBg || '#F1F5F9' }]}>
                    {getIcon(item.iconName || 'Gift', item.iconColor || '#64748B')}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.rewardName}>{item.title}</Text>
                    <Text style={styles.rewardDesc}>{item.description}</Text>
                    <View style={[styles.pointsBadge, { backgroundColor: canAfford ? '#DCFCE7' : '#FEF2F2' }]}>
                      <Text style={[styles.pointsBadgeText, { color: canAfford ? '#16A34A' : '#EF4444' }]}>
                        {item.pointsCost.toLocaleString()} puntos
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardBottom}>
                  <Text style={[styles.availabilityText, isOutOfStock && { color: '#EF4444', fontWeight: 'bold' }]}>
                    {item.stock === -1 ? 'Disponibilidad inmediata' : item.stock === 0 ? 'Agotado' : `Quedan ${item.stock} unidades`}
                  </Text>
                  <TouchableOpacity 
                    style={[styles.actionButton, (isOutOfStock || !canAfford) && { backgroundColor: '#94A3B8' }]}
                    disabled={isOutOfStock || !canAfford}
                    onPress={() => navigation.navigate('ConfirmReward', { reward: item })}
                  >
                    <Text style={styles.actionButtonText}>Canjear</Text>
                  </TouchableOpacity>
                </View>

              </View>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  
  header: { marginBottom: 16, marginTop: theme.spacing.s },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary },

  pointsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  pointsLabel: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1 },
  pointsValue: { fontSize: 18, fontWeight: '900', color: '#16A34A' },

  rewardCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1, alignItems: 'flex-start' },
  rewardName: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 2 },
  rewardDesc: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, lineHeight: 18 },
  pointsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pointsBadgeText: { fontSize: 12, fontWeight: '900' },

  divider: { height: 1, backgroundColor: colors.surface, marginVertical: 16 },

  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  availabilityText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  actionButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  actionButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
