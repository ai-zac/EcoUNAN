import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import {
  ArrowLeft, Edit, Power, Trash2, Plus, GlassWater, Coffee,
  FileText, Package, Droplet, Recycle, Layers, Box, Check
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { MaterialService, MaterialItem } from '../api/services/material.service';

interface MaterialForm {
  _id?: string;
  name: string;
  key: string;
  pointsPerKg: string;
  unit: string;
  icon: string;
  color: string;
  bg: string;
  description: string;
}

const AVAILABLE_ICONS = [
  { name: 'GlassWater', component: GlassWater, label: 'Botella' },
  { name: 'Coffee', component: Coffee, label: 'Lata' },
  { name: 'FileText', component: FileText, label: 'Papel' },
  { name: 'Package', component: Package, label: 'Cartón' },
  { name: 'Droplet', component: Droplet, label: 'Plástico' },
  { name: 'Recycle', component: Recycle, label: 'Reciclaje' },
  { name: 'Layers', component: Layers, label: 'Capas' },
  { name: 'Box', component: Box, label: 'Caja' },
];

const AVAILABLE_PALETTES = [
  { color: '#10B981', bg: '#D1FAE5', label: 'Esmeralda' },
  { color: '#3B82F6', bg: '#EFF6FF', label: 'Azul' },
  { color: '#8B5CF6', bg: '#EDE9FE', label: 'Púrpura' },
  { color: '#F59E0B', bg: '#FEF3C7', label: 'Ámbar' },
  { color: '#EF4444', bg: '#FEE2E2', label: 'Rojo' },
  { color: '#06B6D4', bg: '#CFFAFE', label: 'Cian' },
];

const EMPTY_FORM: MaterialForm = {
  name: '',
  key: '',
  pointsPerKg: '',
  unit: 'kg',
  icon: 'Recycle',
  color: '#10B981',
  bg: '#D1FAE5',
  description: '',
};

export const AdminMaterialsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MaterialForm>(EMPTY_FORM);

  const fetchMaterials = async (silent: boolean = false) => {
    try {
      const data = await MaterialService.getAllMaterialsAdmin();
      setMaterials(data);
    } catch (error) {
      if (!silent) {
        console.error(error);
        Alert.alert('Error', 'No se pudieron cargar los materiales');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials(false);
    const unsubscribe = navigation?.addListener ? navigation.addListener('focus', () => fetchMaterials(true)) : null;
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigation]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (item: MaterialItem) => {
    setForm({
      _id: item._id,
      name: item.name,
      key: item.key,
      pointsPerKg: String(item.pointsPerKg),
      unit: item.unit || 'kg',
      icon: item.icon || 'Recycle',
      color: item.color || '#10B981',
      bg: item.bg || '#D1FAE5',
      description: item.description || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa el nombre del material.');
      return;
    }

    const pointsNum = parseFloat(form.pointsPerKg.replace(',', '.'));
    if (!Number.isFinite(pointsNum) || pointsNum <= 0) {
      Alert.alert('Valor inválido', 'El valor en puntos debe ser un número positivo.');
      return;
    }

    setSaving(true);
    try {
      if (form._id) {
        await MaterialService.updateMaterial(form._id, {
          name: form.name.trim(),
          pointsPerKg: pointsNum,
          unit: form.unit.trim() || 'kg',
          icon: form.icon,
          color: form.color,
          bg: form.bg,
          description: form.description.trim(),
        });
        Alert.alert('Éxito', 'Material actualizado correctamente.');
      } else {
        await MaterialService.createMaterial({
          name: form.name.trim(),
          key: form.key.trim() || undefined,
          pointsPerKg: pointsNum,
          unit: form.unit.trim() || 'kg',
          icon: form.icon,
          color: form.color,
          bg: form.bg,
          description: form.description.trim(),
        });
        Alert.alert('Éxito', 'Nuevo material creado correctamente.');
      }
      setModalVisible(false);
      fetchMaterials(true);
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.error || error?.message || 'Error al guardar el material.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: MaterialItem) => {
    try {
      await MaterialService.toggleMaterialStatus(item._id);
      fetchMaterials(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cambiar el estado del material.');
    }
  };

  const handleDelete = (item: MaterialItem) => {
    Alert.alert(
      'Eliminar Material',
      `¿Estás seguro de que deseas eliminar permanentemente el material "${item.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await MaterialService.deleteMaterial(item._id);
              fetchMaterials(true);
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar el material.');
            }
          },
        },
      ]
    );
  };

  const renderIcon = (iconName: string, color: string) => {
    const found = AVAILABLE_ICONS.find(i => i.name === iconName);
    const Comp = found ? found.component : Recycle;
    return <Comp size={22} color={color} />;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.title}>Materiales y Precios</Text>
          <Text style={styles.headerSubtitle}>Valores de canje y configuración</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreate} activeOpacity={0.8}>
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.addButtonText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando materiales...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.sectionTitle}>Materiales registrados ({materials.length})</Text>

          {materials.map((item) => (
            <View key={item._id} style={[styles.card, !item.isActive && styles.cardInactive]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: item.bg || '#D1FAE5' }]}>
                  {renderIcon(item.icon, item.color || '#10B981')}
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={[styles.statusBadge, item.isActive ? styles.badgeActive : styles.badgeInactive]}>
                      <Text style={[styles.statusText, item.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                        {item.isActive ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>
                    Clave: <Text style={styles.cardSubBold}>{item.key}</Text>
                  </Text>
                  <Text style={styles.cardPoints}>
                    +{item.pointsPerKg} EcoPoints / {item.unit || 'kg'}
                  </Text>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.editBtn]}
                  onPress={() => openEdit(item)}
                  activeOpacity={0.7}
                >
                  <Edit size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.toggleBtn]}
                  onPress={() => handleToggle(item)}
                  activeOpacity={0.7}
                >
                  <Power size={16} color={item.isActive ? '#F59E0B' : '#10B981'} style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: item.isActive ? '#F59E0B' : '#10B981' }]}>
                    {item.isActive ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(item)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color="#EF4444" style={{ marginRight: 6 }} />
                  <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {form._id ? 'Editar Material' : 'Nuevo Material'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Configura los puntos por unidad de peso y detalles del material
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              <Text style={styles.inputLabel}>Nombre del material *</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(text) => setForm(f => ({ ...f, name: text }))}
                placeholder="Ej. Vidrio transparente"
                placeholderTextColor="#94A3B8"
              />

              {!form._id && (
                <>
                  <Text style={styles.inputLabel}>Clave identificadora (opcional)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.key}
                    onChangeText={(text) => setForm(f => ({ ...f, key: text }))}
                    placeholder="Ej. vidrio (autogenerada si está vacía)"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </>
              )}

              <View style={styles.rowInputs}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Puntos por unidad *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.pointsPerKg}
                    onChangeText={(text) => setForm(f => ({ ...f, pointsPerKg: text }))}
                    placeholder="Ej. 12"
                    placeholderTextColor="#94A3B8"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ width: 110 }}>
                  <Text style={styles.inputLabel}>Unidad</Text>
                  <TextInput
                    style={styles.input}
                    value={form.unit}
                    onChangeText={(text) => setForm(f => ({ ...f, unit: text }))}
                    placeholder="kg"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Icono representativo</Text>
              <View style={styles.iconChipsRow}>
                {AVAILABLE_ICONS.map(i => {
                  const Comp = i.component;
                  const isSelected = form.icon === i.name;
                  return (
                    <TouchableOpacity
                      key={i.name}
                      style={[styles.iconChip, isSelected && styles.iconChipSelected]}
                      onPress={() => setForm(f => ({ ...f, icon: i.name }))}
                    >
                      <Comp size={18} color={isSelected ? colors.primary : colors.textSecondary} />
                      <Text style={[styles.iconChipText, isSelected && styles.iconChipTextSelected]}>
                        {i.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Color temático</Text>
              <View style={styles.paletteRow}>
                {AVAILABLE_PALETTES.map(p => {
                  const isSelected = form.color === p.color;
                  return (
                    <TouchableOpacity
                      key={p.color}
                      style={[styles.paletteCircle, { backgroundColor: p.color }]}
                      onPress={() => setForm(f => ({ ...f, color: p.color, bg: p.bg }))}
                    >
                      {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Descripción o instrucciones (opcional)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={form.description}
                onChangeText={(text) => setForm(f => ({ ...f, description: text }))}
                placeholder="Ej. Botellas de vidrio limpias sin tapas..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: colors.surface,
  },
  headerTextWrapper: { flex: 1 },
  title: { fontSize: 20, fontWeight: '900', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  container: { padding: 16, paddingBottom: 60 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.textSecondary },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...theme.shadows.soft,
  },
  cardInactive: { opacity: 0.65 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  cardTitle: { fontSize: 17, fontWeight: '900', color: colors.text, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeActive: { backgroundColor: '#DCFCE7' },
  badgeInactive: { backgroundColor: '#F1F5F9' },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusTextActive: { color: '#15803D' },
  statusTextInactive: { color: '#64748B' },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  cardSubBold: { fontWeight: '700', color: colors.text },
  cardPoints: { fontSize: 15, fontWeight: '900', color: colors.primary, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },

  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  editBtn: { borderColor: '#BFDBFE' },
  toggleBtn: { borderColor: '#FDE68A' },
  deleteBtn: { borderColor: '#FECACA' },
  actionBtnText: { fontSize: 12, fontWeight: '800' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: { marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: colors.text },
  modalSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  formScroll: { paddingBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  inputMultiline: { height: 75, textAlignVertical: 'top' },
  rowInputs: { flexDirection: 'row', alignItems: 'center' },

  iconChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  iconChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 6,
  },
  iconChipSelected: { borderColor: colors.primary, backgroundColor: '#DCFCE7' },
  iconChipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  iconChipTextSelected: { color: colors.primary, fontWeight: '800' },

  paletteRow: { flexDirection: 'row', gap: 12, marginTop: 6, marginBottom: 4 },
  paletteCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: colors.text },
  saveBtn: { backgroundColor: colors.primary },
  saveBtnText: { fontSize: 15, fontWeight: '900', color: '#FFFFFF' },
});
