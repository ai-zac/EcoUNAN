import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  fetchExportRows,
  fetchSummary,
  parseFilters,
  parsePagination,
  todayIso,
} from '../reports/recycleReport.query';
import { buildRecycleExcel } from '../reports/recycleReport.excel';
import { buildRecyclePdf } from '../reports/recycleReport.pdf';

/**
 * Reporte "Cantidad de Reciclajes Registrados" (solo admin / superadmin).
 *
 * Query params comunes (todos opcionales):
 *   startDate, endDate  YYYY-MM-DD en hora de Nicaragua (endDate inclusivo)
 *   status              pending | validated | rejected | all
 *   faculty             nombre exacto de la facultad | all
 *   material            pet | aluminio | papel | carton | plastico | all
 * Solo /summary:
 *   page (1..), limit (1..100, por defecto 10)  -> listado de recientes
 */

const generatedBy = (req: AuthRequest) => req.user?.name ?? 'Administrador';

/** GET /api/reports/recycles/summary */
export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req.query);
    const pagination = parsePagination(req.query);
    const data = await fetchSummary(filters, pagination);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/recycles/export/excel */
export const exportExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req.query);
    const [summary, { rows, truncated }] = await Promise.all([
      fetchSummary(filters, { page: 1, limit: 1 }),
      fetchExportRows(filters),
    ]);

    const buffer = await buildRecycleExcel({
      filters,
      kpis: summary.kpis,
      rows,
      truncated,
      generatedBy: generatedBy(req),
    });

    const filename = `reporte-reciclajes-${todayIso()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/recycles/export/pdf */
export const exportPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseFilters(req.query);
    const [summary, { rows, truncated }] = await Promise.all([
      fetchSummary(filters, { page: 1, limit: 1 }),
      fetchExportRows(filters),
    ]);

    const buffer = await buildRecyclePdf({
      filters,
      summary,
      rows,
      truncated,
      generatedBy: generatedBy(req),
    });

    const filename = `reporte-reciclajes-${todayIso()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};
