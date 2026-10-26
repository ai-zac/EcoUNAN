import ExcelJS from 'exceljs';
import {
  RedemptionExportRow,
  RewardCatalogItem,
  RewardReportFilters,
  RewardReportKpis,
  describeRewardFilters,
  describeRewardRange,
  formatDateTime,
} from './rewardReport.query';

const GREEN = 'FF15803D';
const GREEN_LIGHT = 'FFF0FDF4';
const BORDER = 'FFD1D5DB';

const thin = { style: 'thin' as const, color: { argb: BORDER } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

const COLUMNS: {
  header: string;
  key: keyof RedemptionExportRow;
  numFmt?: string;
  align?: 'left' | 'center' | 'right';
}[] = [
  { header: 'Fecha de Canje', key: 'date', numFmt: 'dd/mm/yyyy hh:mm', align: 'center' },
  { header: 'Estudiante', key: 'student' },
  { header: 'Facultad', key: 'faculty' },
  { header: 'Carrera', key: 'career' },
  { header: 'Artículo Canjeado', key: 'rewardTitle' },
  { header: 'Puntos Gastados', key: 'pointsSpent', numFmt: '#,##0', align: 'right' },
  { header: 'Estado', key: 'status', align: 'center' },
];

const toNicaraguaCellDate = (d: Date) => new Date(new Date(d).getTime() - 6 * 3_600_000);

export const buildRewardExcel = async (params: {
  filters: RewardReportFilters;
  kpis: RewardReportKpis;
  catalog: RewardCatalogItem[];
  rows: RedemptionExportRow[];
  truncated: boolean;
  generatedBy: string;
}): Promise<Buffer> => {
  const { filters, kpis, catalog, rows, truncated, generatedBy } = params;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'EcoUNAN - Servicio de Reportes';
  wb.created = new Date();

  const ws = wb.addWorksheet('Sistema de Recompensas', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });

  const lastCol = COLUMNS.length;

  // Título
  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = 'EcoUNAN · Reporte del Sistema de Recompensas';
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  // Metadatos
  const meta: [string, string][] = [
    ['Generado', `${formatDateTime(new Date())} (hora de Nicaragua)`],
    ['Generado por', generatedBy],
    ['Rango', describeRewardRange(filters)],
    ['Filtros', describeRewardFilters(filters)],
  ];
  let r = 3;
  for (const [label, value] of meta) {
    ws.getCell(r, 1).value = label;
    ws.getCell(r, 1).font = { bold: true };
    ws.mergeCells(r, 2, r, lastCol);
    ws.getCell(r, 2).value = value;
    r++;
  }

  // Bloque de resumen (KPIs)
  r++;
  ws.mergeCells(r, 1, r, lastCol);
  const resumen = ws.getCell(r, 1);
  resumen.value = 'Indicadores del Sistema de Recompensas';
  resumen.font = { bold: true, size: 12, color: { argb: GREEN } };
  r++;

  const kpiRows: [string, number, string?][] = [
    ['Puntos Generados (Reciclajes Validados)', kpis.pointsGenerated, '#,##0'],
    ['Puntos Canjeados', kpis.pointsRedeemed, '#,##0'],
    ['Tasa de Canje', kpis.redemptionRate / 100, '0.0%'],
    ['Total de Canjes Registrados', kpis.totalRedemptions, '#,##0'],
    ['Canjes Entregados', kpis.completedRedemptions, '#,##0'],
    ['Canjes Pendientes', kpis.pendingRedemptions, '#,##0'],
    ['Artículos Activos en Catálogo', kpis.activeCatalogCount, '#,##0'],
  ];

  for (const [label, value, fmt] of kpiRows) {
    ws.mergeCells(r, 1, r, 3);
    const l = ws.getCell(r, 1);
    l.value = label;
    l.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_LIGHT } };
    l.border = allBorders;

    const v = ws.getCell(r, 4);
    v.value = value;
    v.numFmt = fmt ?? 'General';
    v.font = { bold: true };
    v.alignment = { horizontal: 'right' };
    v.border = allBorders;
    r++;
  }

  // Bloque del Catálogo de Recompensas
  r++;
  ws.mergeCells(r, 1, r, lastCol);
  const catTitle = ws.getCell(r, 1);
  catTitle.value = 'Catálogo de Recompensas';
  catTitle.font = { bold: true, size: 12, color: { argb: GREEN } };
  r++;

  const catHeaders = ['Artículo', 'Costo (Puntos)', 'Stock', 'Estado', 'Canjes', 'Puntos Canjeados'];
  const catHeaderRow = ws.getRow(r);
  catHeaders.forEach((h, i) => {
    const cell = catHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    cell.alignment = { horizontal: i === 0 ? 'left' : 'center', vertical: 'middle' };
    cell.border = allBorders;
  });
  catHeaderRow.height = 20;
  r++;

  for (const item of catalog) {
    const row = ws.getRow(r);
    const vals = [
      item.title,
      item.pointsCost,
      item.stock < 0 ? 'Ilimitado' : item.stock,
      item.isActive ? 'Activo' : 'Inactivo',
      item.redemptionCount,
      item.totalPointsSpent,
    ];
    vals.forEach((val, i) => {
      const c = row.getCell(i + 1);
      c.value = val;
      if (typeof val === 'number') c.numFmt = '#,##0';
      c.border = allBorders;
    });
    r++;
  }

  if (truncated) {
    r++;
    ws.mergeCells(r, 1, r, lastCol);
    const warn = ws.getCell(r, 1);
    warn.value = 'Aviso: la tabla de canjes incluye solo los 5,000 registros más recientes.';
    warn.font = { italic: true, color: { argb: 'FFB45309' } };
    r++;
  }

  // Tabla de detalle de canjes
  r += 2;
  const headerRowIdx = r;
  const header = ws.getRow(headerRowIdx);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = allBorders;
  });
  header.height = 22;

  rows.forEach((row, idx) => {
    const excelRow = ws.getRow(headerRowIdx + 1 + idx);
    COLUMNS.forEach((c, i) => {
      const cell = excelRow.getCell(i + 1);
      cell.value = c.key === 'date' ? toNicaraguaCellDate(row.date) : row[c.key];
      if (c.numFmt) cell.numFmt = c.numFmt;
      cell.alignment = { horizontal: c.align ?? 'left', vertical: 'middle' };
      cell.border = allBorders;
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_LIGHT } };
      }
    });
  });

  if (rows.length === 0) {
    ws.mergeCells(headerRowIdx + 1, 1, headerRowIdx + 1, lastCol);
    const empty = ws.getCell(headerRowIdx + 1, 1);
    empty.value = 'No hay canjes registrados para los filtros seleccionados.';
    empty.alignment = { horizontal: 'center' };
    empty.font = { italic: true, color: { argb: 'FF6B7280' } };
  } else {
    ws.autoFilter = {
      from: { row: headerRowIdx, column: 1 },
      to: { row: headerRowIdx + rows.length, column: lastCol },
    };
  }

  COLUMNS.forEach((c, i) => {
    let max = c.header.length;
    for (const row of rows) {
      const v = row[c.key];
      const len =
        c.key === 'date'
          ? 16
          : typeof v === 'number'
            ? v.toLocaleString('es-NI').length
            : String(v ?? '').length;
      if (len > max) max = len;
    }
    ws.getColumn(i + 1).width = Math.min(Math.max(max + 3, 14), 42);
  });

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
};

