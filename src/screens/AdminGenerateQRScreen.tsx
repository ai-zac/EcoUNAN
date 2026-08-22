import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, ChevronDown } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../theme/theme';

const MATERIALS = [
  { id: 'pet', name: 'Botella PET' },
  { id: 'aluminio', name: 'Lata de aluminio' },
  { id: 'papel', name: 'Papel' },
  { id: 'carton', name: 'Cartón' },
  { id: 'plastico', name: 'Plástico' },
];

export const AdminGenerateQRScreen = ({ navigation }: any) => {
  const [materialIndex, setMaterialIndex] = useState(0);
  const [cantidad, setCantidad] = useState('3');

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
        <TouchableOpacity style={styles.inputContainer} onPress={() => setMaterialIndex((prev) => (prev + 1) % MATERIALS.length)}>
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

        <TouchableOpacity style={[styles.actionButton, { marginTop: theme.spacing.m }]}>
          <Text style={styles.actionButtonText}>Compartir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, { marginTop: 12 }]}>
          <Text style={styles.actionButtonText}>Generar otro</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  adminBadge: { backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8 },
  adminBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A', marginBottom: theme.spacing.m },

  label: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  inputText: { fontSize: 16, color: '#475569' },
  textInput: { flex: 1, fontSize: 16, color: '#0F172A', height: '100%' },

  calculatedPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  calculatedLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  calculatedValue: { fontSize: 20, fontWeight: '900', color: '#0F172A' },

  qrCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.soft,
  },
  qrPlaceholder: {
    width: 160,
    height: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qrCodeLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', letterSpacing: 1, marginBottom: 4 },
  qrCodeValue: { fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 12 },
  qrHelpText: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },

  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 16,
  },
  actionButtonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
});
