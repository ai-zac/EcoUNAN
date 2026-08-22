import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Linking, Platform, Modal } from 'react-native';
import { ArrowLeft, GlassWater, Trash2, FileText, CheckCircle, Package, Droplet, Coffee } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { AdminService } from '../api/services/admin.service';
import { API_BASE_URL } from '../api/apiClient';
import { RecycleRecord } from '../types';

export const AdminRecyclesScreen = ({ navigation }: any) => {
  const [validations, setValidations] = useState<RecycleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de detalles
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const data = await AdminService.getPendingRecycles();
      setValidations(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las validaciones pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedItem) return;
    
    const id = selectedItem._id;
    setProcessing(true);
    
    try {
      if (action === 'approve') {
        await AdminService.validateRecycle(id);
      } else {
        await AdminService.rejectRecycle(id);
      }
      setValidations(prev => prev.filter(item => item._id !== id));
      setDetailsModalVisible(false);
    } catch (error) {
      if (Platform.OS === 'web') alert(`No se pudo ${action === 'approve' ? 'validar' : 'rechazar'}`);
      else Alert.alert('Error', `No se pudo ${action === 'approve' ? 'validar' : 'rechazar'}`);
    } finally {
      setProcessing(false);
    }
  };

  const getIconForType = (type: string) => {
    switch(type) {
      case 'pet': return <GlassWater size={18} color="#16A34A" />;
      case 'aluminio': return <Coffee size={18} color="#16A34A" />;
      case 'papel': return <FileText size={18} color="#16A34A" />;
      case 'carton': return <Package size={18} color="#16A34A" />;
      case 'plastico': return <Droplet size={18} color="#16A34A" />;
      default: return <GlassWater size={18} color="#16A34A" />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Validar reciclaje</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Validaciones pendientes</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : validations.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color="#10B981" />
            <Text style={styles.emptyStateText}>No hay validaciones pendientes</Text>
          </View>
        ) : (
          validations.map((item) => {
            const itemsToRender = item.items && item.items.length > 0 
              ? item.items 
              : [{ materialType: (item as any).materialType || 'pet', weight: (item as any).weight || 0, pointsEarned: (item as any).pointsEarned || 0 }];
            
            const displayTotalPoints = item.totalPoints || (item as any).pointsEarned || 0;
            const displayTotalWeight = item.totalWeight || (item as any).weight || 0;

            return (
            <TouchableOpacity 
              key={item._id} 
              style={styles.validationCard}
              onPress={() => {
                setSelectedItem(item);
                setDetailsModalVisible(true);
              }}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconBg}>
                  {getIconForType(itemsToRender[0]?.materialType)}
                </View>
                <View style={styles.infoContainer}>
                  <Text style={styles.itemName}>{(item as any).user?.name || 'Usuario'}</Text>
                  <Text style={styles.itemDetails}>{displayTotalWeight} kg totales • {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsText}>+{displayTotalPoints} pts</Text>
                </View>
              </View>

              <View style={styles.divider} />
              
              <Text style={styles.viewDetailsText}>Toca para revisar evidencia y aprobar</Text>
            </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Detalles y Evidencia */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 0, overflow: 'hidden' }]}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Revisar Reciclaje</Text>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedItem && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalSubtitle}>Usuario: <Text style={{fontWeight: '900'}}>{selectedItem.user?.name || 'Usuario'}</Text></Text>
                  
                  <View style={styles.breakdownBox}>
                    <Text style={styles.breakdownTitle}>Materiales entregados:</Text>
                    {((selectedItem.items && selectedItem.items.length > 0) ? selectedItem.items : [{ materialType: selectedItem.materialType || 'pet', weight: selectedItem.weight || 0 }]).map((i: any, idx: number) => (
                      <Text key={idx} style={styles.breakdownItem}>• {i.weight}kg de {i.materialType}</Text>
                    ))}
                  </View>

                  {selectedItem.description && (
                    <View style={styles.descBox}>
                      <Text style={styles.descTitle}>Descripción adjunta:</Text>
                      <Text style={styles.descText}>"{selectedItem.description}"</Text>
                    </View>
                  )}

                  <Text style={styles.evidenceTitle}>Evidencia (Foto):</Text>
                  {selectedItem.proofImage ? (
                    <Image 
                      source={{ uri: `${API_BASE_URL}${selectedItem.proofImage}` }} 
                      style={styles.evidenceImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noEvidenceBox}>
                      <Text style={styles.noEvidenceText}>El usuario no adjuntó foto de evidencia.</Text>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActionsBar}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnReject]} 
                onPress={() => handleAction('reject')}
                disabled={processing}
              >
                <Text style={styles.modalBtnRejectText}>Rechazar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalBtnApprove]} 
                onPress={() => handleAction('approve')}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalBtnApproveText}>Aprobar y Asignar Puntos</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  adminBadge: { backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  adminBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: theme.spacing.m },

  validationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoContainer: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '900', color: '#0F172A', marginBottom: 2 },
  itemDetails: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  proofLink: { fontSize: 13, color: theme.colors.primary, fontWeight: 'bold', marginTop: 4, textDecorationLine: 'underline' },
  
  pointsBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pointsText: { fontSize: 14, fontWeight: '900', color: '#16A34A' },

  actionsRow: { flexDirection: 'row' },
  rejectButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
  },
  rejectButtonText: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  actionSpacing: { width: 12 },
  approveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
  },
  approveButtonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },

  emptyStateText: { fontSize: 16, fontWeight: '700', color: '#64748B', marginTop: 16 },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 12, width: '100%' },
  viewDetailsText: { fontSize: 13, fontWeight: '800', color: theme.colors.primary, textAlign: 'center', paddingVertical: 4 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end', // Para que salga desde abajo en iOS/Android
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    maxHeight: '90%',
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  closeButton: { padding: 4 },
  closeButtonText: { fontSize: 20, fontWeight: 'bold', color: '#64748B' },
  modalScroll: { padding: 20 },
  modalBody: { paddingBottom: 40 },
  modalSubtitle: { fontSize: 16, color: '#0F172A', marginBottom: 16 },
  breakdownBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, marginBottom: 16 },
  breakdownTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  breakdownItem: { fontSize: 14, color: '#475569', marginBottom: 4 },
  descBox: { backgroundColor: '#FFFBEB', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  descTitle: { fontSize: 13, fontWeight: '800', color: '#B45309', marginBottom: 4 },
  descText: { fontSize: 14, color: '#78350F', fontStyle: 'italic' },
  evidenceTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  evidenceImage: { width: '100%', height: 300, borderRadius: 16, backgroundColor: '#F1F5F9' },
  noEvidenceBox: { padding: 24, backgroundColor: '#F1F5F9', borderRadius: 16, alignItems: 'center' },
  noEvidenceText: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  modalActionsBar: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF'
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBtnReject: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginRight: 12
  },
  modalBtnRejectText: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  modalBtnApprove: {
    backgroundColor: '#0F172A',
  },
  modalBtnApproveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' }
});
