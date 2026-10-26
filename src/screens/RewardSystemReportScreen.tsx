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
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Gift,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react-native';
import { apiClient } from '../api/apiClient';
import { useThemeColors } from '../context/ThemeContext';
import {
  DATE_PRESETS,
  DatePreset,
  downloadAndShareReport,
  formatReportDateTime,
  getPresetDates,
  useRequireAdminAccess,
} from '../utils/reportUtils';

type RedemptionStatusFilter = 'all' | 'completed' | 'pending' | 'cancelled';

interface RewardReportKpis {
  pointsGenerated: number;
  pointsRedeemed: number;
  redemptionRate: number;
  totalRedemptions: number;
  completedRedemptions: number;
  pendingRedemptions: number;
  cancelledRedemptions: number;
  activeCatalogCount: number;
}

interface WeeklyPointsTrendItem {
  weekKey: string;
  label: string;
  pointsGenerated: number;
  pointsRedeemed: number;
  cumulativePoints: number;
}

interface RewardCatalogItem {
  id: string;
  title: string;
  pointsCost: number;
  stock: number;
  isActive: boolean;
  redemptionCount: number;
  completedCount: number;
  totalPointsSpent: number;
}

interface RecentRedemptionItem {
  id: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  statusLabel: string;
  pointsSpent: number;
  rewardTitle: string;
  student: {
    name: string;
    faculty: string | null;
    career: string | null;
  };
}

interface RewardReportSummaryData {
  filters: Record<string, string | undefined>;
  kpis: RewardReportKpis;
  weeklyTrend: WeeklyPointsTrendItem[];
  catalog: RewardCatalogItem[];
  recent: {
    items: RecentRedemptionItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_OPTIONS: { key: RedemptionStatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'completed', label: 'Entregados' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'cancelled', label: 'Cancelados' },
];

export const RewardSystemReportScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useRequireAdminAccess(navigation);

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [statusFilter, setStatusFilter] = useState<RedemptionStatusFilter>('all');
  const [page, setPage] = useState<number>(1);

