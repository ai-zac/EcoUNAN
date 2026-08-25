import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { ArrowLeft, Edit, EyeOff, Power, Trash2, Target } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { AdminService } from '../api/services/admin.service';
import { Goal } from '../types';

interface GoalForm {
  _id?: string;
  title: string;
  description: string;
  targetRecycles: string;
  rewardPoints: string;
  endDate: string;
}

const EMPTY_FORM: GoalForm = { title: '', description: '', targetRecycles: '', rewardPoints: '', endDate: '' };

export const AdminGoalsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<GoalForm>(EMPTY_FORM);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await AdminService.getGoalsAdmin();
      setGoals(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar las metas');
    } finally {
      setLoading(false);
    }
  };

  const daysLeft = (endDate: string): number =>
    Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (goal: Goal) => {
    setForm({
      _id: goal._id,
      title: goal.title,
      description: goal.description,
      targetRecycles: String(goal.targetRecycles),
      rewardPoints: String(goal.rewardPoints),
      endDate: new Date(goal.endDate).toISOString().slice(0, 10),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.targetRecycles || !form.rewardPoints || !form.endDate) {
      Alert.alert('Campos incompletos', 'Todos los campos son obligatorios.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.endDate)) {
      Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      targetRecycles: Number(form.targetRecycles),
      rewardPoints: Number(form.rewardPoints),
      endDate: form.endDate,
    };

    setSaving(true);
    try {
      if (form._id) {
        const updated = await AdminService.updateGoal(form._id, payload);
        setGoals(prev => prev.map(g => (g._id === form._id ? updated : g)));
      } else {
        const created = await AdminService.createGoal(payload);
        setGoals(prev => [created, ...prev]);
      }
      setModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo guardar la meta');
    } finally {
      setSaving(false);
    }
  };

  const toggleGoalStatus = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await AdminService.updateGoal(id, { isActive: !currentStatus });
      setGoals(prev => prev.map(g => (g._id === id ? updated : g)));
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const deleteGoal = (id: string) => {
    Alert.alert('Confirmar', '¿Estás seguro de eliminar esta meta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await AdminService.deleteGoal(id);
            setGoals(prev => prev.filter(g => g._id !== id));
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar la meta');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Metas</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreate}>
          <Text style={styles.addButtonText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Metas registradas</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : goals.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: colors.textSecondary }}>
            No hay metas.
          </Text>
        ) : (
          goals.map((item) => {
            const dias = daysLeft(item.endDate);
            const vencida = dias <= 0;
            return (
              <View key={item._id} style={styles.goalCard}>
                <View style={styles.cardHeader}>
                  <View style={[styles.goalIcon, item.isActive && !vencida && styles.goalIconActive]}>
                    <Target size={18} color={item.isActive ? colors.accent : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.goalName}>{item.title}</Text>
                    <Text style={styles.goalDetails} numberOfLines={2}>{item.description}</Text>
                    <Text style={styles.goalMeta}>
                      {item.targetRecycles} reciclajes • {item.rewardPoints} pts •{' '}
                      {vencida ? 'vencida' : `vence en ${dias} día${dias === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: vencida ? colors.surface : item.isActive ? '#DCFCE7' : colors.surface },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: vencida ? colors.textSecondary : item.isActive ? '#16A34A' : colors.textSecondary },
                      ]}
                    >
                      {vencida ? 'Vencida' : item.isActive ? 'Activa' : 'Inactiva'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => openEdit(item)}>
                    <Edit size={16} color={colors.text} style={styles.actionIcon} />
                    <Text style={styles.actionText}>Editar</Text>
                  </TouchableOpacity>
                  <View style={styles.actionSpacing} />
                  <TouchableOpacity
                    style={styles.actionButton}
                    disabled={vencida}
                    onPress={() => toggleGoalStatus(item._id, item.isActive)}
                  >
                    {item.isActive ? (
                      <EyeOff size={16} color={colors.text} style={styles.actionIcon} />
                    ) : (
                      <Power size={16} color={colors.text} style={styles.actionIcon} />
                    )}
                    <Text style={styles.actionText}>{item.isActive ? 'Ocultar' : 'Activar'}</Text>
                  </TouchableOpacity>
                  <View style={styles.actionSpacing} />
                  <TouchableOpacity style={[styles.actionButton, { borderColor: '#FECACA' }]} onPress={() => deleteGoal(item._id)}>
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal crear / editar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{form._id ? 'Editar meta' : 'Nueva meta'}</Text>

            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor={colors.textSecondary}
              value={form.title}
              onChangeText={(t) => setForm(f => ({ ...f, title: t }))}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Descripción"
              placeholderTextColor={colors.textSecondary}
              multiline
              value={form.description}
              onChangeText={(t) => setForm(f => ({ ...f, description: t }))}
            />
            <View style={styles.rowTwo}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Reciclajes"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={form.targetRecycles}
                onChangeText={(t) => setForm(f => ({ ...f, targetRecycles: t.replace(/[^0-9]/g, '') }))}
              />
              <View style={{ width: 10 }} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Puntos"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={form.rewardPoints}
                onChangeText={(t) => setForm(f => ({ ...f, rewardPoints: t.replace(/[^0-9]/g, '') }))}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Fecha fin (AAAA-MM-DD)"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              value={form.endDate}
              onChangeText={(t) => setForm(f => ({ ...f, endDate: t }))}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalBtnSaveText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
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
  addButton: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addButtonText: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: colors.text, marginBottom: theme.spacing.m },

  goalCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  goalIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  goalIconActive: { backgroundColor: '#D1FAE5' },
  goalName: { fontSize: 17, fontWeight: '900', color: colors.text, marginBottom: 2 },
  goalDetails: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  goalMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '800', color: colors.text },
  divider: { height: 1, backgroundColor: colors.surface, marginBottom: 12 },

  actionsRow: { flexDirection: 'row' },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10,
  },
  actionSpacing: { width: 8 },
  actionIcon: { marginRight: 8 },
  actionText: { fontSize: 13, fontWeight: '800', color: colors.text },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: theme.borderRadius.l,
    borderTopRightRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    gap: 12,
  },
  modalTitle: { ...theme.typography.h3, marginBottom: 4 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.s,
    paddingHorizontal: 14,
    height: 48,
    ...theme.typography.body,
  },
  inputMultiline: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  rowTwo: { flexDirection: 'row' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtn: { flex: 1, height: 52, borderRadius: theme.borderRadius.m, alignItems: 'center', justifyContent: 'center' },
  modalBtnCancel: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  modalBtnCancelText: { ...theme.typography.body, fontWeight: '700', color: colors.text },
  modalBtnSave: { backgroundColor: colors.primary },
  modalBtnSaveText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
});
