import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Modal, Animated, ScrollView } from 'react-native';
import { ArrowLeft, Filter, Trash2, FileText, GlassWater, Recycle, Package, Gift, X, Calendar } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { AdminService, RecentActivity } from '../api/services/admin.service';

export const AdminActivityLogScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  
  
  const [type, setType] = useState('all'); 
  const [period, setPeriod] = useState('all'); 

  
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const modalScale = React.useRef(new Animated.Value(0.8)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
  }, [type, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await AdminService.getActivityLog(type, period);
      setActivities(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (iconType: string) => {
    switch(iconType) {
      case 'plastic': return <GlassWater size={18} color="#475569" />;
      case 'metal': return <Trash2 size={18} color="#475569" />;
      case 'paper': return <FileText size={18} color="#475569" />;
      case 'redemption': return <Gift size={18} color="#D97706" />;
      case 'recycle': return <Recycle size={18} color="#16A34A" />;
      default: return <Package size={18} color="#475569" />;
    }
  };

  const handleActivityPress = (item: any) => {
    setSelectedActivity(item);
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(modalScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true })
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(modalScale, { toValue: 0.8, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setModalVisible(false);
      setSelectedActivity(null);
    });
  };

  const renderItem = ({ item }: { item: RecentActivity }) => (
    <TouchableOpacity activeOpacity={0.7} style={styles.activityCard} onPress={() => handleActivityPress(item)}>
      <View style={[styles.activityIndicator, { backgroundColor: item.color }]} />
      <View style={styles.activityIconBg}>
        {getIconForType(item.type)}
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityAction}>{item.action} <Text style={{fontSize: 12, fontWeight: 'normal', color: colors.textSecondary}}>por {item.user}</Text></Text>
        <Text style={styles.activityTime}>{new Date(item.time).toLocaleString()}</Text>
      </View>
      <Text style={styles.activityPoints}>{item.points}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Registro Global</Text>
          <Text style={styles.subtitle}>Toda la actividad de la plataforma</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        {}
        <View style={styles.filterGroup}>
          <View style={styles.filterIcon}><Filter size={14} color={colors.textSecondary} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.filterChip, type === 'all' && styles.filterChipActive]} onPress={() => setType('all')}>
              <Text style={[styles.filterChipText, type === 'all' && styles.filterChipTextActive]}>Todo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, type === 'recycle' && styles.filterChipActive]} onPress={() => setType('recycle')}>
              <Text style={[styles.filterChipText, type === 'recycle' && styles.filterChipTextActive]}>Reciclajes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, type === 'redemption' && styles.filterChipActive]} onPress={() => setType('redemption')}>
              <Text style={[styles.filterChipText, type === 'redemption' && styles.filterChipTextActive]}>Canjes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {}
        <View style={styles.filterGroup}>
          <View style={styles.filterIcon}><Calendar size={14} color={colors.textSecondary} /></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            <TouchableOpacity style={[styles.filterChip, period === 'all' && styles.filterChipActive]} onPress={() => setPeriod('all')}>
              <Text style={[styles.filterChipText, period === 'all' && styles.filterChipTextActive]}>Histórico</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, period === 'today' && styles.filterChipActive]} onPress={() => setPeriod('today')}>
              <Text style={[styles.filterChipText, period === 'today' && styles.filterChipTextActive]}>Hoy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, period === '7d' && styles.filterChipActive]} onPress={() => setPeriod('7d')}>
              <Text style={[styles.filterChipText, period === '7d' && styles.filterChipTextActive]}>7 días</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, period === '30d' && styles.filterChipActive]} onPress={() => setPeriod('30d')}>
              <Text style={[styles.filterChipText, period === '30d' && styles.filterChipTextActive]}>30 días</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id + item.time}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No se encontraron actividades con estos filtros.</Text>
            </View>
          }
        />
      )}

      {}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[styles.modalContent, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {selectedActivity && (
              <>
                <View style={[styles.modalIconContainer, { backgroundColor: selectedActivity.color + '20' }]}>
                  {getIconForType(selectedActivity.type)}
                </View>
                <Text style={styles.modalTitle}>{selectedActivity.type === 'redemption' ? 'Detalles de Canje' : 'Detalles de Reciclaje'}</Text>
                <Text style={styles.modalSubtitle}>{new Date(selectedActivity.time).toLocaleString()}</Text>

                <View style={styles.modalDetailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Usuario:</Text>
                    <Text style={styles.detailValue}>{selectedActivity.user}</Text>
                  </View>
                  <View style={styles.divider} />
                  
                  {selectedActivity.type === 'redemption' ? (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Recompensa:</Text>
                        <Text style={styles.detailValue}>{selectedActivity.details?.rewardName}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Puntos gastados:</Text>
                        <Text style={[styles.detailValue, { color: '#EF4444' }]}>{selectedActivity.details?.pointsSpent} pts</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Material:</Text>
                        <Text style={styles.detailValue} style={{textTransform: 'capitalize', fontWeight: 'bold'}}>{selectedActivity.details?.material}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Peso:</Text>
                        <Text style={styles.detailValue}>{selectedActivity.details?.weight} kg</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Puntos ganados:</Text>
                        <Text style={[styles.detailValue, { color: '#10B981' }]}>+{selectedActivity.details?.points} pts</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Modo:</Text>
                        <Text style={styles.detailValue}>{selectedActivity.details?.validationMode === 'inperson' ? 'Presencial' : 'Foto'}</Text>
                      </View>
                    </>
                  )}
                  
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Validado por:</Text>
                    <Text style={styles.detailValue}>{selectedActivity.details?.validatedBy || 'Sistema'}</Text>
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    paddingTop: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: { marginRight: theme.spacing.m, padding: 4 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  
  filtersContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterIcon: {
    marginRight: 8,
    width: 20,
    alignItems: 'center',
  },
  filterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFF',
  },

  listContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
  },

  
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: theme.spacing.m,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  activityIndicator: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4, borderRadius: 2 },
  activityIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginRight: 12 },
  activityInfo: { flex: 1 },
  activityAction: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  activityTime: { fontSize: 12, color: colors.textSecondary },
  activityPoints: { fontSize: 15, fontWeight: '800', color: colors.text },

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '95%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modalDetailsBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});
