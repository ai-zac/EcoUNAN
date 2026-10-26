import ExcelJS from 'exceljs';
import {
  ExportRow,
  ReportFilters,
  ReportKpis,
  describeFilters,
  describeRange,
  formatDateTime,
} from './recycleReport.query';

const GREEN = 'FF15803D';       // verde institucional (legible con texto blanco)
const GREEN_LIGHT = 'FFF0FDF4'; // fondo de filas alternas / resumen
const BORDER = 'FFD1D5DB';

const thin = { style: 'thin' as const, color: { argb: BORDER } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

const COLUMNS: { header: string; key: keyof ExportRow; numFmt?: string; align?: 'left' | 'center' | 'right' }[] = [
  { header: 'Fecha', key: 'date', numFmt: 'dd/mm/yyyy hh:mm', align: 'center' },
  { header: 'Estudiante', key: 'student' },
  { header: 'Facultad', key: 'faculty' },
  { header: 'Carrera', key: 'career' },
  { header: 'Material', key: 'material', align: 'center' },
  { header: 'Peso (kg)', key: 'weightKg', numFmt: '#,##0.00', align: 'right' },
  { header: 'Estado', key: 'status', align: 'center' },
  { header: 'Puntos', key: 'points', numFmt: '#,##0', align: 'right' },
];

/**
 * Excel guarda fechas sin zona horaria. Desplazamos -6 h para que la celda
 * muestre la hora de Nicaragua en lugar de UTC.
 */
const toNicaraguaCellDate = (d: Date) => new Date(new Date(d).getTime() - 6 * 3_600_000);

export const buildRecycleExcel = async (params: {
  filters: ReportFilters;
  kpis: ReportKpis;
  rows: ExportRow[];
  truncated: boolean;
  generatedBy: string;
}): Promise<Buffer> => {
  const { filters, kpis, rows, truncated, generatedBy } = params;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'EcoUNAN - Servicio de Reportes';
  wb.created = new Date();

  const ws = wb.addWorksheet('Reciclajes', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });

  const lastCol = COLUMNS.length;

  // ── Título ──
  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = 'EcoUNAN · Reporte de Cantidad de Reciclajes Registrados';
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } };
  title.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 30;

  // ── Metadatos ──
  const meta: [string, string][] = [
    ['Generado', `${formatDateTime(new Date())} (hora de Nicaragua)`],
    ['Generado por', generatedBy],
    ['Rango', describeRange(filters)],
    ['Filtros', describeFilters(filters)],
  ];
  let r = 3;
  for (const [label, value] of meta) {
    ws.getCell(r, 1).value = label;
    ws.getCell(r, 1).font = { bold: true };
    ws.mergeCells(r, 2, r, lastCol);
    ws.getCell(r, 2).value = value;
    r++;
  }

  // ── Bloque de resumen (KPIs) ──
  r++;
  ws.mergeCells(r, 1, r, lastCol);
  const resumen = ws.getCell(r, 1);
  resumen.value = 'Resumen';
  resumen.font = { bold: true, size: 12, color: { argb: GREEN } };
  r++;

  const kpiRows: [string, number, string?][] = [
    ['Total de reciclajes registrados', kpis.total, '#,##0'],
    ['Validados', kpis.validated, '#,##0'],
    ['Pendientes', kpis.pending, '#,##0'],
    ['Rechazados', kpis.rejected, '#,##0'],
    ['Tasa de validación', kpis.validationRate / 100, '0.0%'],
    ['EcoPoints otorgados (validados)', kpis.ecoPointsAwarded, '#,##0'],
    ['Peso total registrado (kg)', kpis.totalWeightKg, '#,##0.00'],
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

  if (truncated) {
    r++;
    ws.mergeCells(r, 1, r, lastCol);
    const warn = ws.getCell(r, 1);
    warn.value = 'Aviso: la tabla incluye solo los 5,000 reciclajes más recientes. Acota el rango de fechas para ver el resto.';
    warn.font = { italic: true, color: { argb: 'FFB45309' } };
    r++;
  }

  // ── Tabla de detalle ──
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
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN_LIGHT } };
    });
  });

  if (rows.length === 0) {
    ws.mergeCells(headerRowIdx + 1, 1, headerRowIdx + 1, lastCol);
    const empty = ws.getCell(headerRowIdx + 1, 1);
    empty.value = 'No hay reciclajes para los filtros seleccionados.';
    empty.alignment = { horizontal: 'center' };
    empty.font = { italic: true, color: { argb: 'FF6B7280' } };
  } else {
    ws.autoFilter = {
      from: { row: headerRowIdx, column: 1 },
      to: { row: headerRowIdx + rows.length, column: lastCol },
    };
  }

  // Encabezado de tabla fijo al hacer scroll
  ws.views = [{ state: 'frozen', ySplit: headerRowIdx, showGridLines: false }];

  // ── Autoajuste de columnas (según encabezado y datos de la tabla) ──
  COLUMNS.forEach((c, i) => {
    let max = c.header.length;
    for (const row of rows) {
      const v = row[c.key];
      const len = c.key === 'date' ? 16 : typeof v === 'number' ? v.toLocaleString('es-NI').length : String(v ?? '').length;
      if (len > max) max = len;
    }
    ws.getColumn(i + 1).width = Math.min(Math.max(max + 3, 12), 45);
  });

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer as ArrayBuffer);
};

