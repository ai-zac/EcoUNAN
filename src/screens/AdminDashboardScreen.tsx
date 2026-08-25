import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Animated, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClipboardCheck, QrCode, Gift, Trash2, FileText, GlassWater, Medal, Users, Target, ShoppingBag } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { AdminService, DashboardData } from '../api/services/admin.service';
import { usePushNotifications } from '../hooks/usePushNotifications';

export const AdminDashboardScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const statsScale = useRef(new Animated.Value(0.8)).current;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const [myRole, setMyRole] = useState<string>('admin');

  usePushNotifications(token);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchData = async () => {
    try {
      const data = await AdminService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    AsyncStorage.getItem('@auth_token').then(t => setToken(t || undefined));
    AsyncStorage.getItem('@user_data')
      .then(d => { if (d) setMyRole(JSON.parse(d).role || 'admin'); });

    fetchData();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      Animated.spring(statsScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const getIconForType = (type: string) => {
    switch(type) {
      case 'plastic': return <GlassWater size={18} color="#475569" />;
      case 'metal': return <Trash2 size={18} color="#475569" />;
      case 'paper': return <FileText size={18} color="#475569" />;
      default: return <GlassWater size={18} color="#475569" />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >
        
        {/* Encabezado */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Panel Principal</Text>
              <View style={[styles.adminBadge, myRole === 'superadmin' && { backgroundColor: '#7C3AED' }]}>
                <Text style={styles.adminBadgeText}>{myRole === 'superadmin' ? 'SUPERADMIN' : 'ADMIN'}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>Resumen de la plataforma EcoUNAN</Text>
          </View>
        </Animated.View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Estadísticas */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: statsScale }] }}>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{dashboardData?.stats?.totalUsers || 0}</Text>
                  <Text style={styles.statLabel}>Usuarios registrados</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{dashboardData?.stats?.validatedRecycles || 0}</Text>
                  <Text style={styles.statLabel}>Reciclajes validados</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{dashboardData?.stats?.activeRewards || 0}</Text>
                  <Text style={styles.statLabel}>Recompensas activas</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{dashboardData?.stats?.redemptions || 0}</Text>
                  <Text style={styles.statLabel}>Canjes realizados</Text>
                </View>
              </View>
            </Animated.View>

            {/* Actividad Reciente */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              <Text style={styles.sectionTitle}>Actividad reciente</Text>
              {dashboardData?.recentActivity?.map((item) => (
                <View key={item.id} style={styles.activityCard}>
                  <View style={[styles.activityIndicator, { backgroundColor: item.color }]} />
                  <View style={styles.activityIconBg}>
                    {getIconForType(item.type)}
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityAction}>{item.action} <Text style={{fontSize: 12, fontWeight: 'normal', color: colors.textSecondary}}>por {item.user}</Text></Text>
                    <Text style={styles.activityTime}>{new Date(item.time).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.activityPoints}>{item.points}</Text>
                </View>
              ))}
            </Animated.View>
          </>
        )}

        {/* Navegación */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.sectionTitle}>Navegación</Text>
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminRecycles')}>
            <ClipboardCheck size={20} color="#0F172A" />
            <Text style={styles.navButtonText}>Validar reciclaje</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminRewards')}>
            <Gift size={20} color="#0F172A" />
            <Text style={styles.navButtonText}>Gestionar recompensas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminGoals')}>
            <Target size={20} color="#0F172A" />
            <Text style={styles.navButtonText}>Gestionar metas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminRedemptions')}>
            <ShoppingBag size={20} color="#0F172A" />
            <Text style={styles.navButtonText}>Canjes realizados</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminGenerateQR')}>
            <QrCode size={20} color="#0F172A" />
            <Text style={styles.navButtonText}>Generar código QR</Text>
          </TouchableOpacity>

          {myRole === 'superadmin' && (
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminUsers')}>
              <Users size={20} color="#0F172A" />
              <Text style={styles.navButtonText}>Gestión de Usuarios</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Ranking')}>
            <Medal size={20} color="#0F172A" />
            <Text style={styles.navButtonText}>Ver Ranking Global</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  
  header: { marginBottom: theme.spacing.xl, marginTop: theme.spacing.l },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, flex: 1 },
  adminBadge: { backgroundColor: colors.text, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 8, marginTop: 4 },
  adminBadgeText: { color: colors.white, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  subtitle: { fontSize: 15, color: colors.textSecondary },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: theme.spacing.m, marginTop: theme.spacing.s },
  
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: theme.spacing.xl },
  statCard: { 
    width: '48%', 
    backgroundColor: colors.background, 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 16, 
    padding: theme.spacing.m, 
    marginBottom: 12,
    ...theme.shadows.soft,
  },
  statLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '900', color: colors.text },

  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: theme.spacing.m,
    marginBottom: 12,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  activityIndicator: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 4, borderRadius: 2 },
  activityIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginRight: 12 },
  activityInfo: { flex: 1 },
  activityAction: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  activityTime: { fontSize: 12, color: colors.textSecondary },
  activityPoints: { fontSize: 15, fontWeight: '800', color: colors.text },

  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  navButtonText: { fontSize: 16, fontWeight: '800', color: colors.text, marginLeft: 16 },
});
