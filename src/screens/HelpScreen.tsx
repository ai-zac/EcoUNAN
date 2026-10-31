import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  HelpCircle,
  Mail,
  ShieldCheck,
  Award,
  Recycle,
  KeyRound,
  ChevronRight,
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors, useThemeMode } from '../context/ThemeContext';
import { PolicyModal } from '../components/PolicyModal';

export const HelpScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const { isDark } = useThemeMode();
  const styles = useStyles(colors, isDark);

  const [policyVisible, setPolicyVisible] = useState(false);
  const [policyTab, setPolicyTab] = useState<'terms' | 'privacy'>('terms');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  const openPolicies = (tab: 'terms' | 'privacy') => {
    setPolicyTab(tab);
    setPolicyVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Header Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <HelpCircle size={28} color={colors.accent || '#16A34A'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Centro de Ayuda EcoUNAN</Text>
              <Text style={styles.bannerSubtitle}>
                Aprende a reciclar, canjear recompensas y proteger tu cuenta universitaria.
              </Text>
            </View>
          </View>

          {/* Preguntas Frecuentes (FAQ) */}
          <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>

          <View style={styles.faqCard}>
            <View style={styles.faqHeader}>
              <Recycle size={18} color="#16A34A" style={styles.faqIcon} />
              <Text style={styles.faqQuestion}>¿Cómo registro mis entregas de reciclaje?</Text>
            </View>
            <Text style={styles.faqAnswer}>
              Lleva tus botellas PET, latas de aluminio, cartón o plástico limpio a los puntos de
              acopio o brigadistas autorizados en los recintos de la UNAN-Managua. Escanea tu código QR
              o el del centro para registrar el peso y recibir tus EcoPoints inmediatamente.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <View style={styles.faqHeader}>
              <Award size={18} color="#EAB308" style={styles.faqIcon} />
              <Text style={styles.faqQuestion}>¿Cómo canjeo mis EcoPoints por recompensas?</Text>
            </View>
            <Text style={styles.faqAnswer}>
              Ve a la sección 'Premios' en la barra inferior. Selecciona la recompensa deseada y
              presiona 'Canjear'. Se generará un cupón y código QR que podrás presentar en las
              librerías, cafeterías o centros acreditados.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <View style={styles.faqHeader}>
              <KeyRound size={18} color="#3B82F6" style={styles.faqIcon} />
              <Text style={styles.faqQuestion}>¿Cómo cambio o recupero mi contraseña?</Text>
            </View>
            <Text style={styles.faqAnswer}>
              Si olvidaste tu clave, usa el enlace '¿Olvidaste tu contraseña?' en la pantalla de
              inicio de sesión con tu correo institucional. Si ya iniciaste sesión, ve a
              Configuración {'>'} Cambiar contraseña.
            </Text>
          </View>

          {/* Marco Legal y Políticas */}
          <Text style={styles.sectionTitle}>Marco Institucional y Legal</Text>

          <TouchableOpacity
            style={styles.policyRow}
            onPress={() => openPolicies('terms')}
            activeOpacity={0.7}
          >
            <View style={[styles.policyIconBox, { backgroundColor: isDark ? '#16A34A25' : '#DCFCE7' }]}>
              <ShieldCheck size={20} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.policyRowTitle}>Términos y Condiciones de Uso</Text>
              <Text style={styles.policyRowDesc}>Reglas de convivencia y validez de EcoPoints</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.policyRow}
            onPress={() => openPolicies('privacy')}
            activeOpacity={0.7}
          >
            <View style={[styles.policyIconBox, { backgroundColor: isDark ? '#3B82F625' : '#DBEAFE' }]}>
              <ShieldCheck size={20} color="#3B82F6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.policyRowTitle}>Política de Privacidad y Datos</Text>
              <Text style={styles.policyRowDesc}>Protección de información institucional</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Contacto */}
          <Text style={styles.sectionTitle}>Canal de Contacto</Text>
          <View style={styles.contactCard}>
            <Mail size={22} color={colors.accent || '#16A34A'} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.contactTitle}>Soporte Técnico Universitario</Text>
              <Text style={styles.contactEmail}>soporte@ecounan.edu.ni</Text>
              <Text style={styles.contactSchedule}>
                Horario: Lunes a Viernes · 8:00 AM - 5:00 PM
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal de Políticas */}
      <PolicyModal
        visible={policyVisible}
        onClose={() => setPolicyVisible(false)}
        initialTab={policyTab}
      />
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors, isDark: boolean) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.s,
      paddingBottom: theme.spacing.m,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { ...theme.typography.h3, color: colors.text },
    container: { padding: theme.spacing.m, paddingBottom: 40 },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.l,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.l,
      ...theme.shadows.soft,
    },
    bannerIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? '#16A34A25' : '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
    },
    bannerTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 2,
    },
    bannerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: colors.textSecondary,
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    faqCard: {
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    faqHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    faqIcon: {
      marginRight: 8,
    },
    faqQuestion: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    faqAnswer: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    policyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    policyIconBox: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
    },
    policyRowTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
    },
    policyRowDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    contactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: colors.border,
      padding: theme.spacing.m,
      marginTop: 4,
    },
    contactTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
    },
    contactEmail: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.accent || '#16A34A',
      marginTop: 2,
    },
    contactSchedule: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
