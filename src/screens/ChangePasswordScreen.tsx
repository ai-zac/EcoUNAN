import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { ArrowLeft, Lock } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { userService } from '../api/services/user.service';

export const ChangePasswordScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Completa los tres campos para continuar.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Contraseña débil', 'La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('No coinciden', 'La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      Alert.alert(
        'Éxito',
        'Tu contraseña fue actualizada correctamente.',
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Encabezado visual */}
          <View style={styles.hero}>
            <View style={styles.iconBox}>
              <Lock size={26} color={colors.accent} />
            </View>
            <Text style={styles.heroTitle}>Seguridad de tu cuenta</Text>
            <Text style={styles.heroSubtitle}>
              Usa una contraseña de al menos 8 caracteres que no uses en otros sitios.
            </Text>
          </View>

          <Input
            label="Contraseña actual"
            placeholder="••••••••"
            isPassword
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <Input
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            isPassword
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Input
            label="Confirmar nueva contraseña"
            placeholder="••••••••"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button
            title="Actualizar contraseña"
            loading={loading}
            onPress={handleSubmit}
            style={{ marginTop: theme.spacing.l }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.s,
    paddingBottom: theme.spacing.m,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...theme.typography.h3 },
  container: { padding: theme.spacing.m, paddingBottom: 60 },

  hero: { alignItems: 'center', marginBottom: theme.spacing.xl, marginTop: theme.spacing.s },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
    ...theme.shadows.soft,
  },
  heroTitle: { ...theme.typography.h3, marginBottom: 4 },
  heroSubtitle: { ...theme.typography.bodySecondary, textAlign: 'center', paddingHorizontal: theme.spacing.l },
});
