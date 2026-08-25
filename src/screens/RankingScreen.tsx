import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { userService } from '../api/services/user.service';
import { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RankingScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const insets = useSafeAreaInsets();
  const [ranking, setRanking] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch ranking
      const users = await userService.getRanking();
      setRanking(users);
      
      // Get current user id from storage to highlight them
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
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const top3 = ranking.slice(0, 3);
  const restOfList = ranking.slice(3);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Ranking EcoUNAN</Text>
          <Text style={styles.subtitle}>Recicla, suma puntos y sube de posición.</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Podio */}
            {top3.length > 0 && (
              <View style={styles.podiumContainer}>
                {/* 2do Lugar */}
                {top3[1] && (
                  <View style={[styles.podiumCard, styles.podiumCardSide]}>
                    <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.avatarText, { color: colors.text }]}>{getInitials(top3[1].name)}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{top3[1].name}</Text>
                    <Text style={styles.podiumPoints}>{top3[1].ecoPoints} puntos</Text>
                    <View style={styles.positionBadgeGray}>
                      <Text style={styles.positionBadgeTextGray}>2.º</Text>
                    </View>
                  </View>
                )}

                {/* 1er Lugar */}
                {top3[0] && (
                  <View style={[styles.podiumCard, styles.podiumCardCenter]}>
                    <View style={[styles.avatar, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.avatarText, { color: '#D97706' }]}>{getInitials(top3[0].name)}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{top3[0].name}</Text>
                    <Text style={styles.podiumPointsGold}>{top3[0].ecoPoints} puntos</Text>
                    <View style={styles.positionBadgeGold}>
                      <Text style={styles.positionBadgeTextGold}>1.º</Text>
                    </View>
                  </View>
                )}

                {/* 3er Lugar */}
                {top3[2] && (
                  <View style={[styles.podiumCard, styles.podiumCardSide]}>
                    <View style={[styles.avatar, { backgroundColor: '#FFEDD5' }]}>
                      <Text style={[styles.avatarText, { color: '#C2410C' }]}>{getInitials(top3[2].name)}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{top3[2].name}</Text>
                    <Text style={styles.podiumPointsBronze}>{top3[2].ecoPoints} puntos</Text>
                    <View style={styles.positionBadgeBronze}>
                      <Text style={styles.positionBadgeTextBronze}>3.º</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Lista */}
            <View style={styles.listContainer}>
              {restOfList.map((user, index) => {
                const isMe = user._id === currentUserId;
                const position = index + 4; // Start from 4th
                return (
                  <View 
                    key={user._id} 
                    style={[
                      styles.listItem, 
                      isMe && styles.listItemMe
                    ]}
                  >
                    <Text style={[styles.listPosition, isMe && styles.listTextMe]}>{position}.º</Text>
                    <View style={[styles.listAvatar, isMe && styles.listAvatarMe]}>
                      <Text style={[styles.listAvatarText, isMe && styles.listAvatarTextMe]}>{getInitials(user.name)}</Text>
                    </View>
                    <Text style={[styles.listName, isMe && styles.listTextMe]}>{user.name} {isMe && '(Tú)'}</Text>
                    <Text style={[styles.listPoints, isMe && styles.listPointsMe]}>{user.ecoPoints} pts</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  
  header: { marginBottom: theme.spacing.m, marginTop: theme.spacing.s },
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
});
