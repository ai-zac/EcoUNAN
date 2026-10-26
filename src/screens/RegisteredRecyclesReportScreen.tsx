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
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileDown,
  FileSpreadsheet,
  FileText,
  Layers,
  Recycle,
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

type StatusFilter = 'all' | 'validated' | 'pending' | 'rejected';
type MaterialFilter = 'all' | 'pet' | 'aluminio' | 'papel' | 'carton' | 'plastico';

interface ReportKpis {
  total: number;
  validated: number;
  pending: number;
  rejected: number;
  validationRate: number;
  ecoPointsAwarded: number;
  totalWeightKg: number;
}

interface MaterialBreakdownItem {
  material: string;
  label: string;
  count: number;
  weightKg: number;
  points: number;
}

interface FacultyBreakdownItem {
  faculty: string;
  total: number;
  validated: number;
  weightKg: number;
}

interface TimeSeriesItem {
  period: string;
  total: number;
  validated: number;
  pending: number;
  rejected: number;
}

interface RecentRecycleItem {
  id: string;
  date: string;
  status: 'pending' | 'validated' | 'rejected';
  student: {
    name: string;
    faculty: string | null;
    career: string | null;
  };
  materials: { material: string; weightKg: number }[];
  totalWeightKg: number;
  points: number;
}

interface ReportSummaryData {
  filters: {
    startDate?: string;
    endDate?: string;
    status?: string;
    faculty?: string;
    material?: string;
    granularity: 'day' | 'month';
  };
  kpis: ReportKpis;
  timeSeries: TimeSeriesItem[];
  byMaterial: MaterialBreakdownItem[];
  byFaculty: FacultyBreakdownItem[];
  recent: {
    items: RecentRecycleItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'validated', label: 'Validados' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'rejected', label: 'Rechazados' },
];

const MATERIAL_OPTIONS: { key: MaterialFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pet', label: 'PET' },
  { key: 'aluminio', label: 'Aluminio' },
  { key: 'papel', label: 'Papel' },
  { key: 'carton', label: 'Cartón' },
  { key: 'plastico', label: 'Plástico' },
];

const MATERIAL_NAMES: Record<string, string> = {
  pet: 'PET',
  aluminio: 'Aluminio',
  papel: 'Papel',
  carton: 'Cartón',
  plastico: 'Plástico',
};

