import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image, Dimensions, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X, Trophy, Recycle, Package } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { userService } from '../api/services/user.service';
import { RecycleService } from '../api/services/recycle.service';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRank } from '../utils/ranks';
import { API_BASE_URL } from '../api/apiClient';

export const RankingScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [ranking, setRanking] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserStats, setSelectedUserStats] = useState<{recycleCount: number, totalWeight: number} | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const modalScale = useRef(new Animated.Value(0.8)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Animaciones elegantes para la interfaz de ranking
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(14)).current;
  const backButtonScale = useRef(new Animated.Value(0.7)).current;

  // Podio: 2do lugar (Plata/Izquierda), 1er lugar (Oro/Centro), 3er lugar (Bronce/Derecha)
  const podium2Fade = useRef(new Animated.Value(0)).current;
  const podium2Slide = useRef(new Animated.Value(40)).current;
  const podium2Scale = useRef(new Animated.Value(0.85)).current;
  const podium2BadgeScale = useRef(new Animated.Value(0.4)).current;

  const podium3Fade = useRef(new Animated.Value(0)).current;
  const podium3Slide = useRef(new Animated.Value(40)).current;
  const podium3Scale = useRef(new Animated.Value(0.85)).current;
  const podium3BadgeScale = useRef(new Animated.Value(0.4)).current;

  const podium1Fade = useRef(new Animated.Value(0)).current;
  const podium1Slide = useRef(new Animated.Value(55)).current;
  const podium1Scale = useRef(new Animated.Value(0.8)).current;
  const podium1BadgeScale = useRef(new Animated.Value(0.3)).current;

  const listFade = useRef(new Animated.Value(0)).current;
  const listSlide = useRef(new Animated.Value(25)).current;

  const playEntranceAnimation = () => {
    headerFade.setValue(0);
    headerSlide.setValue(14);
    backButtonScale.setValue(0.7);

    podium2Fade.setValue(0);
    podium2Slide.setValue(40);
    podium2Scale.setValue(0.85);
    podium2BadgeScale.setValue(0.4);

    podium3Fade.setValue(0);
    podium3Slide.setValue(40);
    podium3Scale.setValue(0.85);
    podium3BadgeScale.setValue(0.4);

    podium1Fade.setValue(0);
    podium1Slide.setValue(55);
    podium1Scale.setValue(0.8);
    podium1BadgeScale.setValue(0.3);

    listFade.setValue(0);
    listSlide.setValue(25);

    Animated.stagger(80, [
      // 1. Cabecera y botón de retroceso
      Animated.parallel([
        Animated.timing(headerFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(headerSlide, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(backButtonScale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
      ]),

      // 2. Alzan los flancos del podio (2.º y 3.er puesto a los lados)
      Animated.parallel([
        Animated.timing(podium2Fade, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(podium2Slide, { toValue: 0, tension: 65, friction: 7.5, useNativeDriver: true }),
        Animated.spring(podium2Scale, { toValue: 1, tension: 70, friction: 7.5, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(60),
          Animated.spring(podium2BadgeScale, { toValue: 1, tension: 90, friction: 6, useNativeDriver: true }),
        ]),

        Animated.timing(podium3Fade, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(podium3Slide, { toValue: 0, tension: 65, friction: 7.5, useNativeDriver: true }),
        Animated.spring(podium3Scale, { toValue: 1, tension: 70, friction: 7.5, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(60),
          Animated.spring(podium3BadgeScale, { toValue: 1, tension: 90, friction: 6, useNativeDriver: true }),
        ]),
      ]),

      // 3. ¡El 1.er lugar se alza en el centro con presencia triunfal y rebote dorado!
      Animated.parallel([
        Animated.timing(podium1Fade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(podium1Slide, { toValue: 0, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.spring(podium1Scale, { toValue: 1, tension: 70, friction: 6.5, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(80),
          Animated.spring(podium1BadgeScale, { toValue: 1, tension: 95, friction: 5.5, useNativeDriver: true }),
        ]),
      ]),

      // 4. La lista de posiciones (4.º en adelante) se desliza suavemente
      Animated.parallel([
        Animated.timing(listFade, { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.spring(listSlide, { toValue: 0, tension: 65, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData(true);
    });

    loadData(true);

    return unsubscribe;
  }, [navigation]);

  // Polling automático en tiempo real en segundo plano mientras RankingScreen esté activa
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = setInterval(async () => {
        try {
          await loadData(false);
        } catch (e) {
          // Polling silencioso
        }
      }, 4000);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    const unsubscribeFocus = navigation.addListener('focus', startPolling);
    const unsubscribeBlur = navigation.addListener('blur', stopPolling);

    startPolling();

    return () => {
      stopPolling();
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  const loadData = async (animate: boolean = true) => {
    try {
      const users = await userService.getRanking();
      setRanking(users);

      const userData = (await AsyncStorage.getItem('@user_data')) || (await AsyncStorage.getItem('user'));
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user._id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      if (animate) {
        setTimeout(() => {
          playEntranceAnimation();
        }, 50);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {
      console.error('[RankingScreen] Error al refrescar:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getProfileImageUrl = (profilePicture?: string) => {
    if (!profilePicture) return null;
    const baseUrl = API_BASE_URL.replace('/api', '');
    return profilePicture.startsWith('http') ? profilePicture : `${baseUrl}${profilePicture}`;
  };

  const handleUserPress = async (user: User) => {
    setSelectedUser(user);
    setModalVisible(true);
    setLoadingStats(true);
    setSelectedUserStats(null);
    
    
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(modalScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true })
    ]).start();

    try {
      const stats = await RecycleService.getUserStats(user._id);
      setSelectedUserStats(stats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(modalScale, { toValue: 0.8, duration: 200, useNativeDriver: true })
    ]).start(() => {
      setModalVisible(false);
    });
  };

  const top3 = ranking.slice(0, 3);
  const restOfList = ranking.slice(3);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary, colors.accent]} 
            tintColor={colors.primary} 
          />
        }
      >
        <Animated.View style={[styles.header, { opacity: headerFade, transform: [{ translateY: headerSlide }] }]}>
          <View style={styles.titleRow}>
            <Animated.View style={{ transform: [{ scale: backButtonScale }] }}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={styles.title}>Ranking EcoUNAN</Text>
          </View>
          <Text style={styles.subtitle}>Recicla, suma puntos y sube de posición.</Text>
        </Animated.View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {top3.length > 0 && (
              <View style={styles.podiumContainer}>
                {/* 2do Lugar (Izquierda - Plata) */}
                {top3[1] && (
                  <Animated.View
                    style={{
                      flex: 1,
                      opacity: podium2Fade,
                      transform: [
                        { translateY: podium2Slide },
                        { scale: podium2Scale }
                      ]
                    }}
                  >
                    <TouchableOpacity activeOpacity={0.8} onPress={() => handleUserPress(top3[1])} style={[styles.podiumCard, styles.podiumCardSide]}>
                      <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                        {top3[1].profilePicture ? (
                          <Image source={{ uri: getProfileImageUrl(top3[1].profilePicture) as string }} style={styles.avatarImage} />
                        ) : (
                          <Text style={[styles.avatarText, { color: colors.text }]}>{getInitials(top3[1].name)}</Text>
                        )}
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>{top3[1].name}</Text>
                      <Text style={styles.podiumPoints}>{top3[1].ecoPoints} puntos</Text>
                      <Animated.View style={{ transform: [{ scale: podium2BadgeScale }] }}>
                        <View style={styles.positionBadgeGray}>
                          <Text style={styles.positionBadgeTextGray}>2.º</Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* 1er Lugar (Centro - Oro) */}
                {top3[0] && (
                  <Animated.View
                    style={{
                      flex: 1,
                      zIndex: 10,
                      opacity: podium1Fade,
                      transform: [
                        { translateY: podium1Slide },
                        { scale: podium1Scale }
                      ]
                    }}
                  >
                    <TouchableOpacity activeOpacity={0.9} onPress={() => handleUserPress(top3[0])} style={[styles.podiumCard, styles.podiumCardCenter]}>
                      <View style={{ position: 'relative' }}>
                        <View style={[styles.avatar, { backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: '#F59E0B' }]}>
                          {top3[0].profilePicture ? (
                            <Image source={{ uri: getProfileImageUrl(top3[0].profilePicture) as string }} style={styles.avatarImage} />
                          ) : (
                            <Text style={[styles.avatarText, { color: '#D97706' }]}>{getInitials(top3[0].name)}</Text>
                          )}
                        </View>
                        <Animated.View style={[styles.podiumTrophyBadge, { transform: [{ scale: podium1BadgeScale }] }]}>
                          <Trophy size={13} color="#D97706" />
                        </Animated.View>
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>{top3[0].name}</Text>
                      <Text style={styles.podiumPointsGold}>{top3[0].ecoPoints} puntos</Text>
                      <Animated.View style={{ transform: [{ scale: podium1BadgeScale }] }}>
                        <View style={styles.positionBadgeGold}>
                          <Text style={styles.positionBadgeTextGold}>1.º</Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                {/* 3er Lugar (Derecha - Bronce) */}
                {top3[2] && (
                  <Animated.View
                    style={{
                      flex: 1,
                      opacity: podium3Fade,
                      transform: [
                        { translateY: podium3Slide },
                        { scale: podium3Scale }
                      ]
                    }}
                  >
                    <TouchableOpacity activeOpacity={0.8} onPress={() => handleUserPress(top3[2])} style={[styles.podiumCard, styles.podiumCardSide]}>
                      <View style={[styles.avatar, { backgroundColor: '#FFEDD5' }]}>
                        {top3[2].profilePicture ? (
                          <Image source={{ uri: getProfileImageUrl(top3[2].profilePicture) as string }} style={styles.avatarImage} />
                        ) : (
                          <Text style={[styles.avatarText, { color: '#C2410C' }]}>{getInitials(top3[2].name)}</Text>
                        )}
                      </View>
                      <Text style={styles.podiumName} numberOfLines={1}>{top3[2].name}</Text>
                      <Text style={styles.podiumPointsBronze}>{top3[2].ecoPoints} puntos</Text>
                      <Animated.View style={{ transform: [{ scale: podium3BadgeScale }] }}>
                        <View style={styles.positionBadgeBronze}>
                          <Text style={styles.positionBadgeTextBronze}>3.º</Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </View>
            )}

            {/* Lista de posiciones (4to en adelante) */}
            <Animated.View style={[styles.listContainer, { opacity: listFade, transform: [{ translateY: listSlide }] }]}>
              {restOfList.map((user, index) => {
                const isMe = user._id === currentUserId;
                const position = index + 4; 
                return (
                  <TouchableOpacity 
                    key={user._id} 
                    activeOpacity={0.7}
                    onPress={() => handleUserPress(user)}
                    style={[
                      styles.listItem, 
                      isMe && styles.listItemMe
                    ]}
                  >
                    <Text style={[styles.listPosition, isMe && styles.listTextMe]}>{position}.º</Text>
                    <View style={[styles.listAvatar, isMe && styles.listAvatarMe]}>
                      {user.profilePicture ? (
                        <Image source={{ uri: getProfileImageUrl(user.profilePicture) as string }} style={{width: '100%', height: '100%', borderRadius: 18}} />
                      ) : (
                        <Text style={[styles.listAvatarText, isMe && styles.listAvatarTextMe]}>{getInitials(user.name)}</Text>
                      )}
                    </View>
                    <Text style={[styles.listName, isMe && styles.listTextMe]}>{user.name} {isMe && '(Tú)'}</Text>
                    <Text style={[styles.listPoints, isMe && styles.listPointsMe]}>{user.ecoPoints} pts</Text>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
          <Animated.View style={[styles.modalContent, { opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            {selectedUser && (
              <>
                <View style={styles.modalAvatarContainer}>
                  {selectedUser.profilePicture ? (
                    <Image source={{ uri: getProfileImageUrl(selectedUser.profilePicture) as string }} style={styles.modalAvatarImage} />
                  ) : (
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>{getInitials(selectedUser.name)}</Text>
                    </View>
                  )}
                  <View style={[styles.modalRankBadge, { backgroundColor: getUserRank(selectedUser.lifetimePoints || selectedUser.ecoPoints || 0).currentRank.color }]}>
                    <Text style={styles.modalRankText}>{getUserRank(selectedUser.lifetimePoints || selectedUser.ecoPoints || 0).currentRank.icon}</Text>
                  </View>
                </View>

                <Text style={styles.modalName}>{selectedUser.name}</Text>
                {selectedUser.career ? (
                  <Text style={styles.modalCareer}>{selectedUser.career}</Text>
                ) : null}
                {selectedUser.faculty ? (
                  <Text style={styles.modalFaculty}>{selectedUser.faculty}</Text>
                ) : null}

                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatCard}>
                    <View style={[styles.statIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <Trophy size={20} color="#3B82F6" />
                    </View>
                    <Text style={styles.modalStatValue}>{selectedUser.lifetimePoints || selectedUser.ecoPoints || 0}</Text>
                    <Text style={styles.modalStatLabel}>Históricos</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <View style={[styles.statIconBox, { backgroundColor: getUserRank(selectedUser.lifetimePoints || selectedUser.ecoPoints || 0).currentRank.color + '20' }]}>
                      <Text style={{fontSize: 18}}>{getUserRank(selectedUser.lifetimePoints || selectedUser.ecoPoints || 0).currentRank.icon}</Text>
                    </View>
                    <Text style={[styles.modalStatValue, { color: getUserRank(selectedUser.lifetimePoints || selectedUser.ecoPoints || 0).currentRank.color }]}>
                      {getUserRank(selectedUser.lifetimePoints || selectedUser.ecoPoints || 0).currentRank.name}
                    </Text>
                    <Text style={styles.modalStatLabel}>Rango Actual</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <View style={[styles.statIconBox, { backgroundColor: '#F0FDF4' }]}>
                      <Recycle size={20} color="#16A34A" />
                    </View>
                    {loadingStats ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.modalStatValue}>{selectedUserStats?.recycleCount || 0}</Text>
                    )}
                    <Text style={styles.modalStatLabel}>Reciclajes</Text>
                  </View>
                  <View style={styles.modalStatCard}>
                    <View style={[styles.statIconBox, { backgroundColor: '#FFFBEB' }]}>
                      <Package size={20} color="#D97706" />
                    </View>
                    {loadingStats ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.modalStatValue} numberOfLines={1} adjustsFontSizeToFit>{Number((selectedUserStats?.totalWeight || 0).toFixed(1))} kg</Text>
                    )}
                    <Text style={styles.modalStatLabel}>Reciclado</Text>
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
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { paddingHorizontal: theme.spacing.m, paddingTop: 4, paddingBottom: 60 },
  
  header: { marginBottom: 12, marginTop: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  backButton: { marginRight: 10, padding: 4, marginLeft: -4 },
  title: { fontSize: 24, fontWeight: '900', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginLeft: 2 },

  podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 18, gap: 8 },
  podiumCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    flex: 1,
  },
  podiumCardSide: { height: 142, justifyContent: 'flex-end', paddingBottom: 12 },
  podiumCardCenter: { height: 168, backgroundColor: '#DCFCE7', borderColor: '#16A34A', justifyContent: 'flex-end', paddingBottom: 16, zIndex: 10 },
  
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarText: { fontSize: 15, fontWeight: '900' },
  
  podiumName: { fontSize: 12, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 2 },
  podiumPoints: { fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: 8 },
  podiumPointsGold: { fontSize: 12, fontWeight: '900', color: '#D97706', marginBottom: 10 },
  podiumPointsBronze: { fontSize: 12, fontWeight: '900', color: '#C2410C', marginBottom: 8 },

  positionBadgeGray: { backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  positionBadgeTextGray: { fontSize: 11, fontWeight: '800', color: colors.text },
  positionBadgeGold: { backgroundColor: '#FEF3C7', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  positionBadgeTextGold: { fontSize: 11, fontWeight: '900', color: '#D97706' },
  podiumTrophyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  positionBadgeBronze: { backgroundColor: '#FFEDD5', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  positionBadgeTextBronze: { fontSize: 11, fontWeight: '800', color: '#C2410C' },

  listContainer: { gap: 8 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  listItemMe: { backgroundColor: '#DCFCE7', borderColor: '#16A34A' },
  
  listPosition: { fontSize: 16, fontWeight: '800', color: colors.textSecondary, width: 40 },
  listTextMe: { color: colors.text },
  
  listAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listAvatarMe: { backgroundColor: '#16A34A' },
  listAvatarText: { fontSize: 13, fontWeight: '800', color: colors.textSecondary },
  listAvatarTextMe: { color: '#FFFFFF' },

  listName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  listPoints: { fontSize: 15, fontWeight: '900', color: colors.text },
  listPointsMe: { color: '#16A34A' },

  
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
    padding: 20,
    paddingBottom: 4,
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
  modalAvatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  modalAvatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: colors.surface,
  },
  modalAvatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#64748B',
  },
  modalRankBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  modalRankText: {
    fontSize: 16,
  },
  modalName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalCareer: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 2,
    textAlign: 'center',
  },
  modalFaculty: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalStatCard: {
    width: '48%',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 4,
  },
  modalStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
