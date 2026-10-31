import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Percent,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { apiClient } from '../api/apiClient';
import { useThemeColors } from '../context/ThemeContext';
import {
  DATE_PRESETS,
  DatePreset,
  downloadAndShareReport,
  getPresetDates,
  useRequireAdminAccess,
} from '../utils/reportUtils';

type StatusFilter = 'all' | 'active' | 'inactive';
type RoleFilter = 'all' | 'user' | 'brigadista' | 'admin' | 'superadmin';

interface UserReportKpis {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  activeUsersRate: number;
  activeThisMonth: number;
  activeRecyclers: number;
  totalEcoPoints: number;
  totalLifetimePoints: number;
}

interface MonthlyUserPoint {
  period: string;
  monthLabel: string;
  newUsers: number;
  activeUsers: number;
  cumulativeActive: number;
}

interface UserFacultyBreakdown {
  faculty: string;
  total: number;
  active: number;
  ecoPoints: number;
}

interface UserRoleBreakdown {
  role: string;
  label: string;
  total: number;
  active: number;
}

interface UserListItem {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  role: string;
  roleLabel: string;
  isActive: boolean;
  faculty: string | null;
  career: string | null;
  ecoPoints: number;
  lifetimePoints: number;
  recycleCount: number;
  totalWeightKg: number;
  createdAt: string;
}

interface UserReportSummaryData {
  filters: Record<string, string | undefined>;
  kpis: UserReportKpis;
  monthlyEvolution: MonthlyUserPoint[];
  byFaculty: UserFacultyBreakdown[];
  byRole: UserRoleBreakdown[];
  recent: {
    items: UserListItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'inactive', label: 'Inactivos' },
];

const ROLE_OPTIONS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'user', label: 'Estudiantes' },
  { key: 'brigadista', label: 'Brigadistas' },
  { key: 'admin', label: 'Admins' },
  { key: 'superadmin', label: 'Superadmins' },
];

