import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, Dimensions } from 'react-native';
import { ArrowLeft, Check, Lock, Trophy } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';
import { LEAGUES, getUserRank } from '../utils/ranks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TouchableOpacity } from 'react-native';

const { height } = Dimensions.get('window');

export const LeaguePathScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [lifetimePoints, setLifetimePoints] = useState(0);
  const scrollY = new Animated.Value(0);

  useEffect(() => {
    AsyncStorage.getItem('@user_data').then(data => {
      if (data) {
        const parsed = JSON.parse(data);
        setLifetimePoints(parsed.lifetimePoints || parsed.ecoPoints || 0);
      }
    });
  }, []);

  const rankData = getUserRank(lifetimePoints);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camino de Ligas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Tu Progreso Histórico</Text>
          <Text style={styles.heroPoints}>{lifetimePoints}</Text>
          <Text style={styles.heroSub}>Puntos EcoUNAN totales</Text>
        </View>

        <View style={styles.pathContainer}>
          {}
          <View style={styles.connectorLineBg} />
          
          {LEAGUES.map((league, index) => {
            const isUnlocked = lifetimePoints >= league.minPoints;
            const isCurrent = rankData.currentRank.id === league.id;
            
            
            const nextLeague = LEAGUES[index + 1];
            let lineFillHeight = 0;
            
            if (nextLeague) {
              if (lifetimePoints >= nextLeague.minPoints) {
                lineFillHeight = 100; 
              } else if (isCurrent) {
                lineFillHeight = rankData.progressPercentage; 
              }
            }

            return (
              <View key={league.id} style={styles.nodeWrapper}>
                
                {}
                <View style={styles.nodeLeft}>
                  {isUnlocked && (
                    <Text style={styles.nodeTitle}>{league.name}</Text>
                  )}
                  {isCurrent && nextLeague && (
                    <Text style={styles.nodeSubtitle}>
                      Faltan {rankData.pointsNeeded} pts para {nextLeague.name}
                    </Text>
                  )}
                </View>

                {}
                <View style={styles.nodeCenter}>
                  <View style={[
                    styles.nodeCircle, 
                    isUnlocked ? { backgroundColor: league.color, borderColor: league.color } : styles.nodeLocked
                  ]}>
                    <Text style={styles.nodeIcon}>{isUnlocked ? league.icon : <Lock size={20} color="#94A3B8" />}</Text>
                  </View>
                  
                  {isCurrent && (
                    <View style={styles.currentNodeGlow} />
                  )}
                </View>

                {}
                <View style={styles.nodeRight}>
                  <Text style={[styles.pointsLabel, isUnlocked && { color: league.color, fontWeight: 'bold' }]}>
                    {league.minPoints} pts
                  </Text>
                </View>

                {}
                {index < LEAGUES.length - 1 && (
                  <View style={[
                    styles.connectorLineFill, 
                    { height: `${lineFillHeight}%`, backgroundColor: league.color }
                  ]} />
                )}

              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <Trophy size={32} color="#D97706" />
            <Text style={styles.footerTitle}>¿Cómo subo de Liga?</Text>
            <Text style={styles.footerDesc}>
              Tu rango se basa en el TOTAL histórico de puntos que has recolectado reciclando. 
              ¡Canjear recompensas no bajará tu nivel de liga!
            </Text>
          </View>
        </View>
        
      </ScrollView>
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
    paddingVertical: theme.spacing.m,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  container: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...theme.shadows.medium,
    marginBottom: 40,
    zIndex: 10,
  },
  heroTitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroPoints: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
  },
  heroSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pathContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  connectorLineBg: {
    position: 'absolute',
    top: 40,
    bottom: 40,
    left: '50%',
    width: 4,
    marginLeft: -2,
    backgroundColor: colors.border,
    zIndex: 1,
  },
  nodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 120, 
    width: '100%',
    zIndex: 2,
  },
  nodeLeft: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  nodeRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  nodeCenter: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  nodeLocked: {
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  nodeIcon: {
    fontSize: 28,
  },
  currentNodeGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    zIndex: 1,
  },
  connectorLineFill: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 4,
    marginLeft: -2,
    zIndex: 2,
  },
  nodeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  nodeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'right',
  },
  pointsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  footer: {
    padding: theme.spacing.m,
    marginTop: 20,
  },
  footerCard: {
    backgroundColor: '#FEF3C7',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginTop: 12,
    marginBottom: 8,
  },
  footerDesc: {
    fontSize: 13,
    color: '#B45309',
    textAlign: 'center',
    lineHeight: 20,
  }
});
