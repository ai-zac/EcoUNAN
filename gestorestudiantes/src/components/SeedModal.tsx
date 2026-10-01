import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { Database, Zap, Sparkles, X, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (count: number) => Promise<void>;
  loading: boolean;
}

const PRESETS = [
  { label: '10', value: 10 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
  { label: '500', value: 500 },
  { label: '1,000', value: 1000 },
  { label: '2,000', value: 2000 },
  { label: '3,000', value: 3000 },
  { label: '5,000', value: 5000 },
];

export const SeedModal: React.FC<Props> = ({
  visible,
  onClose,
  onConfirm,
  loading,
}) => {
  const [selectedCount, setSelectedCount] = useState<number>(3000);

  const handleExecute = async () => {
    await onConfirm(selectedCount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={loading ? undefined : onClose}
      >
        <TouchableWithoutFeedback>
          <View style={styles.modalCard}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Database size={22} color="#38BDF8" />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Seleccionar cantidad de inserciones</Text>
                  <Text style={styles.subtitle}>Generador de estudiantes en MongoDB Atlas</Text>
                </View>
              </View>

              {!loading && (
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <X size={20} color="#CBD5E1" strokeWidth={2.5} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.body}>
              <Text style={styles.sectionLabel}>
                Selecciona la cantidad de estudiantes a insertar:
              </Text>

              <View style={styles.presetGrid}>
                {PRESETS.map((preset) => {
                  const isSelected = selectedCount === preset.value;
                  return (
                    <TouchableOpacity
                      key={preset.value}
                      style={[
                        styles.presetCard,
                        isSelected && styles.presetCardActive,
                      ]}
                      onPress={() => setSelectedCount(preset.value)}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.presetValue,
                          isSelected && styles.presetValueActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Check size={14} color="#06B6D4" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.infoBanner}>
                <Sparkles size={18} color="#38BDF8" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.infoTitle}>Actualización de Base de Datos</Text>
                  <Text style={styles.infoText}>
                    La colección se renovará con {selectedCount.toLocaleString()} registros
                    con carnets, facultades y correos institucionales únicos.
                  </Text>
                </View>
              </View>

              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#06B6D4" />
                  <Text style={styles.loadingTitle}>
                    Insertando {selectedCount.toLocaleString()} estudiantes en MongoDB...
                  </Text>
                  <Text style={styles.loadingSubtitle}>
                    Procesando lotes en gestor_estudiantes...
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={loading}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, loading && { opacity: 0.6 }]}
                onPress={handleExecute}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#06B6D4', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmGradient}
                >
                  <Zap size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.confirmText}>
                    {loading
                      ? 'Procesando...'
                      : `Insertar ${selectedCount.toLocaleString()} Estudiantes`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#071328',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    zIndex: 10,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  presetCard: {
    width: '23%',
    height: 52,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  presetCardActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    borderColor: '#06B6D4',
  },
  presetValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  presetValueActive: {
    color: '#38BDF8',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  infoText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 18,
    marginTop: 8,
  },
  loadingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 12,
  },
  loadingSubtitle: {
    fontSize: 12,
    color: '#06B6D4',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#050D1C',
  },
  cancelButton: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  confirmText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