export const UserSummaryReportScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useRequireAdminAccess(navigation);

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [page, setPage] = useState<number>(1);

  const [summary, setSummary] = useState<UserReportSummaryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportingFormat, setExportingFormat] = useState<'excel' | 'pdf' | null>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = {
      ...getPresetDates(datePreset),
      page,
      limit: 10,
    };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (roleFilter !== 'all') params.role = roleFilter;
    return params;
  }, [datePreset, statusFilter, roleFilter, page]);

  const fetchSummary = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await apiClient.get('/reports/users/summary', { params: queryParams });
        if (res.data?.success) {
          setSummary(res.data.data);
        } else {
          setErrorMsg(res.data?.error || 'No se pudo cargar el reporte de usuarios.');
        }
      } catch (err: any) {
        const backendError = err?.response?.data?.error;
        setErrorMsg(
          backendError ||
            'No se pudo conectar con el microservicio de reportes (puerto 5001). Verifica que esté activo.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [queryParams],
  );

  useEffect(() => {
    fetchSummary(false);
  }, [fetchSummary]);

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (exportingFormat) return;
    setExportingFormat(format);

    try {
      const dates = getPresetDates(datePreset);
      await downloadAndShareReport({
        reportSlug: 'users',
        format,
        filenamePrefix: 'reporte-usuarios',
        dialogTitle:
          format === 'excel'
            ? 'Exportar Resumen de Usuarios (Excel)'
            : 'Exportar Resumen de Usuarios (PDF)',
        params: {
          startDate: dates.startDate,
          endDate: dates.endDate,
          status: statusFilter,
          role: roleFilter,
        },
      });
    } catch (err: any) {
      console.error('[User Report Export Error]', err);
      Alert.alert(
        'Error al exportar',
        err?.message || 'No se pudo descargar el archivo. Intenta nuevamente.',
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const kpis: UserReportKpis = summary?.kpis ?? {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    activeUsersRate: 0,
    activeThisMonth: 0,
    activeRecyclers: 0,
    totalEcoPoints: 0,
    totalLifetimePoints: 0,
  };

  const maxFacultyTotal = useMemo(
    () => Math.max(1, ...(summary?.byFaculty?.map((f) => f.total) ?? [1])),
    [summary?.byFaculty],
  );

  const maxRoleTotal = useMemo(
    () => Math.max(1, ...(summary?.byRole?.map((r) => r.total) ?? [1])),
    [summary?.byRole],
  );

  // Renderizado del gráfico de línea "Evolución Mensual de Usuarios Activos"
  const renderMonthlyLineChart = () => {
    const rawPoints = summary?.monthlyEvolution?.slice(-9) ?? [];
    if (rawPoints.length === 0) {
      return (
        <Text style={styles.emptySectionText}>
          No hay datos suficientes para graficar la evolución mensual.
        </Text>
      );
    }

    const points =
      rawPoints.length === 1
        ? [
            {
              period: 'Inicio',
              monthLabel: 'Inicio',
              newUsers: 0,
              activeUsers: 0,
              cumulativeActive: 0,
            },
            ...rawPoints,
          ]
        : rawPoints;

    const chartWidth = Math.max(280, windowWidth - 72);
    const chartHeight = 190;
    const padLeft = 36;
    const padRight = 18;
    const padTop = 18;
    const padBottom = 32;
    const plotW = chartWidth - padLeft - padRight;
    const plotH = chartHeight - padTop - padBottom;

    const values = points.map((p) => p.cumulativeActive);
    const maxVal = Math.max(5, ...values);
    const stepY = Math.ceil(maxVal / 4);
    const topYVal = stepY * 4;

    const coords = points.map((p, idx) => {
      const x =
        points.length === 1
          ? padLeft + plotW / 2
          : padLeft + (idx / (points.length - 1)) * plotW;
      const y = padTop + plotH - (p.cumulativeActive / topYVal) * plotH;
      return { x, y, label: p.monthLabel, value: p.cumulativeActive };
    });

    const pathD = coords
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ');

    const yTicks = [0, stepY, stepY * 2, stepY * 3, topYVal];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={chartWidth} height={chartHeight}>
          {yTicks.map((tick) => {
            const y = padTop + plotH - (tick / topYVal) * plotH;
            return (
              <React.Fragment key={tick}>
                <Line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={padLeft - 6}
                  y={y + 4}
                  fontSize="10"
                  fill={colors.textSecondary}
                  textAnchor="end"
                >
                  {tick}
                </SvgText>
              </React.Fragment>
            );
          })}

          <Line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={padTop + plotH}
            stroke={colors.border}
            strokeWidth={1.2}
          />

          <Path d={pathD} fill="none" stroke="#15803D" strokeWidth={2.5} />

          {coords.map((c, idx) => (
            <React.Fragment key={`${c.label}-${idx}`}>
              <Circle
                cx={c.x}
                cy={c.y}
                r={4.5}
                fill="#9CA3AF"
                stroke="#15803D"
                strokeWidth={1.8}
              />
              <SvgText
                x={c.x}
                y={c.y - 8}
                fontSize="10"
                fontWeight="bold"
                fill={colors.text}
                textAnchor="middle"
              >
                {c.value}
              </SvgText>
              <SvgText
                x={c.x}
                y={padTop + plotH + 18}
                fontSize="11"
                fill={colors.textSecondary}
                textAnchor="middle"
              >
                {c.label}
              </SvgText>
            </React.Fragment>
          ))}
        </Svg>
      </ScrollView>
    );
  };

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
          <Text style={styles.headerTitle}>EcoUNAN - Resumen de Usuarios</Text>
          <Text style={styles.headerSubtitle}>Microservicio de Reportes · EcoUNAN</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSummary(true)}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de Filtros */}
        <View style={styles.filterCard}>
          <View style={styles.filterLabelRow}>
            <Calendar size={15} color={colors.textSecondary} />
            <Text style={styles.filterSectionLabel}>Periodo de Registro</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {DATE_PRESETS.map((preset) => {
              const active = datePreset === preset.key;
              return (
                <TouchableOpacity
                  key={preset.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setPage(1);
                    setDatePreset(preset.key);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.filterLabelRow, { marginTop: 10 }]}>
            <CheckCircle2 size={15} color={colors.textSecondary} />
            <Text style={styles.filterSectionLabel}>Estado de Cuenta</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {STATUS_OPTIONS.map((opt) => {
              const active = statusFilter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setPage(1);
                    setStatusFilter(opt.key);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.filterLabelRow, { marginTop: 10 }]}>
            <ShieldCheck size={15} color={colors.textSecondary} />
            <Text style={styles.filterSectionLabel}>Rol</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {ROLE_OPTIONS.map((opt) => {
              const active = roleFilter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setPage(1);
                    setRoleFilter(opt.key);
                  }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Botones de Exportación (Excel y PDF) */}
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={[
              styles.exportBtn,
              styles.exportExcelBtn,
              exportingFormat !== null && styles.exportBtnDisabled,
            ]}
            onPress={() => handleExport('excel')}
            disabled={exportingFormat !== null}
            activeOpacity={0.8}
          >
            {exportingFormat === 'excel' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FileSpreadsheet size={18} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Exportar Excel</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.exportBtn,
              styles.exportPdfBtn,
              exportingFormat !== null && styles.exportBtnDisabled,
            ]}
            onPress={() => handleExport('pdf')}
            disabled={exportingFormat !== null}
            activeOpacity={0.8}
          >
            {exportingFormat === 'pdf' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <FileText size={18} color="#FFFFFF" />
                <Text style={styles.exportBtnText}>Exportar PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Consultando resumen de usuarios...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo cargar el reporte</Text>
            <Text style={styles.errorBody}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchSummary(false)}>
              <Text style={styles.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Bloque de Tarjetas de Resumen (fiel al diseño de referencia) */}
            <View style={styles.summaryTopGrid}>
              <View style={styles.mockupCard}>
                <Text style={styles.mockupCardLabel}>Usuarios Registrados:</Text>
                <Text style={styles.mockupBigNumber}>{kpis.totalUsers.toLocaleString()}</Text>
                <Text style={styles.mockupCardSub}>
                  {kpis.activeRecyclers.toLocaleString()} con reciclajes
                </Text>
              </View>

              <View style={styles.mockupCard}>
                <View style={styles.rateRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mockupCardLabel}>Tasa de Usuarios</Text>
                    <Text style={styles.mockupRateValue}>Activos: {kpis.activeUsersRate}%</Text>
                  </View>
                  <View style={styles.percentCircle}>
                    <Percent size={18} color="#FFFFFF" />
                  </View>
                </View>
                <Text style={styles.mockupCardSub}>
                  {kpis.activeUsers} activos · {kpis.inactiveUsers} inactivos
                </Text>
              </View>
            </View>

            {/* Tarjeta 3: Resumen del Mes */}
            <View style={styles.monthSummaryCard}>
              <Text style={styles.monthSummaryTitle}>Resumen del Mes</Text>
              <View style={styles.monthSummaryGrid}>
                <View style={styles.monthSummaryItem}>
                  <Text style={styles.monthSummaryLabel}>Total en Grupo:</Text>
                  <Text style={styles.monthSummaryValue}>{kpis.totalUsers.toLocaleString()}</Text>
                </View>
                <View style={styles.monthSummaryItem}>
                  <Text style={styles.monthSummaryLabel}>Activos este Mes:</Text>
                  <Text style={[styles.monthSummaryValue, { color: '#15803D' }]}>
                    {kpis.activeThisMonth.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.monthSummaryItem}>
                  <Text style={styles.monthSummaryLabel}>EcoPoints Totales:</Text>
                  <Text style={styles.monthSummaryValue}>
                    {kpis.totalEcoPoints.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Gráfico Central: Evolución Mensual de Usuarios Activos */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <TrendingUp size={18} color="#15803D" />
                <Text style={styles.sectionTitle}>Evolución Mensual de Usuarios Activos</Text>
              </View>
              {renderMonthlyLineChart()}
            </View>

            {/* Desglose por Facultad */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Building2 size={18} color="#1D4ED8" />
                <Text style={styles.sectionTitle}>Usuarios por Facultad</Text>
              </View>
              {summary?.byFaculty && summary.byFaculty.length > 0 ? (
                summary.byFaculty.map((fac) => {
                  const pct = Math.round((fac.total / maxFacultyTotal) * 100);
                  return (
                    <View key={fac.faculty} style={styles.progressItem}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel} numberOfLines={1}>
                          {fac.faculty}
                        </Text>
                        <Text style={styles.progressMeta}>
                          {fac.total} ({fac.active} act.) · {fac.ecoPoints.toLocaleString()} pts
                        </Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(6, pct)}%`, backgroundColor: '#15803D' },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptySectionText}>Sin datos por facultad.</Text>
              )}
            </View>

            {/* Desglose por Rol */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <UserCheck size={18} color="#7E22CE" />
                <Text style={styles.sectionTitle}>Distribución por Rol</Text>
              </View>
              {summary?.byRole && summary.byRole.length > 0 ? (
                summary.byRole.map((r) => {
                  const pct = Math.round((r.total / maxRoleTotal) * 100);
                  return (
                    <View key={r.role} style={styles.progressItem}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>{r.label}</Text>
                        <Text style={styles.progressMeta}>
                          {r.total} usuarios ({r.active} activos)
                        </Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(6, pct)}%`, backgroundColor: '#7E22CE' },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptySectionText}>Sin datos por rol.</Text>
              )}
            </View>

            {/* Lista paginada de Usuarios */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Users size={18} color={colors.text} />
                <Text style={styles.sectionTitle}>
                  Listado de Usuarios ({summary?.recent?.total ?? 0})
                </Text>
              </View>

              {summary?.recent?.items && summary.recent.items.length > 0 ? (
                <>
                  {summary.recent.items.map((u) => (
                    <View key={u.id} style={styles.userCard}>
                      <View style={styles.userTopRow}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.userName}>{u.name}</Text>
                          <Text style={styles.userEmail}>{u.email}</Text>
                          <Text style={styles.userFaculty} numberOfLines={1}>
                            {u.faculty || 'Sin facultad'}
                            {u.career ? ` · ${u.career}` : ''}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: u.isActive ? '#DCFCE7' : '#FEE2E2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: u.isActive ? '#15803D' : '#B91C1C' },
                            ]}
                          >
                            {u.isActive ? 'Activo' : 'Inactivo'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.userFooter}>
                        <Text style={styles.userRoleTag}>
                          Rol: {u.roleLabel} · {u.recycleCount} reciclajes ({u.totalWeightKg} kg)
                        </Text>
                        <Text style={styles.userPoints}>
                          {u.ecoPoints.toLocaleString()} EcoPoints
                        </Text>
                      </View>
                    </View>
                  ))}

                  {summary.recent.totalPages > 1 && (
                    <View style={styles.paginationRow}>
                      <TouchableOpacity
                        style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
                        disabled={page <= 1}
                        onPress={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft size={18} color={colors.text} />
                        <Text style={styles.pageBtnText}>Anterior</Text>
                      </TouchableOpacity>

                      <Text style={styles.pageIndicator}>
                        Página {summary.recent.page} de {summary.recent.totalPages}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.pageBtn,
                          page >= summary.recent.totalPages && styles.pageBtnDisabled,
                        ]}
                        disabled={page >= summary.recent.totalPages}
                        onPress={() =>
                          setPage((p) => Math.min(summary.recent.totalPages, p + 1))
                        }
                      >
                        <Text style={styles.pageBtnText}>Siguiente</Text>
                        <ChevronRight size={18} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.emptySectionText}>
                  No se encontraron usuarios para los filtros seleccionados.
                </Text>
              )}
            </View>
          </>
        )}
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
      fontSize: 18,
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
    filterCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    filterLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    filterSectionLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    chipsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: '#15803D',
      borderColor: '#15803D',
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    chipTextActive: {
      color: '#FFFFFF',
    },
    exportRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    exportBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
    },
    exportExcelBtn: {
      backgroundColor: '#15803D',
    },
    exportPdfBtn: {
      backgroundColor: '#0F172A',
    },
    exportBtnDisabled: {
      opacity: 0.65,
    },
    exportBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    centerBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
    },
    errorCard: {
      backgroundColor: '#FEF2F2',
      borderColor: '#FECACA',
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
    },
    errorTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#991B1B',
      marginBottom: 6,
    },
    errorBody: {
      fontSize: 13,
      color: '#7F1D1D',
      textAlign: 'center',
      marginBottom: 14,
    },
    retryBtn: {
      backgroundColor: '#DC2626',
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 10,
    },
    retryBtnText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13,
    },
    summaryTopGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 12,
    },
    mockupCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'space-between',
    },
    mockupCardLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    mockupBigNumber: {
      fontSize: 28,
      fontWeight: '900',
      color: colors.text,
      textAlign: 'right',
      marginVertical: 4,
    },
    rateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    mockupRateValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginTop: 2,
    },
    percentCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#15803D',
      alignItems: 'center',
      justifyContent: 'center',
    },
    mockupCardSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 6,
    },
    monthSummaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 14,
    },
    monthSummaryTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
    },
    monthSummaryGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    monthSummaryItem: {
      alignItems: 'center',
    },
    monthSummaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 3,
    },
    monthSummaryValue: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 14,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    emptySectionText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 10,
    },
    progressItem: {
      marginBottom: 12,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
      gap: 8,
    },
    progressLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    progressMeta: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    progressBarTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 999,
      backgroundColor: '#15803D',
    },
    userCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    userTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    userName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    userEmail: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    userFaculty: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    userFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
    },
    userRoleTag: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    userPoints: {
      fontSize: 12,
      fontWeight: '700',
      color: '#15803D',
    },
    paginationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingTop: 8,
    },
    pageBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    pageBtnDisabled: {
      opacity: 0.4,
    },
    pageBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    pageIndicator: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
  });

export default UserSummaryReportScreen;
