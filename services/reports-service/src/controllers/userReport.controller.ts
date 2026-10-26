import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { parsePagination, todayIso } from '../reports/recycleReport.query';
import {
  fetchUserExportRows,
  fetchUserSummary,
  parseUserFilters,
} from '../reports/userReport.query';
import { buildUserExcel } from '../reports/userReport.excel';
import { buildUserPdf } from '../reports/userReport.pdf';

const generatedBy = (req: AuthRequest) => req.user?.name ?? 'Administrador';

/** GET /api/reports/users/summary */
export const getUserSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseUserFilters(req.query);
    const pagination = parsePagination(req.query);
    const data = await fetchUserSummary(filters, pagination);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/users/export/excel */
export const exportUserExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseUserFilters(req.query);
    const [summary, { rows, truncated }] = await Promise.all([
      fetchUserSummary(filters, { page: 1, limit: 1 }),
      fetchUserExportRows(filters),
    ]);

    const buffer = await buildUserExcel({
      filters,
      kpis: summary.kpis,
      rows,
      truncated,
      generatedBy: generatedBy(req),
    });

    const filename = `reporte-usuarios-${todayIso()}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/users/export/pdf */
export const exportUserPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseUserFilters(req.query);
    const [summary, { rows, truncated }] = await Promise.all([
      fetchUserSummary(filters, { page: 1, limit: 1 }),
      fetchUserExportRows(filters),
    ]);

    const buffer = await buildUserPdf({
      filters,
      summary,
      rows,
      truncated,
      generatedBy: generatedBy(req),
    });

    const filename = `reporte-usuarios-${todayIso()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};

