import { PipelineStage } from 'mongoose';
import Reward from '../models/reward.model';
import Redemption, { RedemptionStatus } from '../models/redemption.model';
import Recycle from '../models/recycle.model';
import User from '../models/user.model';
import {
  BadRequestError,
  TIMEZONE,
  asString,
  buildCreatedAtRange,
  describeDateRange,
  formatDateTime,
  parseDateRangeParams,
  round,
  todayIso,
} from './reportUtils';

export { BadRequestError, TIMEZONE, formatDateTime, todayIso };

export const REDEMPTION_STATUSES: RedemptionStatus[] = ['pending', 'completed', 'cancelled'];

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  pending: 'Pendiente',
  completed: 'Entregado',
  cancelled: 'Cancelado',
};

export const MAX_EXPORT_REDEMPTIONS = 5000;

export interface RewardReportFilters {
  startDate?: string;
  endDate?: string;
  status?: RedemptionStatus;
  faculty?: string;
}

export const parseRewardFilters = (query: Record<string, unknown>): RewardReportFilters => {
  const filters: RewardReportFilters = {
    ...parseDateRangeParams(query),
  };

  const status = asString(query.status);
  if (status && status !== 'all') {
    if (!REDEMPTION_STATUSES.includes(status as RedemptionStatus)) {
      throw new BadRequestError(
        `Estado inválido. Valores permitidos: ${REDEMPTION_STATUSES.join(', ')}.`,
      );
    }
    filters.status = status as RedemptionStatus;
  }

  const faculty = asString(query.faculty);
  if (faculty && faculty !== 'all') {
    if (faculty.length > 150) throw new BadRequestError('Facultad inválida.');
    filters.faculty = faculty;
  }

  return filters;
};

export const describeRewardRange = describeDateRange;

export const describeRewardFilters = (f: RewardReportFilters): string =>
  [
    `Estado de canje: ${f.status ? REDEMPTION_STATUS_LABELS[f.status] : 'Todos'}`,
    `Facultad: ${f.faculty ?? 'Todas'}`,
  ].join('  ·  ');

