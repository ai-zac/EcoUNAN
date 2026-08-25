import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Share } from 'react-native';
import { ArrowLeft, ChevronDown, X } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

const MATERIALS = [
  { id: 'pet', name: 'Botella PET' },
  { id: 'aluminio', name: 'Lata de aluminio' },
  { id: 'papel', name: 'Papel' },
  { id: 'carton', name: 'Cartón' },
  { id: 'plastico', name: 'Plástico' },
];

export const AdminGenerateQRScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [materialIndex, setMaterialIndex] = useState(0);
  const [cantidad, setCantidad] = useState('3');
  const [showDropdown, setShowDropdown] = useState(false);

  const selectedMaterial = MATERIALS[materialIndex];
  const points = (Number(cantidad) || 0) * 10;
  
  const qrData = JSON.stringify({
    type: 'eco-unan-qr',
    material: selectedMaterial.id,
    weight: Number(cantidad) || 0,
    timestamp: Date.now()
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Generar código QR</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Configuración</Text>
        
        <Text style={styles.label}>Material</Text>
        <TouchableOpacity style={styles.inputContainer} onPress={() => setShowDropdown(true)}>
          <Text style={styles.inputText}>{selectedMaterial.name}</Text>
          <ChevronDown size={20} color="#64748B" />
        </TouchableOpacity>

        <Text style={styles.label}>Cantidad</Text>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.textInput}
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.calculatedPoints}>
          <Text style={styles.calculatedLabel}>Puntos calculados</Text>
          <Text style={styles.calculatedValue}>{points} PUNTOS</Text>
        </View>

        <View style={styles.qrCard}>
          <View style={styles.qrPlaceholder}>
            <QRCode value={qrData} size={140} color="#0F172A" backgroundColor="transparent" />
          </View>
          <Text style={styles.qrCodeLabel}>CÓDIGO DE VALIDACIÓN</Text>
          <Text style={styles.qrCodeValue}>{selectedMaterial.id.toUpperCase()}-{cantidad}KG</Text>
          <Text style={styles.qrHelpText}>
            Entrega este código al estudiante para validar su reciclaje.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, { marginTop: theme.spacing.m }]}
          onPress={async () => {
            try {
              await Share.share({
                message: `Código QR para reciclar: ${selectedMaterial.id.toUpperCase()}-${cantidad}KG\nValidez: Este código puede ser escaneado por estudiantes.`,
              });
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }}
        >
          <Text style={styles.actionButtonText}>Compartir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { marginTop: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
          onPress={() => {
            setMaterialIndex(0);
            setCantidad('3');
          }}
        >
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Generar otro</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Material</Text>
              <TouchableOpacity onPress={() => setShowDropdown(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {MATERIALS.map((mat, idx) => (
                <TouchableOpacity
                  key={mat.id}
                  style={[styles.modalItem, materialIndex === idx && styles.modalItemSelected]}
                  onPress={() => {
                    setMaterialIndex(idx);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={[styles.modalItemText, materialIndex === idx && styles.modalItemTextSelected]}>
                    {mat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  adminBadge: { backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  adminBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: theme.spacing.m },

  label: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  inputText: { fontSize: 16, color: colors.text },
  textInput: { flex: 1, fontSize: 16, color: colors.text, height: '100%' },

  calculatedPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  calculatedLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  calculatedValue: { fontSize: 20, fontWeight: '900', color: colors.text },

  qrCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrCodeLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, letterSpacing: 1, marginBottom: 4 },
  qrCodeValue: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 12 },
  qrHelpText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  actionButtonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemSelected: {
    backgroundColor: '#F1F5F9',
  },
  modalItemText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  modalItemTextSelected: { color: colors.primary, fontWeight: '800' },
});
