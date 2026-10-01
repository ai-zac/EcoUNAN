import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Animated, Alert, TextInput, Modal, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GlassWater, Coffee, FileText, Package, Droplet, Plus, Minus, Camera, QrCode, X } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Button } from '../components/Button';
import { RecycleService } from '../api/services/recycle.service';

interface Material {
  id: string;
  name: string;
  points: number;
  icon: any;
  color: string;
  bg: string;
}

const MATERIALS: Material[] = [
  { id: 'pet', name: 'Botella PET', points: 10, icon: GlassWater, color: '#10B981', bg: '#D1FAE5' },
  { id: 'aluminio', name: 'Lata de aluminio', points: 15, icon: Coffee, color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'papel', name: 'Papel', points: 5, icon: FileText, color: '#8B5CF6', bg: '#EDE9FE' },
  { id: 'carton', name: 'Cartón', points: 8, icon: Package, color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'plastico', name: 'Plástico', points: 10, icon: Droplet, color: '#EF4444', bg: '#FEE2E2' },
];

export const RecycleScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [description, setDescription] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnims = useRef(MATERIALS.map(() => new Animated.Value(0))).current;
  const slideAnims = useRef(MATERIALS.map(() => new Animated.Value(30))).current;

  useEffect(() => {
    const animations = MATERIALS.map((_, i) => {
      return Animated.parallel([
        Animated.timing(fadeAnims[i], { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnims[i], { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ]);
    });
    Animated.stagger(100, animations).start();
  }, []);

  const handleIncrement = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: string) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
  };

  const totalPoints = MATERIALS.reduce((sum, item) => sum + (quantities[item.id] || 0) * item.points, 0);

  const handleContinue = () => {
    setModalVisible(true);
  };

  const handleValidatePhoto = async () => {
    try {
      const selected = MATERIALS.filter(m => quantities[m.id] > 0);
      
      let result;
      
      if (Platform.OS === 'web') {
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.5,
        });
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara para tomar la foto de evidencia.');
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.5,
        });
      }

      setModalVisible(false);

      if (result.canceled || !result.assets || !result.assets[0].uri) return;

      setIsSubmitting(true);
      const photoUri = result.assets[0].uri;
      
      const itemsToRegister = selected.map(item => ({
        materialType: item.id,
        weight: quantities[item.id]
      }));
      
      await RecycleService.registerRecycle(itemsToRegister, photoUri, description);
      
      navigation.navigate('RecyclePending');
    } catch (error) {
      setModalVisible(false);
      console.error(error);
      Alert.alert('Error', 'No se pudo abrir la cámara o registrar el reciclaje.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidateQR = async () => {
    
    const selected = MATERIALS.filter(m => quantities[m.id] > 0);
    if (selected.length === 0) {
      Alert.alert('Sin materiales', 'Selecciona al menos un material antes de continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsToRegister = selected.map(item => ({
        materialType: item.id,
        weight: quantities[item.id]
      }));

      await RecycleService.registerRecycle(itemsToRegister, null, description, 'inperson');
      setModalVisible(false);
      navigation.navigate('QRScanner', { awaitingApproval: true });
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo registrar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Registrar reciclaje</Text>
        <Text style={styles.subtitle}>Selecciona el material que deseas entregar y confirma la cantidad.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Tipo de material</Text>
        
        {MATERIALS.map((item, index) => {
          const Icon = item.icon;
          const qty = quantities[item.id] || 0;
          const isSelected = qty > 0;

          return (
            <Animated.View 
              key={item.id} 
              style={[
                styles.materialCard, 
                isSelected && styles.materialCardSelected,
                { opacity: fadeAnims[index], transform: [{ translateY: slideAnims[index] }] }
              ]}
            >
              <View style={styles.materialHeader}>
                <View style={styles.materialLeft}>
                  <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <View>
                    <Text style={styles.materialName}>{item.name}</Text>
                    <Text style={styles.materialPoints}>+{item.points} puntos c/u</Text>
                  </View>
                </View>

                {isSelected ? (
                  <View style={styles.stepper}>
                    <TouchableOpacity onPress={() => handleDecrement(item.id)} style={styles.stepperBtn}>
                      <Minus size={16} color={colors.accent} />
                    </TouchableOpacity>
                    <Text style={styles.stepperQty}>{qty}</Text>
                    <TouchableOpacity onPress={() => handleIncrement(item.id)} style={styles.stepperBtn}>
                      <Plus size={16} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleIncrement(item.id)} style={styles.addButton}>
                    <Plus size={20} color={colors.accent} strokeWidth={3} />
                  </TouchableOpacity>
                )}
              </View>

              {isSelected && (
                <View style={styles.materialFooter}>
                  <Text style={styles.footerText}>Obtendrás:</Text>
                  <Text style={styles.footerPoints}>+{qty * item.points} puntos</Text>
                </View>
              )}
            </Animated.View>
          );
        })}

        {totalPoints > 0 && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Notas o Descripción (Opcional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej: Entregado en el tacho del pabellón principal..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button 
          title="Continuar" 
          disabled={totalPoints === 0 || isSubmitting}
          onPress={handleContinue} 
        />
      </View>

      {}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Método de validación</Text>
            <Text style={styles.modalDescription}>¿Cómo deseas validar tu reciclaje?</Text>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.modalOptionBtn} onPress={handleValidatePhoto}>
                <View style={[styles.modalIconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Camera size={32} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionTitle}>Tomar Foto</Text>
                  <Text style={styles.modalOptionDesc}>Sube una evidencia y espera aprobación</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOptionBtn} onPress={handleValidateQR}>
                <View style={[styles.modalIconBg, { backgroundColor: '#F0FDF4' }]}>
                  <QrCode size={32} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionTitle}>Escanear QR</Text>
                  <Text style={styles.modalOptionDesc}>Escanea el código del administrador</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      {isSubmitting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Enviando evidencia...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  title: { ...theme.typography.h1, marginBottom: theme.spacing.s },
  subtitle: { ...theme.typography.bodySecondary, lineHeight: 22 },
  
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { ...theme.typography.body, fontWeight: 'bold', marginBottom: theme.spacing.m },

  materialCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    backgroundColor: colors.white,
    ...theme.shadows.soft,
  },
  materialCardSelected: {
    borderColor: colors.accent,
    backgroundColor: '#F0FDF4',
  },
  materialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  materialLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.m },
  materialName: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 2 },
  materialPoints: { fontSize: 14, color: colors.textSecondary },
  
  addButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 4, paddingVertical: 2 },
  stepperBtn: { padding: 4 },
  stepperQty: { fontSize: 16, fontWeight: 'bold', marginHorizontal: 12, color: colors.primary },

  materialFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.m, paddingTop: theme.spacing.m, borderTopWidth: 1, borderTopColor: '#BBF7D0' },
  footerText: { color: colors.textSecondary, fontWeight: '500' },
  footerPoints: { color: colors.accent, fontWeight: 'bold', fontSize: 16 },

  bottomBar: { padding: theme.spacing.m, paddingBottom: 100, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  
  descriptionContainer: { marginTop: theme.spacing.l },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    color: colors.text,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  closeModalButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalOptions: {
    width: '100%',
    gap: 16,
  },
  modalOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  modalIconBg: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalOptionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  modalOptionDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    flexWrap: 'wrap',
  },
  
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
});
