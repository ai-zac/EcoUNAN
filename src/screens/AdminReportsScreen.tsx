import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Gift,
  Recycle,
  Users,
} from 'lucide-react-native';
import { useThemeColors } from '../context/ThemeContext';
import { useRequireAdminAccess } from '../utils/reportUtils';

interface ReportOption {
  id: string;
  route: 'RegisteredRecyclesReport' | 'UserSummaryReport' | 'RewardSystemReport';
  title: string;
  subtitle: string;
  badge: string;
  accentColor: string;
  badgeBg: string;
  icon: React.ReactNode;
  highlights: string[];
}

export const AdminReportsScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useRequireAdminAccess(navigation);

  const reportOptions: ReportOption[] = [
    {
      id: 'recycles',
      route: 'RegisteredRecyclesReport',
      title: 'Cantidad de Reciclajes Registrados',
      subtitle:
        'Analiza el volumen de reciclaje, tasa de validación, materiales recolectados y participación por facultad.',
      badge: 'Reciclaje',
      accentColor: '#15803D',
      badgeBg: '#DCFCE7',
      icon: <Recycle size={24} color="#15803D" />,
      highlights: ['KPIs y tendencia SVG', 'Desglose por material y facultad', 'Excel y PDF'],
    },
    {
      id: 'users',
      route: 'UserSummaryReport',
      title: 'Resumen de Usuarios',
      subtitle:
        'Consulta el total de usuarios registrados, tasa de usuarios activos, evolución mensual y distribución por rol.',
      badge: 'Comunidad',
      accentColor: '#1D4ED8',
      badgeBg: '#DBEAFE',
      icon: <Users size={24} color="#1D4ED8" />,
      highlights: ['Evolución mensual SVG', 'Activos del mes y por facultad', 'Excel y PDF'],
    },
    {
      id: 'rewards',
      route: 'RewardSystemReport',
      title: 'Sistema de Recompensas',
      subtitle:
        'Monitorea los EcoPoints generados, tasa de canje, tendencia semanal de puntos y estado del catálogo.',
      badge: 'Recompensas',
      accentColor: '#B45309',
      badgeBg: '#FEF3C7',
      icon: <Gift size={24} color="#B45309" />,
      highlights: ['Tendencia semanal de puntos', 'Catálogo y canjes recientes', 'Excel y PDF'],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Centro de Reportes</Text>
          <Text style={styles.headerSubtitle}>Microservicio de Analítica · EcoUNAN</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner superior */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconWrap}>
            <BarChart3 size={26} color="#15803D" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Reportes Ejecutivos UNAN</Text>
            <Text style={styles.heroDescription}>
              Selecciona el reporte que deseas consultar. Todos los reportes incluyen filtros en
              tiempo real y exportación directa a Excel (.xlsx) y PDF.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Reportes disponibles ({reportOptions.length})</Text>

        {/* Tarjetas de los 3 reportes */}
        {reportOptions.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.reportCard}
            activeOpacity={0.82}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.iconBox, { backgroundColor: item.badgeBg }]}>
                {item.icon}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.titleRow}>
                  <View style={[styles.badgePill, { backgroundColor: item.badgeBg }]}>
                    <Text style={[styles.badgePillText, { color: item.accentColor }]}>
                      {item.badge}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </View>
              <View style={styles.chevronCircle}>
                <ChevronRight size={20} color={colors.text} />
              </View>
            </View>

            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>

            <View style={styles.cardFooter}>
              <View style={styles.tagsWrap}>
                {item.highlights.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.formatsIcons}>
                <FileSpreadsheet size={15} color="#15803D" />
                <FileText size={15} color="#475569" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useThemeColors>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    heroBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
      gap: 14,
    },
    heroIconWrap: {
      width: 50,
      height: 50,
      borderRadius: 14,
      backgroundColor: '#DCFCE7',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    heroDescription: {
      fontSize: 12.5,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12,
    },
    reportCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    iconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    badgePill: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 999,
    },
    badgePillText: {
      fontSize: 11,
      fontWeight: '700',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    chevronCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginLeft: 8,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 14,
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      flex: 1,
      paddingRight: 8,
    },
    tagChip: {
      backgroundColor: colors.background,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    formatsIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
  });

export default AdminReportsScreen;