  const [summary, setSummary] = useState<RewardReportSummaryData | null>(null);
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
    return params;
  }, [datePreset, statusFilter, page]);

  const fetchSummary = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await apiClient.get('/reports/rewards/summary', { params: queryParams });
        if (res.data?.success) {
          setSummary(res.data.data);
        } else {
          setErrorMsg(res.data?.error || 'No se pudo cargar el reporte de recompensas.');
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
        reportSlug: 'rewards',
        format,
        filenamePrefix: 'reporte-recompensas',
        dialogTitle:
          format === 'excel'
            ? 'Exportar Sistema de Recompensas (Excel)'
            : 'Exportar Sistema de Recompensas (PDF)',
        params: {
          startDate: dates.startDate,
          endDate: dates.endDate,
          status: statusFilter,
        },
      });
    } catch (err: any) {
      console.error('[Reward Report Export Error]', err);
      Alert.alert(
        'Error al exportar',
        err?.message || 'No se pudo descargar el archivo. Intenta nuevamente.',
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const kpis: RewardReportKpis = summary?.kpis ?? {
    pointsGenerated: 0,
    pointsRedeemed: 0,
    redemptionRate: 0,
    totalRedemptions: 0,
    completedRedemptions: 0,
    pendingRedemptions: 0,
    cancelledRedemptions: 0,
    activeCatalogCount: 0,
  };

  // Gráfico de línea "Tendencia Semanal de Puntos"
  const renderWeeklyPointsChart = () => {
    const rawWeeks = summary?.weeklyTrend ?? [];
    if (rawWeeks.length === 0) {
      return (
        <Text style={styles.emptySectionText}>
          No hay puntos registrados en este rango para mostrar la tendencia semanal.
        </Text>
      );
    }

    const points =
      rawWeeks.length === 1
        ? [
            {
              weekKey: 'prev',
              label: 'Semana 1',
              pointsGenerated: 0,
              pointsRedeemed: 0,
              cumulativePoints: 0,
            },
            {
              ...rawWeeks[0],
              label: 'Semana 2',
            },
          ]
        : rawWeeks;

    const chartWidth = Math.max(280, windowWidth - 72);
    const chartHeight = 195;
    const padLeft = 46;
    const padRight = 22;
    const padTop = 22;
    const padBottom = 32;
    const plotW = chartWidth - padLeft - padRight;
    const plotH = chartHeight - padTop - padBottom;

    const values = points.map((p) => p.cumulativePoints);
    const maxVal = Math.max(100, ...values);
    const stepY = Math.ceil(maxVal / 4);
    const topYVal = stepY * 4;

    const coords = points.map((p, idx) => {
      const x =
        points.length === 1
          ? padLeft + plotW / 2
          : padLeft + (idx / (points.length - 1)) * plotW;
      const y = padTop + plotH - (p.cumulativePoints / topYVal) * plotH;
      return { x, y, label: p.label, value: p.cumulativePoints };
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
                  {tick.toLocaleString()}
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

          <Path d={pathD} fill="none" stroke="#64748B" strokeWidth={2.5} />

          {coords.map((c, idx) => (
            <React.Fragment key={`${c.label}-${idx}`}>
              <Circle
                cx={c.x}
                cy={c.y}
                r={4.8}
                fill="#475569"
                stroke="#FFFFFF"
                strokeWidth={1.5}
              />
              <SvgText
                x={c.x}
                y={c.y - 9}
                fontSize="11"
                fontWeight="bold"
                fill={colors.text}
                textAnchor="middle"
              >
                {c.value.toLocaleString()}
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

  const renderStatusBadge = (status: RecentRedemptionItem['status']) => {
    if (status === 'completed') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
          <Text style={[styles.statusBadgeText, { color: '#15803D' }]}>Entregado</Text>
        </View>
      );
    }
    if (status === 'pending') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>Pendiente</Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
        <Text style={[styles.statusBadgeText, { color: '#B91C1C' }]}>Cancelado</Text>
      </View>
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
          <Text style={styles.headerTitle}>EcoUNAN - Sistema de Recompensas</Text>
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
            <Text style={styles.filterSectionLabel}>Periodo</Text>
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
            <Text style={styles.filterSectionLabel}>Estado de Canje</Text>
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
            <Text style={styles.loadingText}>Consultando sistema de recompensas...</Text>
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
            {/* Tarjetas principales de KPIs (fiel al diseño de referencia) */}
            <View style={styles.summaryTopGrid}>
              <View style={styles.mockupCard}>
                <Text style={styles.mockupCardLabel}>Puntos Generados</Text>
                <Text style={styles.mockupGreenBigNumber}>
                  {kpis.pointsGenerated.toLocaleString()}
                </Text>
                <Text style={styles.mockupCardSub}>
                  Canjeados: {kpis.pointsRedeemed.toLocaleString()} pts
                </Text>
              </View>

              <View style={styles.mockupCard}>
                <Text style={styles.mockupCardLabel}>Tasa de Canje</Text>
                <Text style={styles.mockupGreenBigNumber}>{kpis.redemptionRate}%</Text>
                <Text style={styles.mockupCardSub}>
                  {kpis.totalRedemptions} canjes ({kpis.completedRedemptions} entregados)
                </Text>
              </View>
            </View>

            {/* Gráfico de línea: Tendencia Semanal de Puntos */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <TrendingUp size={18} color="#15803D" />
                <Text style={styles.sectionTitle}>Tendencia Semanal de Puntos</Text>
              </View>
              {renderWeeklyPointsChart()}
            </View>

            {/* Tabla: Catálogo de Recompensas (fiel al diseño de referencia) */}
            <View style={styles.catalogCard}>
              <Text style={styles.catalogHeaderTitle}>Catálogo de Recompensas</Text>
              <View style={styles.catalogTableHead}>
                <Text style={[styles.catalogHeadText, { flex: 1.5 }]}>Artículo</Text>
                <Text style={[styles.catalogHeadText, { flex: 0.8, textAlign: 'right' }]}>
                  Puntos
                </Text>
                <Text style={[styles.catalogHeadText, { flex: 0.7, textAlign: 'right' }]}>
                  Canjes
                </Text>
              </View>
              {summary?.catalog && summary.catalog.length > 0 ? (
                summary.catalog.map((item) => (
                  <View key={item.id} style={styles.catalogRow}>
                    <View style={{ flex: 1.5, paddingRight: 8 }}>
                      <Text style={styles.catalogItemTitle}>{item.title}</Text>
                      <Text style={styles.catalogItemSub}>
                        {item.stock < 0 ? 'Stock ilimitado' : `Stock: ${item.stock}`} ·{' '}
                        {item.isActive ? 'Activo' : 'Inactivo'}
                      </Text>
                    </View>
                    <Text style={[styles.catalogItemPoints, { flex: 0.8, textAlign: 'right' }]}>
                      {item.pointsCost.toLocaleString()} pts
                    </Text>
                    <Text style={[styles.catalogItemCount, { flex: 0.7, textAlign: 'right' }]}>
                      {item.redemptionCount}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySectionText}>No hay recompensas en el catálogo.</Text>
              )}
            </View>

            {/* Listado paginado de Canjes Recientes */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <ShoppingBag size={18} color={colors.text} />
                <Text style={styles.sectionTitle}>
                  Canjes Recientes ({summary?.recent?.total ?? 0})
                </Text>
              </View>

              {summary?.recent?.items && summary.recent.items.length > 0 ? (
                <>
                  {summary.recent.items.map((item) => (
                    <View key={item.id} style={styles.redemptionCard}>
                      <View style={styles.redemptionTopRow}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Gift size={15} color="#15803D" />
                            <Text style={styles.redemptionReward}>{item.rewardTitle}</Text>
                          </View>
                          <Text style={styles.redemptionStudent}>
                            {item.student.name}
                            {item.student.faculty ? ` · ${item.student.faculty}` : ''}
                          </Text>
                        </View>
                        {renderStatusBadge(item.status)}
                      </View>

                      <View style={styles.redemptionFooter}>
                        <Text style={styles.redemptionDate}>
                          {formatReportDateTime(item.date)}
                        </Text>
                        <Text style={styles.redemptionPoints}>
                          -{item.pointsSpent.toLocaleString()} pts
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
                  No se encontraron canjes para los filtros seleccionados.
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
      marginBottom: 14,
    },
    mockupCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      justifyContent: 'space-between',
    },
    mockupCardLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    mockupGreenBigNumber: {
      fontSize: 28,
      fontWeight: '900',
      color: '#15803D',
      marginVertical: 6,
    },
    mockupCardSub: {
      fontSize: 11,
      color: colors.textSecondary,
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
    catalogCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginBottom: 14,
    },
    catalogHeaderTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#15803D',
      textAlign: 'center',
      marginBottom: 12,
    },
    catalogTableHead: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: 4,
    },
    catalogHeadText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    catalogRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    catalogItemTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    catalogItemSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    catalogItemPoints: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    catalogItemCount: {
      fontSize: 13,
      fontWeight: '700',
      color: '#15803D',
    },
    redemptionCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    redemptionTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    redemptionReward: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    redemptionStudent: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
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
    redemptionFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
    },
    redemptionDate: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    redemptionPoints: {
      fontSize: 12,
      fontWeight: '700',
      color: '#B45309',
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

export default RewardSystemReportScreen;
