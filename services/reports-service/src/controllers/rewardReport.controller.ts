import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { parsePagination, todayIso } from '../reports/recycleReport.query';
import {
  fetchRewardExportRows,
  fetchRewardSummary,
  parseRewardFilters,
} from '../reports/rewardReport.query';
import { buildRewardExcel } from '../reports/rewardReport.excel';
import { buildRewardPdf } from '../reports/rewardReport.pdf';

const generatedBy = (req: AuthRequest) => req.user?.name ?? 'Administrador';

/** GET /api/reports/rewards/summary */
export const getRewardSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseRewardFilters(req.query);
    const pagination = parsePagination(req.query);
    const data = await fetchRewardSummary(filters, pagination);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/** GET /api/reports/rewards/export/excel */
export const exportRewardExcel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseRewardFilters(req.query);
    const [summary, { rows, truncated }] = await Promise.all([
      fetchRewardSummary(filters, { page: 1, limit: 1 }),
      fetchRewardExportRows(filters),
    ]);

    const buffer = await buildRewardExcel({
      filters,
      kpis: summary.kpis,
      catalog: summary.catalog,
      rows,
      truncated,
      generatedBy: generatedBy(req),
    });

    const filename = `reporte-recompensas-${todayIso()}.xlsx`;
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

/** GET /api/reports/rewards/export/pdf */
export const exportRewardPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filters = parseRewardFilters(req.query);
    const [summary, { rows, truncated }] = await Promise.all([
      fetchRewardSummary(filters, { page: 1, limit: 1 }),
      fetchRewardExportRows(filters),
    ]);

    const buffer = await buildRewardPdf({
      filters,
      summary,
      rows,
      truncated,
      generatedBy: generatedBy(req),
    });

    const filename = `reporte-recompensas-${todayIso()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length.toString());
    res.setHeader('Cache-Control', 'no-store');
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};

