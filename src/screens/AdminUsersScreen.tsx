import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, TextInput, RefreshControl,
} from 'react-native';
import {
  ArrowLeft, User, Shield, ShieldCheck, HardHat, Search,
  Power, UserCog, UserPlus, X,
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { AdminService } from '../api/services/admin.service';
import { User as UserType, UserRole } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; Icon: any }> = {
  superadmin: { label: 'SUPERADMIN', color: '#7C3AED', bg: '#EDE9FE', Icon: ShieldCheck },
  admin: { label: 'ADMIN', color: '#D97706', bg: '#FEF3C7', Icon: Shield },
  brigadista: { label: 'BRIGADISTA', color: '#059669', bg: '#D1FAE5', Icon: HardHat },
  user: { label: 'USUARIO', color: '#0284C7', bg: '#E0F2FE', Icon: User },
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'brigadista', label: 'Brigadista (valida reciclajes)' },
  { value: 'admin', label: 'Administrador (recompensas)' },
  { value: 'user', label: 'Usuario estándar' },
];

export const AdminUsersScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('');
  const [me, setMe] = useState<UserType | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('@user_data').then(d => d && setMe(JSON.parse(d)));
    fetchUsers();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(search, statusFilter), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchUsers = async (q: string = search, st: '' | 'active' | 'inactive' = statusFilter) => {
    try {
      const data = await AdminService.searchUsers(q, st);
      setUsers(data);
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'No se pudieron cargar los usuarios';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleStatus = (item: UserType) => {
    const action = item.isActive ? 'deshabilitar' : 'habilitar';
    Alert.alert(
      'Confirmar',
      `¿Deseas ${action} la cuenta de ${item.name}?` +
        (item.isActive ? '\n\nEl usuario no podrá iniciar sesión hasta que lo habilites.' : ''),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: item.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await AdminService.toggleUserStatus(item._id);
              fetchUsers();
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.error || 'No se pudo cambiar el estado');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = (item: UserType) => {
    const options: any[] = [{ text: 'Cancelar', style: 'cancel' }];
    ROLE_OPTIONS.forEach(opt => {
      if (opt.value === item.role) return;
      options.push({
        text: opt.label,
        onPress: async () => {
          try {
            await AdminService.updateUserRole(item._id, opt.value);
            fetchUsers();
          } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.error || 'No se pudo cambiar el rol');
          }
        },
      });
    });
    Alert.alert(`Rol de ${item.name}`, 'Asignar nuevo rol:', options);
  };

  const canManage = (item: UserType) =>
    me != null && item._id !== me._id && item.role !== 'superadmin';

  const renderUser = ({ item }: { item: UserType }) => {
    const cfg = ROLE_CONFIG[item.role] ?? ROLE_CONFIG.user;
    return (
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <cfg.Icon size={22} color={cfg.color} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {!!item.studentId && <Text style={styles.carnet}>Carnet: {item.studentId}</Text>}
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
              <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#22C55E' : '#94A3B8' }]} />
            <Text style={styles.statusText}>{item.isActive ? 'Activo' : 'Deshabilitado'}</Text>
          </View>
        </View>
        {canManage(item) && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleChangeRole(item)}
            >
              <UserCog size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleToggleStatus(item)}
            >
              <Power size={18} color={item.isActive ? '#EF4444' : '#22C55E'} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const filters: { label: string; value: '' | 'active' | 'inactive' }[] = [
    { label: 'Todos', value: '' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Usuarios</Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nombre, correo o carnet"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            value={search}
            onChangeText={setSearch}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de estado */}
      <View style={styles.filtersRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.label}
            style={[styles.chip, statusFilter === f.value && styles.chipActive]}
            onPress={() => { setStatusFilter(f.value); setLoading(true); fetchUsers(search, f.value); }}
          >
            <Text style={[styles.chipText, statusFilter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No se encontraron usuarios</Text>
          }
          ListFooterComponent={
            <TouchableOpacity
              style={styles.newStaffBtn}
              onPress={() => navigation.navigate('AdminCreateStaff')}
            >
              <UserPlus size={20} color="#FFFFFF" />
              <Text style={styles.newStaffText}>Nuevo staff</Text>
            </TouchableOpacity>
          }
        />
      )}
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

  searchRow: { paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.m },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.borderRadius.s,
    paddingHorizontal: theme.spacing.m,
    height: 46,
  },
  searchInput: { ...theme.typography.body, flex: 1, paddingVertical: 0 },

  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...theme.typography.caption, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },

  listContainer: { padding: theme.spacing.l, gap: theme.spacing.m },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  info: { flex: 1 },
  name: { ...theme.typography.body, fontWeight: 'bold' },
  email: { ...theme.typography.caption },
  carnet: { ...theme.typography.caption, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.s },
  badgeText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...theme.typography.caption },

  actions: { gap: 12 },
  actionBtn: { padding: 6 },

  empty: { ...theme.typography.bodySecondary, textAlign: 'center', marginTop: 40 },

  newStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: theme.borderRadius.m,
    paddingVertical: 16,
    marginTop: theme.spacing.m,
  },
  newStaffText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
