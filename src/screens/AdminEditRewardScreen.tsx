import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { rewardService } from '../api/services/reward.service';
import { Reward } from '../types';

export const AdminEditRewardScreen = ({ route, navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const { rewardId } = route.params || {};
  const isEditing = !!rewardId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState('');
  const [stock, setStock] = useState('-1');
  const [isActive, setIsActive] = useState(true);
  
  const [iconName, setIconName] = useState('Gift');
  const [iconColor, setIconColor] = useState('#D97706');
  const [iconBg, setIconBg] = useState('#FEF3C7');

  useEffect(() => {
    if (isEditing) {
      loadReward();
    }
  }, [isEditing]);

  const loadReward = async () => {
    setLoading(true);
    try {
      const rewards = await rewardService.getRewards();
      const reward = rewards.find((r: Reward) => r._id === rewardId);
      if (reward) {
        setTitle(reward.title);
        setDescription(reward.description || '');
        setPointsCost(reward.pointsCost.toString());
        setStock(reward.stock.toString());
        setIsActive(reward.isActive);
        setIconName(reward.iconName || 'Gift');
        setIconColor(reward.iconColor || '#D97706');
        setIconBg(reward.iconBg || '#FEF3C7');
      } else {
        Alert.alert('Error', 'No se encontró la recompensa');
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo cargar la recompensa');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    setSaving(true);
    try {
      const rewardData = {
        title,
        description,
        pointsCost: parseInt(pointsCost) || 0,
        stock: parseInt(stock) || -1,
        isActive,
        iconName,
        iconColor,
        iconBg
      };

      if (isEditing) {
        await rewardService.updateReward(rewardId, rewardData);
        Alert.alert('Éxito', 'Recompensa actualizada correctamente');
      } else {
        await rewardService.createReward(rewardData);
        Alert.alert('Éxito', 'Recompensa creada correctamente');
      }
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Editar recompensa' : 'Nueva recompensa'}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Nombre de la recompensa</Text>
            <TextInput 
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Kit Universitario"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción</Text>
            <TextInput 
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Ej: Incluye camiseta y libreta"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Costo en puntos</Text>
            <TextInput 
              style={styles.input}
              value={pointsCost}
              onChangeText={setPointsCost}
              keyboardType="numeric"
              placeholder="Ej: 500"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Cantidad disponible (Stock)</Text>
            <TextInput 
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholder="Ej: 10 (-1 para ilimitado)"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Ícono (Nombre Lucide)</Text>
            <TextInput 
              style={styles.input}
              value={iconName}
              onChangeText={setIconName}
              placeholder="Ej: Gift, Award, Trophy"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={{flexDirection: 'row', gap: 16}}>
            <View style={[styles.formGroup, {flex: 1}]}>
              <Text style={styles.label}>Color Ícono</Text>
              <TextInput 
                style={styles.input}
                value={iconColor}
                onChangeText={setIconColor}
                placeholder="Ej: #D97706"
              />
            </View>
            <View style={[styles.formGroup, {flex: 1}]}>
              <Text style={styles.label}>Fondo Ícono</Text>
              <TextInput 
                style={styles.input}
                value={iconBg}
                onChangeText={setIconBg}
                placeholder="Ej: #FEF3C7"
              />
            </View>
          </View>

          <View style={styles.switchGroup}>
            <View>
              <Text style={styles.switchLabel}>Estado de recompensa</Text>
              <Text style={styles.switchSubtitle}>{isActive ? 'Activa y visible para canje' : 'Inactiva, oculta para usuarios'}</Text>
            </View>
            <Switch 
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#E2E8F0', true: '#10B981' }}
              thumbColor={'#FFFFFF'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, saving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{isEditing ? 'Guardar Cambios' : 'Crear Recompensa'}</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.m, paddingTop: theme.spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  title: { fontSize: 22, fontWeight: '900', color: colors.text },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    color: colors.text,
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  switchLabel: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 2 },
  switchSubtitle: { fontSize: 12, color: colors.textSecondary },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
});
