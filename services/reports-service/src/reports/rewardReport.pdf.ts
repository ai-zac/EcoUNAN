import PDFDocument from 'pdfkit';
import {
  RedemptionExportRow,
  RewardReportFilters,
  RewardReportSummary,
  describeRewardFilters,
  describeRewardRange,
  formatDateTime,
} from './rewardReport.query';

const GREEN = '#15803D';
const GREEN_LIGHT = '#F0FDF4';
const GRAY_TEXT = '#4B5563';
const GRAY_LINE = '#D1D5DB';
const DARK = '#111827';
const MARGIN = 40;

type Doc = PDFKit.PDFDocument;

const fit = (doc: Doc, text: string, width: number): string => {
  if (doc.widthOfString(text) <= width) return text;
  let t = text;
  while (t.length > 1 && doc.widthOfString(`${t}…`) > width) t = t.slice(0, -1);
  return `${t}…`;
};

const nf = (n: number, decimals = 0) =>
  n.toLocaleString('es-NI', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const drawHeader = (doc: Doc, filters: RewardReportFilters, generatedBy: string) => {
  const w = doc.page.width - MARGIN * 2;
  doc.rect(0, 0, doc.page.width, 70).fill(GREEN);
  doc
    .fillColor('#FFFFFF')
    .font('Helvetica-Bold')
    .fontSize(18)
    .text('EcoUNAN - Reporte del Sistema de Recompensas', MARGIN, 18, { width: w });
  doc
    .font('Helvetica')
    .fontSize(10)
    .text('Universidad Nacional Autónoma de Nicaragua (UNAN) · Programa EcoUNAN', MARGIN, 44, {
      width: w,
    });

  let y = 86;
  const line = (label: string, value: string) => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor(DARK).text(`${label}:`, MARGIN, y, { continued: true });
    doc.font('Helvetica').fillColor(GRAY_TEXT).text(` ${value}`);
    y += 14;
  };
  line('Fecha de generación', `${formatDateTime(new Date())} (hora de Nicaragua)`);
  line('Generado por', generatedBy);
  line('Rango filtrado', describeRewardRange(filters));
  line('Filtros', describeRewardFilters(filters));

  return y + 8;
};

const drawKpis = (doc: Doc, summary: RewardReportSummary, y: number) => {
  const { kpis } = summary;
  const cards: [string, string][] = [
    ['Puntos Generados', nf(kpis.pointsGenerated)],
    ['Tasa de Canje', `${nf(kpis.redemptionRate, 1)} %`],
    ['Puntos Canjeados', nf(kpis.pointsRedeemed)],
    ['Total Canjes', nf(kpis.totalRedemptions)],
    ['Entregados', nf(kpis.completedRedemptions)],
    ['Catálogo Activo', nf(kpis.activeCatalogCount)],
  ];

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(GREEN)
    .text('Indicadores del Sistema de Recompensas', MARGIN, y);
  y += 18;

  const gap = 8;
  const totalW = doc.page.width - MARGIN * 2;
  const cardW = (totalW - gap * (cards.length - 1)) / cards.length;
  const cardH = 48;

  cards.forEach(([label, value], i) => {
    const x = MARGIN + i * (cardW + gap);
    doc.roundedRect(x, y, cardW, cardH, 6).fillAndStroke(GREEN_LIGHT, GRAY_LINE);
    doc
      .fillColor(GRAY_TEXT)
      .font('Helvetica')
      .fontSize(8)
      .text(label, x + 6, y + 8, { width: cardW - 12, align: 'center', lineBreak: false });
    doc
      .fillColor(DARK)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text(fit(doc, value, cardW - 12), x + 6, y + 24, {
        width: cardW - 12,
        align: 'center',
        lineBreak: false,
      });
  });

  return y + cardH + 16;
};

const drawBreakdowns = (doc: Doc, summary: RewardReportSummary, y: number) => {
  const totalW = doc.page.width - MARGIN * 2;
  const colW = (totalW - 20) / 2;
  const rowH = 15;

  const mini = (
    x: number,
    title: string,
    headers: [string, string, string],
    rows: [string, string, string][],
  ) => {
    let yy = y;
    doc.font('Helvetica-Bold').fontSize(11).fillColor(GREEN).text(title, x, yy);
    yy += 16;
    const widths = [colW * 0.5, colW * 0.25, colW * 0.25];
    doc.rect(x, yy, colW, rowH).fill(GREEN);
    let cx = x;
    headers.forEach((h, i) => {
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(h, cx + 4, yy + 4, {
          width: widths[i] - 8,
          align: i === 0 ? 'left' : 'right',
          lineBreak: false,
        });
      cx += widths[i];
    });
    yy += rowH;
    if (rows.length === 0) rows = [['Sin datos', '—', '—']];
    rows.forEach((r, idx) => {
      if (idx % 2 === 1) doc.rect(x, yy, colW, rowH).fill(GREEN_LIGHT);
      let cx2 = x;
      r.forEach((v, i) => {
        doc
          .fillColor(DARK)
          .font('Helvetica')
          .fontSize(8)
          .text(fit(doc, v, widths[i] - 8), cx2 + 4, yy + 4, {
            width: widths[i] - 8,
            align: i === 0 ? 'left' : 'right',
            lineBreak: false,
          });
        cx2 += widths[i];
      });
      yy += rowH;
    });
    return yy;
  };

  const yA = mini(
    MARGIN,
    'Tendencia Semanal de Puntos',
    ['Semana', 'Puntos Semanales', 'Acumulado'],
    summary.weeklyTrend.map((w) => [
      `${w.label} (${w.weekKey})`,
      `${nf(w.pointsGenerated || w.pointsRedeemed)} pts`,
      `${nf(w.cumulativePoints)} pts`,
    ]),
  );

  const yB = mini(
    MARGIN + colW + 20,
    'Catálogo de Recompensas',
    ['Artículo', 'Puntos', 'Canjes'],
    summary.catalog.slice(0, 8).map((c) => [
      c.title,
      `${nf(c.pointsCost)} pts`,
      nf(c.redemptionCount),
    ]),
  );

  return Math.max(yA, yB) + 20;
};