const userLookup = (): PipelineStage.FacetPipelineStage[] => [
  {
    $lookup: {
      from: User.collection.name,
      let: { uid: '$user' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
        { $project: { _id: 0, name: 1, email: 1, faculty: 1, career: 1 } },
      ],
      as: 'u',
    },
  },
  { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
];

const rewardLookup = (): PipelineStage.FacetPipelineStage[] => [
  {
    $lookup: {
      from: Reward.collection.name,
      let: { rid: '$reward' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$rid'] } } },
        { $project: { _id: 0, title: 1, pointsCost: 1, stock: 1, isActive: 1 } },
      ],
      as: 'rw',
    },
  },
  { $unwind: { path: '$rw', preserveNullAndEmptyArrays: true } },
];

export interface RewardReportKpis {
  pointsGenerated: number;
  pointsRedeemed: number;
  redemptionRate: number;
  totalRedemptions: number;
  completedRedemptions: number;
  pendingRedemptions: number;
  cancelledRedemptions: number;
  activeCatalogCount: number;
}

export interface WeeklyPointsTrendItem {
  weekKey: string;   // YYYY-Www
  label: string;     // Semana 1, Semana 2...
  pointsGenerated: number;
  pointsRedeemed: number;
  cumulativePoints: number;
}

export interface RewardCatalogItem {
  id: string;
  title: string;
  pointsCost: number;
  stock: number;
  isActive: boolean;
  redemptionCount: number;
  completedCount: number;
  totalPointsSpent: number;
}

export interface RecentRedemptionItem {
  id: string;
  date: Date;
  status: RedemptionStatus;
  statusLabel: string;
  pointsSpent: number;
  rewardTitle: string;
  student: {
    name: string;
    faculty: string | null;
    career: string | null;
  };
}

export interface RewardReportSummary {
  filters: RewardReportFilters;
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

export const fetchRewardSummary = async (
  f: RewardReportFilters,
  { page, limit }: { page: number; limit: number },
): Promise<RewardReportSummary> => {
  const dateRange = buildCreatedAtRange(f);

  // 1. Puntos generados y tendencia semanal desde reciclajes validados (100% aggregate)
  const recycleMatch: Record<string, unknown> = { status: 'validated' };
  if (dateRange) recycleMatch.createdAt = dateRange;

  const recycleBase: PipelineStage[] = [{ $match: recycleMatch }];
  if (f.faculty) {
    recycleBase.push(
      ...(userLookup() as PipelineStage[]),
      { $match: { 'u.faculty': f.faculty } },
    );
  }

  // 2. Canjes realizados (Redemptions)
  const redemptionMatch: Record<string, unknown> = {};
  if (dateRange) redemptionMatch.createdAt = dateRange;
  if (f.status) redemptionMatch.status = f.status;

  const redemptionBase: PipelineStage[] = [{ $match: redemptionMatch }];
  if (f.faculty) {
    redemptionBase.push(
      ...(userLookup() as PipelineStage[]),
      { $match: { 'u.faculty': f.faculty } },
    );
  }

  const [[recycleAgg], [redemptionAgg], catalogAgg] = await Promise.all([
    Recycle.aggregate<any>([
      ...recycleBase,
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                pointsGenerated: { $sum: { $ifNull: ['$totalPoints', 0] } },
              },
            },
          ],
          weekly: [
            {
              $group: {
                _id: {
                  $dateToString: { format: '%G-W%V', date: '$createdAt', timezone: TIMEZONE },
                },
                pointsGenerated: { $sum: { $ifNull: ['$totalPoints', 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]),
    Redemption.aggregate<any>([
      ...redemptionBase,
      {
        $facet: {
          kpis: [
            {
              $group: {
                _id: null,
                totalRedemptions: { $sum: 1 },
                completedRedemptions: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                pendingRedemptions: {
                  $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
                },
                cancelledRedemptions: {
                  $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
                },
                pointsRedeemed: {
                  $sum: {
                    $cond: [
                      { $ne: ['$status', 'cancelled'] },
                      { $ifNull: ['$pointsSpent', 0] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          weekly: [
            {
              $match: { status: { $ne: 'cancelled' } },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%G-W%V', date: '$createdAt', timezone: TIMEZONE },
                },
                pointsRedeemed: { $sum: { $ifNull: ['$pointsSpent', 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            ...(f.faculty ? [] : userLookup()),
            ...rewardLookup(),
            {
              $project: {
                _id: 0,
                id: { $toString: '$_id' },
                date: '$createdAt',
                status: 1,
                pointsSpent: { $ifNull: ['$pointsSpent', 0] },
                rewardTitle: { $ifNull: ['$rw.title', 'Recompensa eliminada'] },
                student: {
                  name: { $ifNull: ['$u.name', 'Usuario eliminado'] },
                  faculty: { $ifNull: ['$u.faculty', null] },
                  career: { $ifNull: ['$u.career', null] },
                },
              },
            },
          ],
        },
      },
    ]),
    // 3. Catálogo de Recompensas cruzado con sus canjes (respetando filtros de fecha, estado y facultad)
    Reward.aggregate<any>([
      {
        $lookup: {
          from: Redemption.collection.name,
          let: { rewardId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$reward', '$$rewardId'] },
                ...(dateRange ? { createdAt: dateRange } : {}),
                ...(f.status ? { status: f.status } : {}),
              },
            },
            ...(f.faculty
              ? [
                  ...userLookup(),
                  { $match: { 'u.faculty': f.faculty } },
                ]
              : []),
            {
              $group: {
                _id: null,
                redemptionCount: { $sum: 1 },
                completedCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                totalPointsSpent: {
                  $sum: {
                    $cond: [
                      { $ne: ['$status', 'cancelled'] },
                      { $ifNull: ['$pointsSpent', 0] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          as: 'stats',
        },
      },
      { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          id: { $toString: '$_id' },
          title: 1,
          pointsCost: 1,
          stock: 1,
          isActive: 1,
          redemptionCount: { $ifNull: ['$stats.redemptionCount', 0] },
          completedCount: { $ifNull: ['$stats.completedCount', 0] },
          totalPointsSpent: { $ifNull: ['$stats.totalPointsSpent', 0] },
        },
      },
      { $sort: { isActive: -1, pointsCost: 1 } },
    ]),
  ]);

  const pointsGenerated: number = recycleAgg?.totals?.[0]?.pointsGenerated ?? 0;
  const rk = redemptionAgg?.kpis?.[0] ?? {};
  const pointsRedeemed: number = rk.pointsRedeemed ?? 0;
  const totalRedemptions: number = rk.totalRedemptions ?? 0;
  const completedRedemptions: number = rk.completedRedemptions ?? 0;

  // Tasa de canje: si hay puntos generados y canjeados, % de puntos canjeados; si no hay puntos generados aún, % de canjes activos/entregados
  const rawRate =
    pointsGenerated > 0 && pointsRedeemed > 0
      ? (pointsRedeemed / pointsGenerated) * 100
      : totalRedemptions > 0
        ? ((completedRedemptions + (rk.pendingRedemptions ?? 0)) / totalRedemptions) * 100
        : 0;
  const redemptionRate = round(Math.min(100, rawRate), 1);

  // Unir semanas de puntos generados + puntos canjeados
  const weekMap = new Map<string, { generated: number; redeemed: number }>();
  for (const w of recycleAgg?.weekly ?? []) {
    weekMap.set(w._id, { generated: w.pointsGenerated ?? 0, redeemed: 0 });
  }
  for (const w of redemptionAgg?.weekly ?? []) {
    const prev = weekMap.get(w._id) ?? { generated: 0, redeemed: 0 };
    prev.redeemed = w.pointsRedeemed ?? 0;
    weekMap.set(w._id, prev);
  }

  const sortedWeeks = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  let cumulative = 0;
  const weeklyTrend: WeeklyPointsTrendItem[] = sortedWeeks.map(([weekKey, val], idx) => {
    const stepPoints = val.generated > 0 ? val.generated : val.redeemed;
    cumulative += stepPoints;
    return {
      weekKey,
      label: `Semana ${idx + 1}`,
      pointsGenerated: val.generated,
      pointsRedeemed: val.redeemed,
      cumulativePoints: cumulative,
    };
  });

  const catalog: RewardCatalogItem[] = catalogAgg ?? [];
  const activeCatalogCount = catalog.filter((c) => c.isActive).length;

  return {
    filters: f,
    kpis: {
      pointsGenerated,
      pointsRedeemed,
      redemptionRate,
      totalRedemptions,
      completedRedemptions,
      pendingRedemptions: rk.pendingRedemptions ?? 0,
      cancelledRedemptions: rk.cancelledRedemptions ?? 0,
      activeCatalogCount,
    },
    weeklyTrend,
    catalog,
    recent: {
      items: (redemptionAgg?.recent ?? []).map((r: any) => ({
        ...r,
        statusLabel: REDEMPTION_STATUS_LABELS[r.status as RedemptionStatus] ?? r.status,
      })),
      page,
      limit,
      total: totalRedemptions,
      totalPages: Math.max(1, Math.ceil(totalRedemptions / limit)),
    },
  };
};

export interface RedemptionExportRow {
  date: Date;
  student: string;
  faculty: string;
  career: string;
  rewardTitle: string;
  pointsSpent: number;
  status: string;
}

export const fetchRewardExportRows = async (
  f: RewardReportFilters,
): Promise<{ rows: RedemptionExportRow[]; truncated: boolean }> => {
  const dateRange = buildCreatedAtRange(f);
  const match: Record<string, unknown> = {};
  if (dateRange) match.createdAt = dateRange;
  if (f.status) match.status = f.status;

  const base: PipelineStage[] = [{ $match: match }, ...(userLookup() as PipelineStage[])];
  if (f.faculty) {
    base.push({ $match: { 'u.faculty': f.faculty } });
  }

  const docs = await Redemption.aggregate<any>([
    ...base,
    { $sort: { createdAt: -1 } },
    { $limit: MAX_EXPORT_REDEMPTIONS + 1 },
    ...(rewardLookup() as PipelineStage[]),
    {
      $project: {
        _id: 0,
        createdAt: 1,
        status: 1,
        pointsSpent: 1,
        rewardTitle: '$rw.title',
        name: '$u.name',
        faculty: '$u.faculty',
        career: '$u.career',
      },
    },
  ]);

  const truncated = docs.length > MAX_EXPORT_REDEMPTIONS;
  const rows: RedemptionExportRow[] = docs.slice(0, MAX_EXPORT_REDEMPTIONS).map((d: any) => ({
    date: d.createdAt,
    student: d.name ?? 'Usuario eliminado',
    faculty: d.faculty ?? 'Sin facultad',
    career: d.career ?? '—',
    rewardTitle: d.rewardTitle ?? 'Recompensa eliminada',
    pointsSpent: d.pointsSpent ?? 0,
    status: REDEMPTION_STATUS_LABELS[d.status as RedemptionStatus] ?? d.status,
  }));

  return { rows, truncated };
};
