import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Animated,
  Switch,
} from 'react-native';
import {
  ArrowLeft,
  Moon,
  Lock,
  ShieldCheck,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useThemeColors, useThemeMode } from '../context/ThemeContext';
import { PolicyModal } from '../components/PolicyModal';

export const SettingsScreen = ({ navigation }: any) => {
  const { isDark, toggle } = useThemeMode();
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [policyTab, setPolicyTab] = useState<'terms' | 'privacy'>('privacy');

  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

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
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View
          style={[styles.menuContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.menuItem}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#64748B30' : '#F1F5F9' }]}>
              <Moon size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Modo Oscuro</Text>
              <Text style={styles.description}>Cambia la apariencia de la app</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={isDark ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#F59E0B25' : '#FEF3C7' }]}>
              <Lock size={20} color="#F59E0B" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Cambiar contraseña</Text>
              <Text style={styles.description}>Actualiza tu contraseña</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              setPolicyTab('privacy');
              setPolicyModalVisible(true);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#10B98125' : '#D1FAE5' }]}>
              <ShieldCheck size={20} color="#10B981" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Privacidad y Seguridad</Text>
              <Text style={styles.description}>Gestiona tus datos y políticas</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => {
              setPolicyTab('terms');
              setPolicyModalVisible(true);
            }}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? '#8B5CF625' : '#EDE9FE' }]}>
              <FileText size={20} color="#8B5CF6" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>Términos de Servicio</Text>
              <Text style={styles.description}>Consulta el marco legal de EcoUNAN</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>EcoUNAN · Versión 1.0.0 Oficial</Text>
          <Text style={styles.footerSubtext}>Universidad Nacional Autónoma de Nicaragua</Text>
        </View>
      </ScrollView>

      <PolicyModal
        visible={policyModalVisible}
        onClose={() => setPolicyModalVisible(false)}
        initialTab={policyTab}
      />
    </SafeAreaView>
  );
};

const useStyles = (colors: typeof theme.colors) =>
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
    container: { padding: theme.spacing.m },
    menuContainer: {
      backgroundColor: colors.surface,
      borderRadius: theme.borderRadius.l,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: theme.spacing.m,
      ...theme.shadows.medium,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.l,
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.m,
    },
    textContainer: { flex: 1 },
    title: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
    description: { fontSize: 13, color: colors.textSecondary },
    divider: { height: 1, backgroundColor: colors.border },
    footerNote: {
      marginTop: theme.spacing.xl,
      alignItems: 'center',
    },
    footerText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    footerSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