const TABLE_COLS: {
  header: string;
  key: keyof RedemptionExportRow;
  weight: number;
  align: 'left' | 'center' | 'right';
}[] = [
  { header: 'Fecha', key: 'date', weight: 1.15, align: 'left' },
  { header: 'Estudiante', key: 'student', weight: 1.8, align: 'left' },
  { header: 'Facultad', key: 'faculty', weight: 1.7, align: 'left' },
  { header: 'Carrera', key: 'career', weight: 1.5, align: 'left' },
  { header: 'Artículo Canjeado', key: 'rewardTitle', weight: 1.9, align: 'left' },
  { header: 'Puntos', key: 'pointsSpent', weight: 0.9, align: 'right' },
  { header: 'Estado', key: 'status', weight: 0.9, align: 'center' },
];

const drawTable = (doc: Doc, rows: RedemptionExportRow[], truncated: boolean, startY: number) => {
  const totalW = doc.page.width - MARGIN * 2;
  const sumW = TABLE_COLS.reduce((a, c) => a + c.weight, 0);
  const widths = TABLE_COLS.map((c) => (c.weight / sumW) * totalW);
  const rowH = 16;
  const bottom = doc.page.height - MARGIN - 20;

  let y = startY;

  const tableHeader = () => {
    doc.rect(MARGIN, y, totalW, rowH + 2).fill(GREEN);
    let x = MARGIN;
    TABLE_COLS.forEach((c, i) => {
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(c.header, x + 4, y + 5, { width: widths[i] - 8, align: c.align, lineBreak: false });
      x += widths[i];
    });
    y += rowH + 2;
  };

  if (y + 60 > bottom) {
    doc.addPage();
    y = MARGIN;
  }

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(GREEN)
    .text(`Detalle de canjes (${nf(rows.length)} registros)`, MARGIN, y);
  y += 18;
  if (truncated) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(8)
      .fillColor('#B45309')
      .text('Aviso: se incluyen los 5,000 canjes más recientes.', MARGIN, y);
    y += 14;
  }

  tableHeader();

  if (rows.length === 0) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor(GRAY_TEXT)
      .text('No hay canjes registrados para los filtros seleccionados.', MARGIN, y + 8, {
        width: totalW,
        align: 'center',
      });
    return;
  }

  rows.forEach((row, idx) => {
    if (y + rowH > bottom) {
      doc.addPage();
      y = MARGIN;
      tableHeader();
    }
    if (idx % 2 === 1) doc.rect(MARGIN, y, totalW, rowH).fill(GREEN_LIGHT);
    doc
      .moveTo(MARGIN, y + rowH)
      .lineTo(MARGIN + totalW, y + rowH)
      .lineWidth(0.5)
      .strokeColor(GRAY_LINE)
      .stroke();

    let x = MARGIN;
    TABLE_COLS.forEach((c, i) => {
      const raw = row[c.key];
      const value =
        c.key === 'date'
          ? formatDateTime(raw as Date)
          : typeof raw === 'number'
            ? nf(raw)
            : String(raw ?? '');
      doc
        .fillColor(DARK)
        .font('Helvetica')
        .fontSize(7.5)
        .text(fit(doc, value, widths[i] - 8), x + 4, y + 5, {
          width: widths[i] - 8,
          align: c.align,
          lineBreak: false,
        });
      x += widths[i];
    });
    y += rowH;
  });
};

const drawFooters = (doc: Doc) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const originalBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - MARGIN + 8;
    const w = doc.page.width - MARGIN * 2;
    doc.moveTo(MARGIN, y - 6).lineTo(MARGIN + w, y - 6).lineWidth(0.5).strokeColor(GRAY_LINE).stroke();
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(GRAY_TEXT)
      .text('EcoUNAN · Reporte del Sistema de Recompensas', MARGIN, y, {
        width: w,
        align: 'left',
        lineBreak: false,
      });
    doc.text(`Página ${i - range.start + 1} de ${range.count}`, MARGIN, y, {
      width: w,
      align: 'right',
      lineBreak: false,
    });
    doc.page.margins.bottom = originalBottom;
  }
};

export const buildRewardPdf = (params: {
  filters: RewardReportFilters;
  summary: RewardReportSummary;
  rows: RedemptionExportRow[];
  truncated: boolean;
  generatedBy: string;
}): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const { filters, summary, rows, truncated, generatedBy } = params;
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: MARGIN,
      bufferPages: true,
      info: {
        Title: 'EcoUNAN - Reporte del Sistema de Recompensas',
        Author: 'EcoUNAN',
        Subject: `Rango: ${describeRewardRange(filters)}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      let y = drawHeader(doc, filters, generatedBy);
      y = drawKpis(doc, summary, y);
      y = drawBreakdowns(doc, summary, y);
      drawTable(doc, rows, truncated, y);
      drawFooters(doc);
      doc.end();
    } catch (err) {
      doc.destroy();
      reject(err);
    }
  });

