import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, FlatList, RefreshControl,
} from 'react-native';
import { ArrowLeft, Gift, ShoppingBag, CheckCircle, XCircle } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { AdminService } from '../api/services/admin.service';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#D97706', bg: '#FEF3C7' },
  completed: { label: 'Completado', color: '#16A34A', bg: '#DCFCE7' },
  cancelled: { label: 'Cancelado', color: '#0F172A', bg: '#CBD5E1' },
};

export const AdminRedemptionsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const fetchRedemptions = async () => {
    try {
      const data = await AdminService.getAllRedemptions();
      setRedemptions(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los canjes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRedemptions();
  };

  const handleComplete = (id: string, rewardTitle: string) => {
    Alert.alert('Confirmar entrega', `¿Marcar "${rewardTitle}" como COMPLETADO?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Completar',
        onPress: async () => {
          try {
            await AdminService.completeRedemption(id);
            fetchRedemptions();
          } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error || 'No se pudo completar el canje');
          }
        },
      },
    ]);
  };

  const handleCancel = (id: string, rewardTitle: string, points: number) => {
    Alert.alert(
      'Cancelar canje',
      `Se cancelará "${rewardTitle}" y se devolverán ${points} puntos al usuario.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancelar canje',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdminService.cancelRedemption(id);
              fetchRedemptions();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.error || 'No se pudo cancelar el canje');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
    const userName = typeof item.user === 'object' ? item.user.name : 'Usuario';
    const userEmail = typeof item.user === 'object' ? item.user.email : '';
    const rewardTitle = typeof item.reward === 'object' ? item.reward.title : 'Recompensa';

    return (
      <View style={styles.card}>
        <View style={styles.iconBox}>
          <Gift size={20} color="#D97706" />
        </View>
        <View style={styles.info}>
          <Text style={styles.rewardTitle}>{rewardTitle}</Text>
          <Text style={styles.userName}>por {userName}</Text>
          {!!userEmail && <Text style={styles.userEmail}>{userEmail}</Text>}
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
            </View>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <Text style={styles.points}>-{item.pointsSpent} pts</Text>

        {item.status === 'pending' && (
          <View style={[styles.actionsRow, styles.actionsRowCard]}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionComplete]}
              onPress={() => handleComplete(item._id, rewardTitle)}
            >
              <CheckCircle size={15} color="#FFFFFF" />
              <Text style={styles.actionTextWhite}>Completar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionCancel]}
              onPress={() => handleCancel(item._id, rewardTitle, item.pointsSpent)}
            >
              <XCircle size={15} color="#EF4444" />
              <Text style={styles.actionTextRed}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Canjes realizados</Text>
        <View style={styles.totalBox}>
          <ShoppingBag size={13} color={colors.accent} />
          <Text style={styles.totalText}>{redemptions.length}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={redemptions}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>Todavía no hay canjes registrados.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.l,
    paddingTop: theme.spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  title: { ...theme.typography.h2, color: colors.text, flex: 1 },
  totalBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.borderRadius.round,
  },
  totalText: { fontSize: 13, fontWeight: '800', color: colors.text },

  listContainer: { padding: theme.spacing.l, gap: theme.spacing.m },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.soft,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  info: { flex: 1 },
  rewardTitle: { ...theme.typography.body, fontWeight: 'bold' },
  userName: { ...theme.typography.caption, marginTop: 2 },
  userEmail: { ...theme.typography.caption, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.s },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  date: { ...theme.typography.caption },
  points: { fontSize: 15, fontWeight: '900', color: '#D97706' },

  actionsRow: { flexDirection: 'row' },
  actionsRowCard: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.s,
  },
  actionComplete: { backgroundColor: '#16A34A' },
  actionCancel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#FECACA', marginLeft: 8 },
  actionTextWhite: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  actionTextRed: { color: '#EF4444', fontSize: 13, fontWeight: '800' },

  empty: { ...theme.typography.bodySecondary, textAlign: 'center', marginTop: 40 },
});
