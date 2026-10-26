import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { useScrollToTop } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';
import { ClipboardCheck, Gift, Trash2, FileText, GlassWater, Medal, Users, Target, ShoppingBag, LogOut, User as UserIcon, Settings, HelpCircle, X, Package, Recycle } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { AdminService, DashboardData } from '../api/services/admin.service';
import { usePushNotifications } from '../hooks/usePushNotifications';

// Caché en memoria para carga instantánea al abrir el panel principal
let cachedDashboardData: DashboardData | null = null;

export const AdminDashboardScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);
  const scrollRef = useRef<any>(null);
  useScrollToTop(scrollRef);

  // Animaciones sutiles tipo RecycleScreen con física spring y micro-pop
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const badgeScale = useRef(new Animated.Value(0.7)).current;

  const statsFade = useRef(new Animated.Value(0)).current;
  const statsSlide = useRef(new Animated.Value(18)).current;
  const statsScale = useRef(new Animated.Value(0.96)).current;

  const activitySectionFade = useRef(new Animated.Value(0)).current;
  const activitySectionSlide = useRef(new Animated.Value(18)).current;

  const activityFades = useRef<Animated.Value[]>([]).current;
  const activitySlides = useRef<Animated.Value[]>([]).current;
  const activityCardScales = useRef<Animated.Value[]>([]).current;
  const activityIconScales = useRef<Animated.Value[]>([]).current;

  const navSectionFade = useRef(new Animated.Value(0)).current;
  const navSectionSlide = useRef(new Animated.Value(18)).current;
  const navSectionScale = useRef(new Animated.Value(0.96)).current;

  const accountSectionFade = useRef(new Animated.Value(0)).current;
  const accountSectionSlide = useRef(new Animated.Value(18)).current;
  const accountSectionScale = useRef(new Animated.Value(0.96)).current;

  const [loading, setLoading] = useState(!cachedDashboardData);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const [myRole, setMyRole] = useState<string>('admin');

  usePushNotifications(token);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(cachedDashboardData);

  
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  const ensureActivityCapacity = (count: number) => {
    while (activityFades.length < count) {
      activityFades.push(new Animated.Value(1));
      activitySlides.push(new Animated.Value(0));
      activityCardScales.push(new Animated.Value(1));
      activityIconScales.push(new Animated.Value(1));
    }
  };

  const playEntranceAnimation = (activityCount?: number) => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    badgeScale.setValue(0.7);

    statsFade.setValue(0);
    statsSlide.setValue(18);
    statsScale.setValue(0.96);

    activitySectionFade.setValue(0);
    activitySectionSlide.setValue(18);

    navSectionFade.setValue(0);
    navSectionSlide.setValue(18);
    navSectionScale.setValue(0.96);

    accountSectionFade.setValue(0);
    accountSectionSlide.setValue(18);
    accountSectionScale.setValue(0.96);

    const count = typeof activityCount === 'number'
      ? activityCount
      : (dashboardData?.recentActivity?.length || cachedDashboardData?.recentActivity?.length || 0);

    ensureActivityCapacity(count);
    for (let i = 0; i < count; i++) {
      activityFades[i].setValue(0);
      activitySlides[i].setValue(18);
      activityCardScales[i].setValue(0.96);
      activityIconScales[i].setValue(0.3);
    }

    const steps: Animated.CompositeAnimation[] = [
      // 1. Cabecera y badge con micro-pop
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(badgeScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      ]),

      // 2. Grilla de estadísticas (slide y scale spring)
      Animated.parallel([
        Animated.timing(statsFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(statsSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(statsScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
      ]),

      // 3. Cabecera de Actividad reciente
      Animated.parallel([
        Animated.timing(activitySectionFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(activitySectionSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      ]),
    ];

    // 4. Cascada de ítems de actividad reciente con micro-pop de ícono
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        steps.push(
          Animated.parallel([
            Animated.timing(activityFades[i], { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.spring(activitySlides[i], { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
            Animated.spring(activityCardScales[i], { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
            Animated.sequence([
              Animated.delay(40),
              Animated.spring(activityIconScales[i], { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
            ]),
          ])
        );
      }
    }

    // 5. Bloque de botones de Navegación
    steps.push(
      Animated.parallel([
        Animated.timing(navSectionFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(navSectionSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(navSectionScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
      ])
    );

    // 6. Bloque de Personalización y Cuenta
    steps.push(
      Animated.parallel([
        Animated.timing(accountSectionFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(accountSectionSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(accountSectionScale, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
      ])
    );

    Animated.stagger(65, steps).start();
  };

  const resetScrollToTop = (animated: boolean = false) => {
    scrollRef.current?.scrollTo({ y: 0, animated });
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  };

  const handleActivityPress = (item: any) => {
    setSelectedActivity(item);
    setModalVisible(true);
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(modalScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true })
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(modalScale, { toValue: 0.8, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setModalVisible(false);
      setSelectedActivity(null);
    });
  };

  const hasAnimatedOnEntry = useRef(false);

  const fetchData = async (silent: boolean = false) => {
    if (!silent && !cachedDashboardData) {
      setLoading(true);
    }
    try {
      const data = await AdminService.getDashboardData();
      cachedDashboardData = data;
      setDashboardData(data);
      if (!silent) {
        playEntranceAnimation(data?.recentActivity?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await tokenStorage.removeToken();
    await AsyncStorage.removeItem('@user_data');
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  useEffect(() => {
    tokenStorage.getToken().then(t => setToken(t || undefined));
    AsyncStorage.getItem('@user_data')
      .then(d => { if (d) setMyRole(JSON.parse(d).role || 'admin'); });
  }, []);

  useEffect(() => {
    // Solo se anima al entrar a la app (primer montaje del panel)
    if (!hasAnimatedOnEntry.current) {
      hasAnimatedOnEntry.current = true;
      playEntranceAnimation();
    }
    fetchData(true);

    let pollingInterval: NodeJS.Timeout | null = null;
    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(() => {
        fetchData(true);
      }, 3000);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
      // Al volver de una sub-ventana, NO se anima. Solo refresca datos en silencio
      fetchData(true);
      startPolling();
    });

    const unsubscribeBlur = navigation.addListener('blur', stopPolling);

    startPolling();

    return () => {
      stopPolling();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const getIconForType = (type: string) => {
    switch(type) {
      case 'plastic': return <GlassWater size={18} color="#475569" />;
      case 'metal': return <Trash2 size={18} color="#475569" />;
      case 'paper': return <FileText size={18} color="#475569" />;
      case 'redemption': return <Gift size={18} color="#D97706" />;
      case 'recycle': return <Recycle size={18} color="#16A34A" />;
      default: return <Package size={18} color="#475569" />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent || '#22C55E'} />
        }
      >
        
        {}
        <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }] }}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Panel Principal</Text>
              <Animated.View style={[styles.adminBadge, myRole === 'superadmin' && { backgroundColor: '#7C3AED' }, { transform: [{ scale: badgeScale }] }]}>
                <Text style={styles.adminBadgeText}>{myRole === 'superadmin' ? 'SUPERADMIN' : myRole === 'admin' ? 'ADMIN' : 'BRIGADISTA'}</Text>
              </Animated.View>
            </View>
            <Text style={styles.subtitle}>Resumen de la plataforma EcoUNAN</Text>
          </View>
        </Animated.View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            {}
            <Animated.View 
              style={{ 
                opacity: statsFade, 
                transform: [
                  { translateY: statsSlide },
                  { scale: statsScale }
                ] 
              }}
            >
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

            {}
            <Animated.View style={{ opacity: activitySectionFade, transform: [{ translateY: activitySectionSlide }] }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Actividad reciente</Text>
                {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 && (
                  <TouchableOpacity onPress={() => navigation.navigate('AdminActivityLog')}>
                    <Text style={styles.seeAllText}>Ver toda</Text>
                  </TouchableOpacity>
                )}
              </View>
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((item, index) => {
                  ensureActivityCapacity(index + 1);
                  return (
                    <Animated.View
                      key={item.id}
                      style={{
                        opacity: activityFades[index],
                        transform: [
                          { translateY: activitySlides[index] },
                          { scale: activityCardScales[index] }
                        ]
                      }}
                    >
                      <TouchableOpacity activeOpacity={0.7} style={styles.activityCard} onPress={() => handleActivityPress(item)}>
                        <View style={[styles.activityIndicator, { backgroundColor: item.color }]} />
                        <Animated.View style={[styles.activityIconBg, { transform: [{ scale: activityIconScales[index] }] }]}>
                          {getIconForType(item.type)}
                        </Animated.View>
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityAction}>{item.action} <Text style={{fontSize: 12, fontWeight: 'normal', color: colors.textSecondary}}>por {item.user}</Text></Text>
                          <Text style={styles.activityTime}>{new Date(item.time).toLocaleString()}</Text>
                        </View>
                        <Text style={styles.activityPoints}>{item.points}</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Aún no hay actividad reciente.</Text>
                </View>
              )}
            </Animated.View>
          </>
        )}

        {}
        <Animated.View 
          style={{ 
            opacity: navSectionFade, 
            transform: [
              { translateY: navSectionSlide },
              { scale: navSectionScale }
            ] 
          }}
        >
          <Text style={styles.sectionTitle}>Navegación</Text>
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminRecycles')}>
            <ClipboardCheck size={20} color={colors.text} />
            <Text style={styles.navButtonText}>Validar reciclaje</Text>
          </TouchableOpacity>
          
          {(myRole === 'admin' || myRole === 'superadmin') && (
            <>
              <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminReports')}>
                <FileText size={20} color="#15803D" />
                <Text style={styles.navButtonText}>Reportes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminRewards')}>
                <Gift size={20} color={colors.text} />
                <Text style={styles.navButtonText}>Gestionar recompensas</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminGoals')}>
                <Target size={20} color={colors.text} />
                <Text style={styles.navButtonText}>Gestionar metas</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminRedemptions')}>
            <ShoppingBag size={20} color={colors.text} />
            <Text style={styles.navButtonText}>Canjes realizados</Text>
          </TouchableOpacity>
          

          {myRole === 'superadmin' && (
            <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminUsers')}>
              <Users size={20} color={colors.text} />
              <Text style={styles.navButtonText}>Gestión de Usuarios</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Ranking')}>
            <Medal size={20} color={colors.text} />
            <Text style={styles.navButtonText}>Ver Ranking Global</Text>
          </TouchableOpacity>
        </Animated.View>

        {}
        <Animated.View 
          style={{ 
            opacity: accountSectionFade, 
            transform: [
              { translateY: accountSectionSlide },
              { scale: accountSectionScale }
            ] 
          }}
        >
          <Text style={styles.sectionTitle}>Personalización y Cuenta</Text>

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('EditProfile')}>
            <UserIcon size={20} color="#3B82F6" />
            <Text style={styles.navButtonText}>Editar perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
            <Settings size={20} color="#64748B" />
            <Text style={styles.navButtonText}>Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Help')}>
            <HelpCircle size={20} color="#3B82F6" />
            <Text style={styles.navButtonText}>Ayuda y soporte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navButton, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]} onPress={handleLogout}>
            <LogOut size={20} color="#EF4444" />
            <Text style={[styles.navButtonText, { color: '#EF4444' }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>

      {}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[styles.modalContent, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {selectedActivity && (
              <>
                <View style={[styles.modalIconContainer, { backgroundColor: selectedActivity.color + '20' }]}>
                  {getIconForType(selectedActivity.type)}
                </View>
                <Text style={styles.modalTitle}>{selectedActivity.type === 'redemption' ? 'Detalles de Canje' : 'Detalles de Reciclaje'}</Text>
                <Text style={styles.modalSubtitle}>{new Date(selectedActivity.time).toLocaleString()}</Text>

                <View style={styles.modalDetailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Usuario:</Text>
                    <Text style={styles.detailValue}>{selectedActivity.user}</Text>
                  </View>
                  <View style={styles.divider} />
                  
                  {selectedActivity.type === 'redemption' ? (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Recompensa:</Text>
                        <Text style={styles.detailValue}>{selectedActivity.details?.rewardName}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Puntos gastados:</Text>
                        <Text style={[styles.detailValue, { color: '#EF4444' }]}>{selectedActivity.details?.pointsSpent} pts</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Material:</Text>
                        <Text style={[styles.detailValue, { textTransform: 'capitalize', fontWeight: 'bold' }]}>{selectedActivity.details?.material}</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Peso:</Text>
                        <Text style={styles.detailValue}>{selectedActivity.details?.weight} kg</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Puntos ganados:</Text>
                        <Text style={[styles.detailValue, { color: '#10B981' }]}>+{selectedActivity.details?.points} pts</Text>
                      </View>
                      <View style={styles.divider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Modo:</Text>
                        <Text style={styles.detailValue}>{selectedActivity.details?.validationMode === 'inperson' ? 'Presencial' : 'Foto'}</Text>
                      </View>
                    </>
                  )}
                  
                  <View style={styles.divider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Validado por:</Text>
                    <Text style={styles.detailValue}>{selectedActivity.details?.validatedBy || 'Sistema'}</Text>
                  </View>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
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

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: theme.spacing.m, marginTop: theme.spacing.s },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  seeAllText: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 2 },
  
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

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '95%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  modalDetailsBox: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
});