export const RegisteredRecyclesReportScreen = ({ navigation }: any) => {
  const colors = useThemeColors();
  const { width: windowWidth } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useRequireAdminAccess(navigation);

  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [materialFilter, setMaterialFilter] = useState<MaterialFilter>('all');
  const [page, setPage] = useState<number>(1);

  const [summary, setSummary] = useState<ReportSummaryData | null>(null);
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
    if (materialFilter !== 'all') params.material = materialFilter;
    return params;
  }, [datePreset, statusFilter, materialFilter, page]);

  const fetchSummary = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMsg(null);

      try {
        const res = await apiClient.get('/reports/recycles/summary', { params: queryParams });
        if (res.data?.success) {
          setSummary(res.data.data);
        } else {
          setErrorMsg(res.data?.error || 'No se pudo cargar el reporte.');
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
        reportSlug: 'recycles',
        format,
        filenamePrefix: 'reporte-reciclajes',
        dialogTitle:
          format === 'excel'
            ? 'Exportar Reporte de Reciclajes (Excel)'
            : 'Exportar Reporte de Reciclajes (PDF)',
        params: {
          startDate: dates.startDate,
          endDate: dates.endDate,
          status: statusFilter,
          material: materialFilter,
        },
      });
    } catch (err: any) {
      console.error('[Recycle Report Export Error]', err);
      Alert.alert(
        'Error al exportar',
        err?.message || 'No se pudo descargar el archivo. Intenta nuevamente.',
      );
    } finally {
      setExportingFormat(null);
    }
  };

  const kpis: ReportKpis = summary?.kpis ?? {
    total: 0,
    validated: 0,
    pending: 0,
    rejected: 0,
    validationRate: 0,
    ecoPointsAwarded: 0,
    totalWeightKg: 0,
  };

  const maxMaterialCount = useMemo(
    () => Math.max(1, ...(summary?.byMaterial?.map((m) => m.count) ?? [1])),
    [summary?.byMaterial],
  );

  const maxFacultyCount = useMemo(
    () => Math.max(1, ...(summary?.byFaculty?.map((f) => f.total) ?? [1])),
    [summary?.byFaculty],
  );

  const renderTimeSeriesChart = () => {
    const points = summary?.timeSeries?.slice(-6) ?? [];
    if (points.length === 0) return null;

    const chartWidth = Math.max(280, windowWidth - 72);
    const chartHeight = 170;
    const padLeft = 32;
    const padRight = 14;
    const padTop = 20;
    const padBottom = 30;
    const plotW = chartWidth - padLeft - padRight;
    const plotH = chartHeight - padTop - padBottom;

    const maxVal = Math.max(4, ...points.map((p) => p.total));
    const stepY = Math.ceil(maxVal / 4);
    const topYVal = stepY * 4;
    const slotW = plotW / points.length;
    const barW = Math.min(34, Math.max(16, slotW * 0.52));

    const yTicks = [0, stepY, stepY * 2, stepY * 3, topYVal];

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
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

          {points.map((pt, idx) => {
            const cx = padLeft + idx * slotW + slotW / 2;
            const barH = Math.max(4, (pt.total / topYVal) * plotH);
            const y = padTop + plotH - barH;
            const shortPeriod = pt.period.length > 7 ? pt.period.slice(5) : pt.period;
            return (
              <React.Fragment key={pt.period}>
                <Rect
                  x={cx - barW / 2}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={5}
                  fill="#15803D"
                />
                <SvgText
                  x={cx}
                  y={y - 5}
                  fontSize="10"
                  fontWeight="bold"
                  fill={colors.text}
                  textAnchor="middle"
                >
                  {pt.total}
                </SvgText>
                <SvgText
                  x={cx}
                  y={padTop + plotH + 16}
                  fontSize="10"
                  fill={colors.textSecondary}
                  textAnchor="middle"
                >
                  {shortPeriod}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>
    );
  };

  const renderStatusBadge = (status: RecentRecycleItem['status']) => {
    if (status === 'validated') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#DCFCE7' }]}>
          <Text style={[styles.statusBadgeText, { color: '#15803D' }]}>Validado</Text>
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
        <Text style={[styles.statusBadgeText, { color: '#B91C1C' }]}>Rechazado</Text>
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
          <Text style={styles.headerTitle}>Reciclajes Registrados</Text>
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
            <Text style={styles.filterSectionLabel}>Estado</Text>
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
            <Layers size={15} color={colors.textSecondary} />
            <Text style={styles.filterSectionLabel}>Material</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {MATERIAL_OPTIONS.map((opt) => {
              const active = materialFilter === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setPage(1);
                    setMaterialFilter(opt.key);
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
            <Text style={styles.loadingText}>Consultando microservicio de reportes...</Text>
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
            {/* Tarjetas de KPIs (Resumen) */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Recycle size={18} color="#15803D" />
                </View>
                <Text style={styles.kpiValue}>{kpis.total.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Total Registrados</Text>
                <Text style={styles.kpiHint}>{kpis.totalWeightKg.toLocaleString()} kg en total</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBadge, { backgroundColor: '#DBEAFE' }]}>
                  <CheckCircle2 size={18} color="#1D4ED8" />
                </View>
                <Text style={styles.kpiValue}>{kpis.validated.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Validados</Text>
                <Text style={styles.kpiHint}>Tasa: {kpis.validationRate}%</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Clock size={18} color="#B45309" />
                </View>
                <Text style={styles.kpiValue}>{kpis.pending.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Pendientes</Text>
                <Text style={styles.kpiHint}>Rechazados: {kpis.rejected}</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBadge, { backgroundColor: '#F3E8FF' }]}>
                  <Award size={18} color="#7E22CE" />
                </View>
                <Text style={styles.kpiValue}>{kpis.ecoPointsAwarded.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>EcoPoints Otorgados</Text>
                <Text style={styles.kpiHint}>En reciclajes validados</Text>
              </View>
            </View>

            {/* Desglose por Material */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Layers size={18} color="#15803D" />
                <Text style={styles.sectionTitle}>Desglose por Material</Text>
              </View>
              {summary?.byMaterial && summary.byMaterial.length > 0 ? (
                summary.byMaterial.map((item) => {
                  const pct = Math.round((item.count / maxMaterialCount) * 100);
                  return (
                    <View key={item.material} style={styles.progressItem}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>{item.label}</Text>
                        <Text style={styles.progressMeta}>
                          {item.count} reg. · {item.weightKg} kg · {item.points} pts
                        </Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${Math.max(6, pct)}%` }]} />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptySectionText}>
                  Sin registros de materiales en este filtro.
                </Text>
              )}
            </View>

            {/* Desglose por Facultad */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Building2 size={18} color="#1D4ED8" />
                <Text style={styles.sectionTitle}>Participación por Facultad</Text>
              </View>
              {summary?.byFaculty && summary.byFaculty.length > 0 ? (
                summary.byFaculty.map((fac) => {
                  const pct = Math.round((fac.total / maxFacultyCount) * 100);
                  return (
                    <View key={fac.faculty} style={styles.progressItem}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel} numberOfLines={1}>
                          {fac.faculty}
                        </Text>
                        <Text style={styles.progressMeta}>
                          {fac.total} ({fac.validated} val.) · {fac.weightKg} kg
                        </Text>
                      </View>
                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${Math.max(6, pct)}%`, backgroundColor: '#2563EB' },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptySectionText}>Sin datos por facultad en este periodo.</Text>
              )}
            </View>

            {/* Serie temporal con gráfico SVG + detalle */}
            {summary?.timeSeries && summary.timeSeries.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <TrendingUp size={18} color="#0F766E" />
                  <Text style={styles.sectionTitle}>
                    Tendencia ({summary.filters.granularity === 'day' ? 'Por día' : 'Por mes'})
                  </Text>
                </View>
                {renderTimeSeriesChart()}
                {summary.timeSeries.slice(-6).map((point) => (
                  <View key={point.period} style={styles.timelineRow}>
                    <Text style={styles.timelinePeriod}>{point.period}</Text>
                    <Text style={styles.timelineValues}>
                      Total: <Text style={styles.boldText}>{point.total}</Text> · Val:{' '}
                      <Text style={{ color: '#15803D', fontWeight: '600' }}>{point.validated}</Text>{' '}
                      · Pend:{' '}
                      <Text style={{ color: '#B45309', fontWeight: '600' }}>{point.pending}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Lista de Registros Recientes */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <FileDown size={18} color={colors.text} />
                <Text style={styles.sectionTitle}>
                  Registros Recientes ({summary?.recent?.total ?? 0})
                </Text>
              </View>

              {summary?.recent?.items && summary.recent.items.length > 0 ? (
                <>
                  {summary.recent.items.map((item) => {
                    const materialsText = item.materials
                      .map(
                        (m) => `${MATERIAL_NAMES[m.material] || m.material} (${m.weightKg} kg)`,
                      )
                      .join(', ');

                    return (
                      <View key={item.id} style={styles.recordCard}>
                        <View style={styles.recordTopRow}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={styles.recordStudent}>{item.student.name}</Text>
                            <Text style={styles.recordFaculty} numberOfLines={1}>
                              {item.student.faculty || 'Sin facultad'}
                              {item.student.career ? ` · ${item.student.career}` : ''}
                            </Text>
                          </View>
                          {renderStatusBadge(item.status)}
                        </View>

                        <Text style={styles.recordMaterials}>{materialsText}</Text>

                        <View style={styles.recordFooter}>
                          <Text style={styles.recordDate}>{formatReportDateTime(item.date)}</Text>
                          <Text style={styles.recordPoints}>
                            {item.totalWeightKg} kg · +{item.points} EcoPoints
                          </Text>
                        </View>
                      </View>
                    );
                  })}

                  {/* Paginación */}
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
                  No se encontraron reciclajes para los filtros seleccionados.
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
      fontSize: 20,
      fontWeight: '700',
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
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    kpiCard: {
      width: '48.3%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    kpiIconBadge: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    kpiValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
    },
    kpiLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 2,
    },
    kpiHint: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14,
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
    timelineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    timelinePeriod: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    timelineValues: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    boldText: {
      fontWeight: '700',
      color: colors.text,
    },
    recordCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },
    recordTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    recordStudent: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    recordFaculty: {
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
    recordMaterials: {
      fontSize: 13,
      color: colors.text,
      marginBottom: 8,
    },
    recordFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
    },
    recordDate: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    recordPoints: {
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

export default RegisteredRecyclesReportScreen;
