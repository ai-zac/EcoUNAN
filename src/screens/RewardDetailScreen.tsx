import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { ArrowLeft, Gift, AlertCircle, CheckCircle } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';

export const RewardDetailScreen = ({ navigation }: any) => {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Recompensa</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          <View style={styles.imageContainer}>
            <Gift size={80} color="#F59E0B" />
          </View>

          <View style={styles.infoCard}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Kit EcoUNAN</Text>
              <Text style={styles.pointsCost}>2,000 pts</Text>
            </View>
            <Text style={styles.description}>
              Un kit especial que incluye una botella reutilizable de acero inoxidable, una libreta de papel reciclado y una camiseta con el logo de EcoUNAN.
            </Text>

            <View style={styles.alertBox}>
              <AlertCircle size={20} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.alertText}>Te faltan 750 puntos para canjear</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Términos y condiciones</Text>
          <View style={styles.termsList}>
            <View style={styles.termItem}>
              <CheckCircle size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.termText}>El canje se realiza en oficinas centrales.</Text>
            </View>
            <View style={styles.termItem}>
              <CheckCircle size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.termText}>Válido hasta agotar existencias.</Text>
            </View>
            <View style={styles.termItem}>
              <CheckCircle size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.termText}>Solo un kit por semestre por estudiante.</Text>
            </View>
          </View>

        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <Button 
          title="Canjear recompensa" 
          disabled={true} // Se habilita solo cuando tengan los 2000 pts
          onPress={() => {}} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.s, paddingBottom: theme.spacing.m },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...theme.typography.h3 },
  
  container: { padding: theme.spacing.m, paddingBottom: 100 },
  
  imageContainer: {
    height: 200,
    backgroundColor: '#FEF3C7',
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.l,
    ...theme.shadows.soft,
  },
  
  infoCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.5)',
    marginBottom: theme.spacing.l,
    ...theme.shadows.soft,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.s },
  title: { ...theme.typography.h2 },
  pointsCost: { fontSize: 16, fontWeight: 'bold', color: '#F59E0B' },
  description: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing.m },
  
  alertBox: { flexDirection: 'row', backgroundColor: '#FEF3C7', padding: theme.spacing.m, borderRadius: 8, alignItems: 'center' },
  alertText: { flex: 1, color: '#B45309', fontWeight: 'bold' },

  sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.m },
  termsList: { paddingHorizontal: theme.spacing.s },
  termItem: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.s },
  termText: { ...theme.typography.body, color: theme.colors.textSecondary },

  footer: { padding: theme.spacing.m, backgroundColor: theme.colors.white, borderTopWidth: 1, borderTopColor: theme.colors.border },
});
