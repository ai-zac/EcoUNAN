import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { ArrowLeft, HardHat, Shield, ShieldCheck } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AdminService } from '../api/services/admin.service';
import { UserRole } from '../types';

const ROLE_CARDS: { value: UserRole; title: string; desc: string; Icon: any; color: string; bg: string }[] = [
  {
    value: 'brigadista', title: 'Brigadista', Icon: HardHat, color: '#059669', bg: '#D1FAE5',
    desc: 'Solo puede validar o rechazar reciclajes pendientes',
  },
  {
    value: 'admin', title: 'Administrador', Icon: Shield, color: '#D97706', bg: '#FEF3C7',
    desc: 'Gestiona recompensas, metas y ve el dashboard',
  },
  {
    value: 'superadmin', title: 'Super Admin', Icon: ShieldCheck, color: '#7C3AED', bg: '#EDE9FE',
    desc: 'Acceso total, incluye gestión de usuarios y roles',
  },
];

export const AdminCreateStaffScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [faculty, setFaculty] = useState('');
  const [career, setCareer] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('brigadista');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Campos incompletos', 'Nombre, correo y contraseña temporal son obligatorios.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña débil', 'Debe tener al menos 8 caracteres. El usuario podrá cambiarla luego desde su perfil.');
      return;
    }

    setLoading(true);
    try {
      await AdminService.createStaff({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        studentId: studentId.trim() || undefined,
        faculty: faculty.trim() || undefined,
        career: career.trim() || undefined,
      });
      Alert.alert(
        'Staff creado',
        `${name} ya puede iniciar sesión con la contraseña temporal que asignaste.`,
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Nuevo Staff</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Input label="Nombre completo" placeholder="Ej. Juan Pérez" value={name} onChangeText={setName} />
        <Input
          label="Correo"
          placeholder="correo@ecounan.edu.ni"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Input label="Carnet / Código (opcional)" placeholder="2026-00000A" value={studentId} onChangeText={setStudentId} />
        <Input label="Facultad (opcional)" placeholder="Ciencias e Ingeniería" value={faculty} onChangeText={setFaculty} />
        <Input label="Carrera (opcional)" placeholder="Ingeniería en Sistemas" value={career} onChangeText={setCareer} />
        <Input
          label="Contraseña temporal"
          placeholder="Mínimo 8 caracteres"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.sectionLabel}>Rol asignado</Text>
        {ROLE_CARDS.map(({ value, title, desc, Icon, color, bg }) => (
          <TouchableOpacity
            key={value}
            style={[styles.roleCard, role === value && styles.roleCardActive]}
            onPress={() => setRole(value)}
          >
            <View style={[styles.roleIcon, { backgroundColor: bg }]}>
              <Icon size={20} color={color} />
            </View>
            <View style={styles.roleInfo}>
              <Text style={styles.roleTitle}>{title}</Text>
              <Text style={styles.roleDesc}>{desc}</Text>
            </View>
            <View style={[styles.radio, role === value && styles.radioActive]}>
              {role === value && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}

        <Button
          title="Crear cuenta de staff"
          loading={loading}
          onPress={handleCreate}
          style={{ marginTop: theme.spacing.l }}
        />
        <Text style={styles.hint}>
          Comparte la contraseña temporal en privado. El usuario debería cambiarla después desde su perfil.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.l,
    paddingTop: theme.spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { marginRight: theme.spacing.m },
  title: { ...theme.typography.h2, color: colors.text },
  container: { padding: theme.spacing.l, paddingBottom: 60 },

  sectionLabel: { ...theme.typography.bodySecondary, fontWeight: 'bold', marginTop: theme.spacing.m, marginBottom: theme.spacing.s },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: 10,
  },
  roleCardActive: { borderColor: colors.accent },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  roleInfo: { flex: 1, paddingRight: theme.spacing.s },
  roleTitle: { ...theme.typography.body, fontWeight: 'bold' },
  roleDesc: { ...theme.typography.caption, marginTop: 2 },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.accent },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },

  hint: { ...theme.typography.caption, textAlign: 'center', marginTop: theme.spacing.m },
});
