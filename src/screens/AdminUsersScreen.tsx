import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { ArrowLeft, User, Shield, Trash2 } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { AdminService } from '../api/services/admin.service';
import { User as UserType } from '../types';

export const AdminUsersScreen = ({ navigation }: any) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await AdminService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Confirmar', '¿Estás seguro de eliminar este usuario?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Eliminar', 
        style: 'destructive',
        onPress: async () => {
          try {
            await AdminService.deleteUser(id);
            setUsers(prev => prev.filter(u => u._id !== id));
            Alert.alert('Éxito', 'Usuario eliminado');
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar al usuario');
          }
        }
      }
    ]);
  };

  const renderUser = ({ item }: { item: UserType }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        {item.role === 'admin' ? <Shield color={theme.colors.accent} /> : <User color={theme.colors.primary} />}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
      </View>
      <View style={styles.actions}>
        <View style={[styles.badge, item.role === 'admin' && styles.badgeAdmin]}>
          <Text style={[styles.badgeText, item.role === 'admin' && styles.badgeTextAdmin]}>
            {item.role.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Gestión de Usuarios</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.l,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: { marginRight: theme.spacing.m },
  title: { ...theme.typography.h2, color: theme.colors.text },
  listContainer: { padding: theme.spacing.l, gap: theme.spacing.m },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    ...theme.shadows.soft,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  info: { flex: 1 },
  name: { ...theme.typography.body, fontWeight: 'bold' },
  email: { ...theme.typography.caption },
  faculty: { ...theme.typography.caption, color: theme.colors.accent, marginTop: 4 },
  actions: { alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E0F2FE',
    borderRadius: theme.borderRadius.s,
    marginBottom: 8,
  },
  badgeText: { ...theme.typography.caption, color: '#0284C7', fontWeight: 'bold' },
  badgeAdmin: { backgroundColor: '#FEF3C7' },
  badgeTextAdmin: { color: '#D97706' },
  deleteBtn: { padding: 4 }
});
