import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { GlassWater, FileText, Trash2, Box, Gift, X } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { userService } from '../api/services/user.service';
import { RecycleService } from '../api/services/recycle.service';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const { width } = Dimensions.get('window');

const HISTORY_DATA = [
  { id: '1', action: '3 botellas PET', points: '+30', date: 'Hoy • Punto de entrega UNAN', type: 'plastic', iconBg: '#DCFCE7', iconColor: '#16A34A' },
  { id: '2', action: '1 lata de aluminio', points: '+15', date: 'Ayer • Punto de entrega UNAN', type: 'metal', iconBg: '#FEF9C3', iconColor: '#CA8A04' },
  { id: '3', action: 'Papel', points: '+20', date: 'Ayer • Punto de entrega UNAN', type: 'paper', iconBg: '#DBEAFE', iconColor: '#2563EB' },
];

const FILTERS = ['Todo', 'Ganados', 'Canjeados'];

export const PointsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [activeFilter, setActiveFilter] = useState('Todo');

  const [user, setUser] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ]).start();

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const liveUser = await userService.getMe();
      setUser(liveUser);
      
      const historyData = await RecycleService.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error(error);
    }
  };

  const getIconForType = (type: string, color: string) => {
    switch(type) {
      case 'plastic': return <GlassWater size={20} color={color} />;
      case 'metal': return <Trash2 size={20} color={color} />;
      case 'paper': return <FileText size={20} color={color} />;
      default: return <Box size={20} color={color} />;
    }
  };

  const renderDonutChart = () => {
    const size = 160;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const currentPoints = user?.ecoPoints || 0;
    const targetPoints = 2000;
    const percent = Math.min((currentPoints / targetPoints) * 100, 100);
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {/* Fondo del círculo (Gris) */}
          <Circle
            stroke="#F1F5F9"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progreso del círculo (Verde) */}
          <AnimatedCircle
            stroke={theme.colors.accent}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [circumference, strokeDashoffset]
            })}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.chartTextContainer}>
          <Text style={styles.chartValue}>{currentPoints}</Text>
          <Text style={styles.chartSubValue}>/ {targetPoints} puntos</Text>
        </View>
      </View>
    );
  };

  const getPercent = () => {
    const currentPoints = user?.ecoPoints || 0;
    return Math.min((currentPoints / 2000) * 100, 100).toFixed(1);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mis puntos</Text>
          <Text style={styles.subtitle}>Gestiona tus logros y canjes ambientales.</Text>
        </View>
        
        <View style={styles.balanceCard}>
          {renderDonutChart()}
          <View style={styles.balanceTextWrapper}>
            <Text style={styles.balanceTitle}>Puntos disponibles</Text>
            <Text style={styles.balanceSubtitle}>{getPercent()}% completado para tu siguiente meta.</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.redeemButton} 
          onPress={() => navigation.navigate('UserRewards')}
        >
          <Gift size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.redeemButtonText}>Canjear recompensas</Text>
        </TouchableOpacity>

        <View style={styles.filtersContainer}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <TouchableOpacity 
                key={filter} 
                onPress={() => setActiveFilter(filter)}
                style={[styles.filterPill, isActive ? styles.filterPillActive : styles.filterPillInactive]}
              >
                <Text style={[styles.filterText, isActive ? styles.filterTextActive : styles.filterTextInactive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Historial de puntos</Text>
        
        {history.length === 0 ? (
          <Text style={{ textAlign: 'center', color: theme.colors.textSecondary, marginTop: 20 }}>No hay historial aún.</Text>
        ) : (
          history.map((item, index) => {
            let iconBg = '#DCFCE7';
            let iconColor = '#16A34A';
            let iconType = 'plastic';
            
            const firstMaterial = item.items && item.items.length > 0 ? item.items[0].materialType : (item as any).materialType;

            if (firstMaterial === 'aluminio') {
              iconBg = '#FEF9C3'; iconColor = '#CA8A04'; iconType = 'metal';
            } else if (firstMaterial === 'papel' || firstMaterial === 'carton') {
              iconBg = '#DBEAFE'; iconColor = '#2563EB'; iconType = 'paper';
            }

            const materialsText = item.items && item.items.length > 0 
              ? item.items.map((i: any) => `${i.weight}x ${i.materialType}`).join(', ')
              : (item as any).materialType || 'Varios';

            const itemPoints = item.totalPoints !== undefined ? item.totalPoints : ((item as any).pointsEarned || 0);

            return (
              <TouchableOpacity 
                key={item._id} 
                activeOpacity={0.7}
                onPress={() => { setSelectedItem(item); setModalVisible(true); }}
              >
                <Animated.View style={[styles.historyItem]}>
                  <View style={[styles.historyIconBg, { backgroundColor: iconBg }]}>
                    {getIconForType(iconType, iconColor)}
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyAction} numberOfLines={1}>
                      {materialsText} {item.status === 'pending' ? '(Pendiente)' : ''}
                    </Text>
                    <Text style={styles.historyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={[styles.historyPoints, { color: item.status === 'pending' ? theme.colors.textSecondary : theme.colors.accent }]}>
                    {itemPoints > 0 ? `+${itemPoints} pts` : '--'}
                  </Text>
                </Animated.View>
              </TouchableOpacity>
            );
          })
        )}

      </Animated.ScrollView>

      {/* Modal de Detalle */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>

            {selectedItem && (
              <>
                <Text style={styles.modalTitle}>Detalle de Registro</Text>
                
                <View style={styles.modalStatusBadge}>
                  <Text style={[styles.modalStatusText, { color: selectedItem.status === 'validated' ? '#16A34A' : selectedItem.status === 'rejected' ? '#EF4444' : '#CA8A04' }]}>
                    {selectedItem.status === 'validated' ? 'Completado' : selectedItem.status === 'rejected' ? 'Rechazado' : 'En proceso'}
                  </Text>
                </View>

                <Text style={styles.modalDate}>
                  Registrado el {new Date(selectedItem.createdAt).toLocaleDateString()} a las {new Date(selectedItem.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>

                <View style={styles.modalPointsBox}>
                  <Text style={styles.modalPointsLabel}>Puntos Obtenidos</Text>
                  <Text style={styles.modalPointsValue}>+{selectedItem.totalPoints || 0}</Text>
                </View>

                <Text style={styles.modalSectionTitle}>Materiales entregados:</Text>
                {selectedItem.items?.map((m: any, idx: number) => (
                  <View key={idx} style={styles.modalMaterialRow}>
                    <Text style={styles.modalMaterialText}>• {m.weight}x {m.materialType}</Text>
                    <Text style={styles.modalMaterialPoints}>+{m.pointsEarned || 0} pts</Text>
                  </View>
                ))}

                {selectedItem.description ? (
                  <View style={styles.modalDescBox}>
                    <Text style={styles.modalDescTitle}>Tus Notas:</Text>
                    <Text style={styles.modalDescText}>{selectedItem.description}</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.l, paddingBottom: 100 },
  header: { marginBottom: theme.spacing.l },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: 4 },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  
  balanceCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    ...theme.shadows.soft,
  },
  chartContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  chartTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartValue: {
    fontSize: 32,
    fontWeight: '900',
    color: theme.colors.primary,
  },
  chartSubValue: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: -2,
  },
  balanceTextWrapper: { alignItems: 'center' },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  redeemButton: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  filtersContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.s,
  },
  filterPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.round,
  },
  filterPillActive: {
    backgroundColor: theme.colors.accent,
  },
  filterPillInactive: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: { color: theme.colors.white },
  filterTextInactive: { color: theme.colors.textSecondary },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.m,
  },
  
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    ...theme.shadows.soft,
  },
  historyIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  historyInfo: { flex: 1 },
  historyAction: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  historyPoints: {
    fontSize: 16,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    ...theme.shadows.medium,
  },
  closeModalButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    paddingRight: 32,
  },
  modalStatusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
  },
  modalPointsBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  modalPointsLabel: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '600',
    marginBottom: 4,
  },
  modalPointsValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#16A34A',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  modalMaterialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalMaterialText: {
    fontSize: 15,
    color: '#334155',
  },
  modalMaterialPoints: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },
  modalDescBox: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
  },
  modalDescTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  modalDescText: {
    fontSize: 14,
    color: '#0F172A',
  },
});
