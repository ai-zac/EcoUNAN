import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { Check, Gift, User as UserIcon, ArrowLeft } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { useThemeColors } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export const RedemptionSuccessScreen = ({ navigation, route }: any) => {
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const redemptionRecord = route.params?.redemption;
  const reward = redemptionRecord?.reward || {};
  const user = redemptionRecord?.user || {};
  const pointsSpent = redemptionRecord?.pointsSpent || 0;

  const circleScale = useRef(new Animated.Value(30)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(circleScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(contentFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleGoHome = async () => {
    navigation.replace('AdminDashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoHome}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entrega Confirmada</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topSection}>
          <View style={styles.circleContainer}>
            <Animated.View style={[styles.greenCircle, { transform: [{ scale: circleScale }] }]} />
            <Animated.View style={{ opacity: contentFade, position: 'absolute' }}>
              <Check size={60} color="#FFFFFF" strokeWidth={2.5} />
            </Animated.View>
          </View>

          <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }], alignItems: 'center' }}>
            <Text style={styles.title}>¡Canje completado!</Text>
            <Text style={styles.description}>
              La recompensa ha sido entregada{'\n'}al estudiante exitosamente.
            </Text>
          </Animated.View>
        </View>

        {/* Details Card */}
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }], flex: 1 }}>
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>DETALLES DEL CANJE</Text>
              <Text style={styles.cardSuccess}>✓ Entregado</Text>
            </View>

            {/* User row */}
            <View style={styles.itemRow}>
              <View style={[styles.itemIconBg, { backgroundColor: '#DBEAFE' }]}>
                <UserIcon size={24} color="#2563EB" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>Estudiante</Text>
                <Text style={styles.itemQuantity}>{user.name || 'Estudiante EcoUNAN'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Reward row */}
            <View style={styles.itemRow}>
              <View style={[styles.itemIconBg, { backgroundColor: '#FEF3C7' }]}>
                <Gift size={24} color="#D97706" />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>Recompensa</Text>
                <Text style={styles.itemQuantity}>{reward.title || 'Incentivo EcoUNAN'}</Text>
              </View>
              <Text style={styles.itemPoints}>-{pointsSpent} pts</Text>
            </View>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={{ opacity: contentFade, paddingBottom: theme.spacing.m, gap: 10, marginTop: 20 }}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleGoHome}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>Volver al Panel Admin</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => navigation.navigate('AdminRedemptions')}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonText}>Ver registro de canjes</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  container: { flexGrow: 1, padding: theme.spacing.m, paddingBottom: 40 },
  topSection: { alignItems: 'center', marginTop: 24, marginBottom: 30 },
  circleContainer: {
    width: 130,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  greenCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#16A34A',
    position: 'absolute',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: { fontSize: 28, fontWeight: '900', color: colors.text, textAlign: 'center', marginBottom: 8 },
  description: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  detailsCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    ...theme.shadows.soft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.8 },
  cardSuccess: { fontSize: 13, fontWeight: '800', color: '#16A34A' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 2 },
  itemQuantity: { fontSize: 13, color: colors.textSecondary },
  itemPoints: { fontSize: 16, fontWeight: '900', color: '#EF4444' },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
});
