import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, RefreshControl } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ArrowLeft, GlassWater, FileText, CheckCircle, Package, Droplet, Coffee, QrCode, ImageOff, User } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { AdminService } from '../api/services/admin.service';
import { RecycleService } from '../api/services/recycle.service';
import { API_BASE_URL, assetUrl } from '../api/apiClient';
import { showToast } from '../components/Toast';

export const AdminRecyclesScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [validations, setValidations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de detalles
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Modal de QR de aprobacion presencial
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [approvalQrData, setApprovalQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const data = await AdminService.getPendingRecycles();
      setValidations(data);
    } catch (error) {
      console.error(error);
      showToast('No se pudieron cargar las validaciones', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPending();
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedItem) return;
    const id = selectedItem._id;
    setProcessing(true);
    try {
      if (action === 'approve') {
        await AdminService.validateRecycle(id);
        showToast('Reciclaje aprobado y puntos asignados', 'success');
      } else {
        await AdminService.rejectRecycle(id);
        showToast('Solicitud rechazada', 'info');
      }
      setValidations(prev => prev.filter(item => item._id !== id));
      setDetailsModalVisible(false);
    } catch (error) {
      showToast(`No se pudo ${action === 'approve' ? 'aprobar' : 'rechazar'}`, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateApprovalQr = async () => {
    if (!selectedItem) return;
    setQrLoading(true);
    try {
      const qrData = await RecycleService.getApprovalQr(selectedItem._id);
      setApprovalQrData(qrData);
      setDetailsModalVisible(false);
      setQrModalVisible(true);
    } catch (error: any) {
      showToast(error?.response?.data?.error || 'No se pudo generar el QR', 'error');
    } finally {
      setQrLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
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
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Validar reciclaje</Text>
        <View style={[styles.adminBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.adminBadgeText, { color: '#FFFFFF' }]}>ADMIN</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Text style={styles.sectionTitle}>Validaciones pendientes</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : validations.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={48} color={colors.accent} />
            <Text style={styles.emptyStateText}>No hay validaciones pendientes</Text>
          </View>
        ) : (
          validations.map((item) => {
            const itemsToRender = item.items && item.items.length > 0
              ? item.items
              : [{ materialType: item.materialType || 'pet', weight: item.weight || 0 }];
            const displayTotalPoints = item.totalPoints || 0;
            const displayTotalWeight = item.totalWeight || 0;
            const isInperson = item.validationMode === 'inperson';

            return (
              <TouchableOpacity
                key={item._id}
                style={styles.validationCard}
                onPress={() => {
                  setSelectedItem(item);
                  setImageError(false);
                  setDetailsModalVisible(true);
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconBg}>
                    {getIconForType(itemsToRender[0]?.materialType)}
                  </View>
                  <View style={styles.infoContainer}>
                    <Text style={styles.itemName}>{item.user?.name || 'Usuario'}</Text>
                    <Text style={styles.itemDetails}>{displayTotalWeight} kg • {new Date(item.createdAt).toLocaleDateString()}</Text>
                    <Text style={[styles.modeTag, isInperson ? styles.modeInperson : styles.modePhoto]}>
                      {isInperson ? 'Entrega presencial (QR)' : 'Evidencia por foto'}
                    </Text>
                  </View>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>+{displayTotalPoints} pts</Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <Text style={styles.viewDetailsText}>Toca para revisar y gestionar</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ---------- Modal de Detalles y Evidencia ---------- */}
      <Modal animationType="slide" transparent visible={detailsModalVisible} onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Revisar Reciclaje</Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedItem && (
                <View style={styles.modalBody}>
                  {(() => {
                    const evidenceUri = assetUrl(selectedItem.proofImage);
                    return (
                      <>
                        <View style={styles.userRow}>
                          <User size={16} color={colors.textSecondary} />
                          <Text style={styles.modalSubtitle}>{selectedItem.user?.name || 'Usuario'}</Text>
                        </View>

                        <View style={styles.breakdownBox}>
                          <Text style={styles.breakdownTitle}>Materiales entregados:</Text>
                          {((selectedItem.items && selectedItem.items.length > 0)
                            ? selectedItem.items
                            : [{ materialType: selectedItem.materialType || 'pet', weight: selectedItem.weight || 0 }]
                          ).map((i: any, idx: number) => (
                            <Text key={idx} style={styles.breakdownItem}>• {i.weight}kg de {i.materialType}</Text>
                          ))}
                        </View>

                        {!!selectedItem.description && (
                          <View style={styles.descBox}>
                            <Text style={styles.descTitle}>Descripción adjunta:</Text>
                            <Text style={styles.descText}>"{selectedItem.description}"</Text>
                          </View>
                        )}

                        <Text style={styles.evidenceTitle}>Evidencia (Foto):</Text>
                        {evidenceUri && !imageError ? (
                          <>
                            <Image
                              source={{ uri: evidenceUri }}
                              style={styles.evidenceImage}
                              resizeMode="cover"
                              onError={() => {
                                setImageError(true);
                                showToast('No se pudo cargar la imagen de evidencia', 'error');
                              }}
                            />
                            <Text style={styles.evidenceHint}>{evidenceUri}</Text>
                          </>
                        ) : (
                          <View style={styles.noEvidenceBox}>
                            <ImageOff size={28} color={imageError ? '#EF4444' : colors.textSecondary} />
                            <Text style={styles.noEvidenceText}>
                              {imageError
                                ? 'La imagen no está disponible (archivo perdido o URL inválida).'
                                : selectedItem.validationMode === 'inperson'
                                ? 'Entrega presencial: no requiere foto. Verifica físicamente y genera el QR.'
                                : 'El usuario no adjuntó foto de evidencia.'}
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>
              )}
            </ScrollView>

            {/* Barra de acciones fija: sin solapamientos ni flotantes */}
            <View style={styles.modalActionsBar}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnReject]}
                onPress={() => handleAction('reject')}
                disabled={processing}
              >
                <Text style={styles.modalBtnRejectText}>Rechazar</Text>
              </TouchableOpacity>

              {selectedItem?.validationMode === 'inperson' ? (
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnApprove]}
                  onPress={handleGenerateApprovalQr}
                  disabled={processing || qrLoading}
                >
                  {qrLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <View style={styles.btnContentRow}>
                      <QrCode size={17} color="#FFFFFF" />
                      <Text style={styles.modalBtnApproveText}>Generar QR</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnApprove]}
                  onPress={() => handleAction('approve')}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalBtnApproveText}>Aprobar</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ---------- Modal QR de Aprobacion Presencial ---------- */}
      <Modal animationType="fade" transparent visible={qrModalVisible} onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.qrOverlay}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>QR de Aprobación</Text>
            <Text style={styles.qrSubtitle}>
              Pídele al estudiante que escanee este código con su cámara.
            </Text>

            <View style={styles.qrBox}>
              {approvalQrData ? (
                <QRCode value={approvalQrData} size={220} backgroundColor="#FFFFFF" />
              ) : (
                <ActivityIndicator size="large" color={colors.accent} />
              )}
            </View>

            <Text style={styles.qrHint}>⏱ El código expira en 10 minutos.</Text>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnApprove, styles.qrDoneBtn]}
              onPress={() => {
                setQrModalVisible(false);
                fetchPending();
              }}
            >
              <Text style={styles.modalBtnApproveText}>Listo, ya lo escaneó</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text, flex: 1 },
  adminBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  adminBadgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: theme.spacing.m },

  validationCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBg: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  infoContainer: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: 2 },
  itemDetails: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  modeInperson: { color: '#2563EB' },
  modePhoto: { color: '#D97706' },
  modeTag: { fontSize: 11, fontWeight: '800', marginTop: 2 },

  pointsBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pointsText: { fontSize: 14, fontWeight: '900', color: '#16A34A' },

  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyStateText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary, marginTop: 16 },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  viewDetailsText: { fontSize: 13, fontWeight: '800', color: colors.accent, textAlign: 'center' },

  // ---- Modal de detalles ----
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: colors.text, flex: 1, paddingRight: 8 },
  closeButton: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  closeButtonText: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary },
  modalScroll: { flexGrow: 0 },
  modalBody: { padding: 20, paddingBottom: 24 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  modalSubtitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  breakdownBox: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 16 },
  breakdownTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  breakdownItem: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  descBox: { backgroundColor: '#FFFBEB', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  descTitle: { fontSize: 13, fontWeight: '800', color: '#B45309', marginBottom: 4 },
  descText: { fontSize: 14, color: '#78350F', fontStyle: 'italic' },
  evidenceTitle: { fontSize: 14, fontWeight: '900', color: colors.text, marginBottom: 12 },
  evidenceImage: { width: '100%', height: 280, borderRadius: 16, backgroundColor: colors.surface },
  evidenceHint: { fontSize: 10, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  noEvidenceBox: { padding: 24, backgroundColor: colors.surface, borderRadius: 16, alignItems: 'center', gap: 10 },
  noEvidenceText: { fontSize: 14, color: colors.textSecondary, fontWeight: '500', textAlign: 'center' },

  // Barra de acciones inferior FIJA dentro del modal (no flota ni se solapa)
  modalActionsBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalBtn: {
    flex: 1,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnContentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalBtnReject: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalBtnRejectText: { fontSize: 15, fontWeight: '800', color: colors.text },
  modalBtnApprove: { backgroundColor: colors.primary },
  modalBtnApproveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },

  // ---- Modal QR ----
  qrOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  qrCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  qrTitle: { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  qrSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  qrBox: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHint: { fontSize: 12, marginTop: 12, marginBottom: 20 },
  qrDoneBtn: { width: '100%' },
});
