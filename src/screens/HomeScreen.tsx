import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Animated, Image, Alert } from 'react-native';
import { Leaf, Gift, Trophy, Activity, ArrowRight, ScanLine, Medal } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { userService } from '../api/services/user.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { RecycleService } from '../api/services/recycle.service';
import { API_BASE_URL } from '../api/apiClient';

export const HomeScreen = ({ navigation }: any) => {
  const slideAnim1 = useRef(new Animated.Value(30)).current;
  const slideAnim2 = useRef(new Animated.Value(30)).current;
  const slideAnim3 = useRef(new Animated.Value(30)).current;
  
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;

  const [user, setUser] = useState<User | null>(null);
  const [recycleCount, setRecycleCount] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    const createAnimation = (slide: Animated.Value, fade: Animated.Value) => {
      return Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true })
      ]);
    };

    Animated.stagger(150, [
      createAnimation(slideAnim1, fadeAnim1),
      createAnimation(slideAnim2, fadeAnim2),
      createAnimation(slideAnim3, fadeAnim3),
    ]).start();

    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      try {
        const liveUser = await userService.getMe();
        setUser(liveUser);
        await AsyncStorage.setItem('@user_data', JSON.stringify(liveUser));
      } catch (e) {
        const userData = await AsyncStorage.getItem('@user_data');
        if (userData) setUser(JSON.parse(userData));
      }

      const history = await RecycleService.getHistory();
      setRecycleCount(history.length);
      setTotalWeight(history.reduce((sum, item) => sum + (item.totalWeight || (item as any).weight || 0), 0));
    } catch (error) {
      console.error(error);
    }
  };

  const getInitials = (nameStr: string) => {
    if (!nameStr) return '??';
    return nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getFirstName = (nameStr: string) => {
    if (!nameStr) return '';
    return nameStr.split(' ')[0];
  };

  const currentPoints = user?.ecoPoints || 0;
  const targetPoints = 2000;
  const progressPercent = Math.min((currentPoints / targetPoints) * 100, 100).toFixed(1);

  const getLevelInfo = (points: number) => {
    if (points < 500) return { level: 'Nivel 1', title: 'Principiante' };
    if (points < 1000) return { level: 'Nivel 2', title: 'Eco Amigo' };
    if (points < 2000) return { level: 'Nivel 3', title: 'Reciclador' };
    return { level: 'Nivel 4', title: 'Eco Hero' };
  };

  const levelInfo = getLevelInfo(currentPoints);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }]}>
          <View>
            <Text style={styles.greeting}>Hola, {getFirstName(user?.name || 'Estudiante')}</Text>
            <Text style={styles.subtitle}>Hoy puedes hacer la diferencia.</Text>
          </View>
          <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={() => navigation.navigate('Perfil')}>
            {user?.profilePicture ? (
              <Image source={{ uri: `${API_BASE_URL}${user.profilePicture}` }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(user?.name || '')}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Points Card */}
        <Animated.View style={[{ opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }]}>
          <TouchableOpacity style={styles.pointsCard} activeOpacity={0.9} onPress={() => navigation.navigate('Puntos')}>
            <View style={styles.pointsHeader}>
              <Text style={styles.pointsTitle}>MIS PUNTOS</Text>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
            <Text style={styles.pointsValue}>{currentPoints}</Text>
            <Text style={styles.pointsSubtitle}>puntos</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>{progressPercent}% completado</Text>
                <Text style={styles.progressLabel}>Meta: {targetPoints} puntos</Text>
              </View>
            </View>

            <Text style={styles.pointsHint}>
              Sigue reciclando para alcanzar tu próxima recompensa.
            </Text>
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
              <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
                <Activity size={20} color={theme.colors.accent} />
              </View>
              <Text style={styles.statValue}>{recycleCount}</Text>
              <Text style={styles.statLabel}>Reciclajes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
              <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                <Leaf size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{totalWeight} kg</Text>
              <Text style={styles.statLabel}>Material</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.8}>
              <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
                <Trophy size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statValue}>{levelInfo.level}</Text>
              <Text style={styles.statLabel}>{levelInfo.title}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Action Button & Reward */}
        <Animated.View style={[{ opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }]}>
          <Button 
            title="Registrar reciclaje" 
            icon={<ScanLine size={20} color={theme.colors.white} />}
            onPress={() => navigation.navigate('Reciclar')} 
            style={styles.actionButton}
          />
          
          <Button 
            title="Ver Ranking EcoUNAN" 
            icon={<Medal size={20} color={theme.colors.primary} />}
            onPress={() => navigation.navigate('Ranking')} 
            style={[styles.actionButton, { backgroundColor: '#F1F5F9' }]}
            textStyle={{ color: theme.colors.primary }}
          />

          <TouchableOpacity style={styles.rewardCard} activeOpacity={0.8} onPress={() => navigation.navigate('RewardDetail')}>
            <View style={styles.rewardLeft}>
              <View style={styles.rewardIconBg}>
                <Gift size={24} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.rewardTitle}>Kit EcoUNAN</Text>
                <Text style={styles.rewardSubtitle}>Te faltan 750 puntos</Text>
              </View>
            </View>
            <View style={styles.rewardRight}>
              <Text style={styles.rewardLink}>Ver recompensa</Text>
              <ArrowRight size={16} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  content: { padding: theme.spacing.m, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    marginTop: theme.spacing.s,
  },
  greeting: { ...theme.typography.h2 },
  subtitle: { ...theme.typography.bodySecondary, marginTop: 2 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarText: { fontWeight: 'bold', fontSize: 16, color: theme.colors.primary },
  avatarImage: { width: 48, height: 48, borderRadius: 24, resizeMode: 'cover' },
  
  pointsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    marginBottom: theme.spacing.m,
    ...theme.shadows.soft,
  },
  pointsHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  pointsTitle: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary },
  premiumText: { fontSize: 12, fontWeight: '700', color: '#F59E0B' },
  pointsValue: { fontSize: 48, fontWeight: '800', color: theme.colors.primary, textAlign: 'center', marginTop: theme.spacing.m },
  pointsSubtitle: { textAlign: 'center', color: theme.colors.textSecondary, marginBottom: theme.spacing.l },
  
  progressContainer: { marginBottom: theme.spacing.m },
  progressBarBg: { height: 8, backgroundColor: theme.colors.surface, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
  pointsHint: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.s },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.l },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    marginHorizontal: 4,
    ...theme.shadows.soft,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary },

  actionButton: { marginBottom: theme.spacing.l, ...theme.shadows.soft },

  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.l,
    ...theme.shadows.soft,
  },
  rewardLeft: { flexDirection: 'row', alignItems: 'center' },
  rewardIconBg: { width: 48, height: 48, borderRadius: 8, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.m },
  rewardTitle: { fontWeight: 'bold', fontSize: 16, color: theme.colors.primary },
  rewardSubtitle: { fontSize: 14, color: theme.colors.textSecondary },
  rewardRight: { flexDirection: 'row', alignItems: 'center' },
  rewardLink: { fontWeight: 'bold', fontSize: 14, color: theme.colors.primary, marginRight: 4 },
});
