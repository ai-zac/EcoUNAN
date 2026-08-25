import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { ArrowLeft, Gift, Award, Trophy, QrCode, X } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { Redemption } from '../types';

export const MyRewardsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [selectedReward, setSelectedReward] = useState<Redemption | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRedemptions();
  }, []);

  const loadRedemptions = async () => {
    try {
      const data = await rewardService.getMyRewards();
      setRedemptions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (color: string) => {
    return <Gift size={24} color={color} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Recompensas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.subtitle}>Incentivos que has desbloqueado con tus puntos.</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : redemptions.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ color: colors.textSecondary }}>Aún no has canjeado recompensas.</Text>
          </View>
        ) : (
          redemptions.map((redemption) => {
            const reward = redemption.reward as any;
            const isDelivered = redemption.status === 'delivered';
            
            return (
              <TouchableOpacity 
                key={redemption._id} 
                style={styles.rewardCard}
                onPress={() => !isDelivered && setSelectedReward(redemption)}
                disabled={isDelivered}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: isDelivered ? '#DCFCE7' : '#FEF3C7' }]}>
                    {getIcon(isDelivered ? '#16A34A' : '#D97706')}
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDate}>Canjeado: {new Date(redemption.createdAt).toLocaleDateString()}</Text>
                  </View>
                  
                  {isDelivered ? (
                    <View style={styles.statusPillDelivered}>
                      <Text style={styles.statusPillTextDelivered}>Entregado</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPillPending}>
                      <Text style={styles.statusPillTextPending}>Pendiente</Text>
                    </View>
                  )}
                </View>

                {!isDelivered && (
                  <View style={styles.cardFooter}>
                    <QrCode size={18} color="#64748B" style={{ marginRight: 6 }} />
                    <Text style={styles.footerText}>Toca para ver el código QR de entrega</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* Modal para ver el QR de entrega */}
      <Modal visible={!!selectedReward} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeModalButton} 
              onPress={() => setSelectedReward(null)}
            >
              <X size={24} color="#64748B" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Código de entrega</Text>
            <Text style={styles.modalSubtitle}>Presenta este QR al administrador para reclamar tu {(selectedReward?.reward as any)?.title}.</Text>

            <View style={styles.qrContainer}>
              <QrCode size={180} color="#0F172A" strokeWidth={1} />
            </View>

            <View style={styles.codePill}>
              <Text style={styles.codePillText}>{selectedReward?.qrCodeData}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 24 },

  rewardCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  rewardTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 4 },
  rewardDate: { fontSize: 13, color: colors.textSecondary },
  
  statusPillDelivered: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillTextDelivered: { fontSize: 12, fontWeight: '800', color: '#16A34A' },
  statusPillPending: { backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillTextPending: { fontSize: 12, fontWeight: '800', color: '#D97706' },

  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  footerText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: 32, alignItems: 'center', ...theme.shadows.medium },
  closeModalButton: { position: 'absolute', top: 16, right: 16, padding: 8 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: 8, marginTop: 12 },
  modalSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  qrContainer: { width: 220, height: 220, borderWidth: 1, borderColor: colors.border, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  codePill: { backgroundColor: colors.surface, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12 },
  codePillText: { fontSize: 12, fontWeight: '900', color: colors.text, letterSpacing: 1 },
});
