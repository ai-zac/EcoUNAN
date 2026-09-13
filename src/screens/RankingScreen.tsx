import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Image, Dimensions, Animated } from 'react-native';
import { ArrowLeft, X, Trophy, Recycle, Package } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  const insets = useSafeAreaInsets();
  const [ranking, setRanking] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserStats, setSelectedUserStats] = useState<{recycleCount: number, totalWeight: number} | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const modalScale = React.useRef(new Animated.Value(0.8)).current;
  const modalOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      
      const users = await userService.getRanking();
      setRanking(users);
      
      
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user._id);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Ranking EcoUNAN</Text>
            <Text style={styles.subtitle}>Recicla, suma puntos y sube de posición.</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {}
            {top3.length > 0 && (
              <View style={styles.podiumContainer}>
                {}
                {top3[1] && (
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
                    <View style={styles.positionBadgeGray}>
                      <Text style={styles.positionBadgeTextGray}>2.º</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {}
                {top3[0] && (
                  <TouchableOpacity activeOpacity={0.9} onPress={() => handleUserPress(top3[0])} style={[styles.podiumCard, styles.podiumCardCenter]}>
                    <View style={[styles.avatar, { backgroundColor: '#FEF3C7' }]}>
                      {top3[0].profilePicture ? (
                        <Image source={{ uri: getProfileImageUrl(top3[0].profilePicture) as string }} style={styles.avatarImage} />
                      ) : (
                        <Text style={[styles.avatarText, { color: '#D97706' }]}>{getInitials(top3[0].name)}</Text>
                      )}
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{top3[0].name}</Text>
                    <Text style={styles.podiumPointsGold}>{top3[0].ecoPoints} puntos</Text>
                    <View style={styles.positionBadgeGold}>
                      <Text style={styles.positionBadgeTextGold}>1.º</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {}
                {top3[2] && (
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
                    <View style={styles.positionBadgeBronze}>
                      <Text style={styles.positionBadgeTextBronze}>3.º</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {}
            <View style={styles.listContainer}>
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
            </View>
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
                      <Text style={styles.modalStatValue}>{selectedUserStats?.totalWeight || 0} kg</Text>
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
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.m, marginTop: theme.spacing.s },
  backButton: { marginRight: 16, padding: 8, marginLeft: -8 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSecondary },

  podiumContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 30, gap: 8 },
  podiumCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  podiumCardSide: { height: 160, justifyContent: 'flex-end', paddingBottom: 16 },
  podiumCardCenter: { height: 190, backgroundColor: '#DCFCE7', borderColor: '#16A34A', justifyContent: 'flex-end', paddingBottom: 24, zIndex: 10 },
  
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 16, fontWeight: '900' },
  
  podiumName: { fontSize: 13, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 2 },
  podiumPoints: { fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: 12 },
  podiumPointsGold: { fontSize: 12, fontWeight: '900', color: '#D97706', marginBottom: 16 },
  podiumPointsBronze: { fontSize: 12, fontWeight: '900', color: '#C2410C', marginBottom: 12 },

  positionBadgeGray: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  positionBadgeTextGray: { fontSize: 11, fontWeight: '800', color: colors.text },
  positionBadgeGold: { backgroundColor: '#FEF3C7', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  positionBadgeTextGold: { fontSize: 12, fontWeight: '900', color: '#D97706' },
  positionBadgeBronze: { backgroundColor: '#FFEDD5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  positionBadgeTextBronze: { fontSize: 11, fontWeight: '800', color: '#C2410C' },

  listContainer: { gap: 12 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
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
