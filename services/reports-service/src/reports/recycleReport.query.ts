import { PipelineStage } from 'mongoose';
import Recycle, { MaterialType, RecycleStatus } from '../models/recycle.model';
import User from '../models/user.model';
import {
  BadRequestError,
  TIMEZONE,
  asString,
  buildCreatedAtRange,
  describeDateRange,
  formatDateTime,
  parseDateRangeParams,
  parseDay,
  parsePagination,
  round,
  todayIso,
} from './reportUtils';

export {
  BadRequestError,
  TIMEZONE,
  formatDateTime,
  parsePagination,
  todayIso,
};

/**
 * Consultas del reporte "Cantidad de Reciclajes Registrados".
 *
 * REGLA: el clúster usa Stable API v1 estricta (apiStrict: true).
 * Prohibido .distinct(); todo se resuelve con aggregate() usando solo
 * etapas/operadores de la API v1 ($match, $lookup, $unwind, $group,
 * $facet, $sort, $skip, $limit, $project, $dateToString...).
 */

export const MATERIALS: MaterialType[] = ['pet', 'aluminio', 'papel', 'carton', 'plastico'];
export const STATUSES: RecycleStatus[] = ['pending', 'validated', 'rejected'];

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  pet: 'PET',
  aluminio: 'Aluminio',
  papel: 'Papel',
  carton: 'Cartón',
  plastico: 'Plástico',
};

export const STATUS_LABELS: Record<RecycleStatus, string> = {
  pending: 'Pendiente',
  validated: 'Validado',
  rejected: 'Rechazado',
};

/** Máximo de reciclajes incluidos en una exportación (protege memoria y tiempo de respuesta). */
export const MAX_EXPORT_RECYCLES = 5000;

// ─────────────────────────── Filtros ───────────────────────────

export interface ReportFilters {
  startDate?: string; // YYYY-MM-DD (hora de Nicaragua)
  endDate?: string;   // YYYY-MM-DD inclusivo
  status?: RecycleStatus;
  faculty?: string;
  material?: MaterialType;
}

/** Valida y normaliza los query params. Lanza BadRequestError (400) si algo es inválido. */
export const parseFilters = (query: Record<string, unknown>): ReportFilters => {
  const filters: ReportFilters = {
    ...parseDateRangeParams(query),
  };

  const status = asString(query.status);
  if (status && status !== 'all') {
    if (!STATUSES.includes(status as RecycleStatus)) {
      throw new BadRequestError(`Estado inválido. Valores permitidos: ${STATUSES.join(', ')}.`);
    }
    filters.status = status as RecycleStatus;
  }

  const material = asString(query.material);
  if (material && material !== 'all') {
    if (!MATERIALS.includes(material as MaterialType)) {
      throw new BadRequestError(`Material inválido. Valores permitidos: ${MATERIALS.join(', ')}.`);
    }
    filters.material = material as MaterialType;
  }

  const faculty = asString(query.faculty);
  if (faculty && faculty !== 'all') {
    if (faculty.length > 150) throw new BadRequestError('Facultad inválida.');
    filters.faculty = faculty;
  }

  return filters;
};

/** Granularidad de la serie temporal: por día si el rango es corto, si no por mes. */
export const getGranularity = (f: ReportFilters): 'day' | 'month' => {
  if (!f.startDate) return 'month';
  const start = parseDay(f.startDate, false).getTime();
  const end = f.endDate ? parseDay(f.endDate, true).getTime() : Date.now();
  return (end - start) / 86_400_000 <= 62 ? 'day' : 'month';
};

export const describeRange = describeDateRange;

export const describeFilters = (f: ReportFilters): string =>
  [
    `Estado: ${f.status ? STATUS_LABELS[f.status] : 'Todos'}`,
    `Facultad: ${f.faculty ?? 'Todas'}`,
    `Material: ${f.material ? MATERIAL_LABELS[f.material] : 'Todos'}`,
  ].join('  ·  ');

// ─────────────────────────── Pipelines ───────────────────────────

/** $match sobre campos propios de Recycle (aprovecha los índices status/createdAt/items.materialType). */
const buildRecycleMatch = (f: ReportFilters): PipelineStage.Match => {
  const match: Record<string, unknown> = {};
  const createdAtRange = buildCreatedAtRange(f);
  if (createdAtRange) match.createdAt = createdAtRange;
  if (f.status) match.status = f.status;
  if (f.material) match['items.materialType'] = f.material;
  return { $match: match };
};

/** Une cada reciclaje con los datos públicos de su reciclador (nunca trae password ni email). */
const userLookup = (): PipelineStage.FacetPipelineStage[] => [
  {
    $lookup: {
      from: User.collection.name,
      let: { uid: '$user' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
        { $project: { _id: 0, name: 1, faculty: 1, career: 1 } },
      ],
      as: 'u',
    },
  },
  { $unwind: { path: '$u', preserveNullAndEmptyArrays: true } },
];

/**
 * Pipeline base. La facultad vive en el usuario, así que si se filtra por
 * facultad el $lookup debe hacerse ANTES de filtrar. Si no, se pospone a
 * las ramas que realmente lo necesitan (más barato).
 */
const buildBase = (f: ReportFilters): { base: PipelineStage[]; joined: boolean } => {
  const base: PipelineStage[] = [buildRecycleMatch(f)];
  if (f.faculty) {
    base.push(...userLookup(), { $match: { 'u.faculty': f.faculty } });
    return { base, joined: true };
  }
  return { base, joined: false };
};

const countIf = (status: RecycleStatus) => ({ $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } });

// ─────────────────────────── Tipos de salida ───────────────────────────

export interface ReportKpis {
  total: number;
  validated: number;
  pending: number;
  rejected: number;
  /** % de registros validados sobre el total filtrado. */
  validationRate: number;
  /** EcoPoints efectivamente otorgados (solo reciclajes validados). */
  ecoPointsAwarded: number;
  totalWeightKg: number;
}

export interface RecentRecycle {
  id: string;
  date: Date;
  status: RecycleStatus;
  student: { name: string; faculty: string | null; career: string | null };
  materials: { material: MaterialType; weightKg: number }[];
  totalWeightKg: number;
  points: number;
}

export interface ReportSummary {
  filters: ReportFilters & { granularity: 'day' | 'month' };
  kpis: ReportKpis;
  timeSeries: { period: string; total: number; validated: number; pending: number; rejected: number }[];
  byMaterial: { material: MaterialType; label: string; count: number; weightKg: number; points: number }[];
  byFaculty: { faculty: string; total: number; validated: number; weightKg: number }[];
  recent: { items: RecentRecycle[]; page: number; limit: number; total: number; totalPages: number };
}

// ─────────────────────────── Consultas ───────────────────────────

/** Resumen completo en UNA sola agregación con $facet. */
export const fetchSummary = async (
  f: ReportFilters,
  { page, limit }: { page: number; limit: number },
): Promise<ReportSummary> => {
  const { base, joined } = buildBase(f);
  const lookup = joined ? [] : userLookup();
  const granularity = getGranularity(f);
  const dateFormat = granularity === 'day' ? '%Y-%m-%d' : '%Y-%m';

  const [result] = await Recycle.aggregate<any>([
    ...base,
    {
      $facet: {
        kpis: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              validated: countIf('validated'),
              pending: countIf('pending'),
              rejected: countIf('rejected'),
              ecoPointsAwarded: {
                $sum: { $cond: [{ $eq: ['$status', 'validated'] }, { $ifNull: ['$totalPoints', 0] }, 0] },
              },
              totalWeightKg: { $sum: { $ifNull: ['$totalWeight', 0] } },
            },
          },
        ],
        timeSeries: [
          {
            $group: {
              _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: TIMEZONE } },
              total: { $sum: 1 },
              validated: countIf('validated'),
              pending: countIf('pending'),
              rejected: countIf('rejected'),
            },
          },
          { $sort: { _id: 1 } },
        ],
        byMaterial: [
          { $unwind: '$items' },
          ...(f.material ? [{ $match: { 'items.materialType': f.material } }] : []),
          {
            $group: {
              _id: '$items.materialType',
              count: { $sum: 1 },
              weightKg: { $sum: { $ifNull: ['$items.weight', 0] } },
              points: { $sum: { $ifNull: ['$items.pointsEarned', 0] } },
            },
          },
          { $sort: { count: -1 } },
        ],
        byFaculty: [
          ...lookup,
          {
            $group: {
              _id: { $ifNull: ['$u.faculty', 'Sin facultad'] },
              total: { $sum: 1 },
              validated: countIf('validated'),
              weightKg: { $sum: { $ifNull: ['$totalWeight', 0] } },
            },
          },
          { $sort: { total: -1 } },
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          ...lookup,
          {
            $project: {
              _id: 0,
              id: { $toString: '$_id' },
              date: '$createdAt',
              status: 1,
              student: {
                name: { $ifNull: ['$u.name', 'Usuario eliminado'] },
                faculty: { $ifNull: ['$u.faculty', null] },
                career: { $ifNull: ['$u.career', null] },
              },
              materials: {
                $map: {
                  input: { $ifNull: ['$items', []] },
                  as: 'it',
                  in: { material: '$$it.materialType', weightKg: '$$it.weight' },
                },
              },
              totalWeightKg: { $ifNull: ['$totalWeight', 0] },
              points: { $ifNull: ['$totalPoints', 0] },
            },
          },
        ],
      },
    },
  ]);

  const k = result?.kpis?.[0] ?? {};
  const total: number = k.total ?? 0;
  const validated: number = k.validated ?? 0;

  return {
    filters: { ...f, granularity },
    kpis: {
      total,
      validated,
      pending: k.pending ?? 0,
      rejected: k.rejected ?? 0,
      validationRate: total ? round((validated / total) * 100, 1) : 0,
      ecoPointsAwarded: k.ecoPointsAwarded ?? 0,
      totalWeightKg: round(k.totalWeightKg ?? 0),
    },
    timeSeries: (result?.timeSeries ?? []).map((r: any) => ({
      period: r._id,
      total: r.total,
      validated: r.validated,
      pending: r.pending,
      rejected: r.rejected,
    })),
    byMaterial: (result?.byMaterial ?? []).map((r: any) => ({
      material: r._id,
      label: MATERIAL_LABELS[r._id as MaterialType] ?? r._id,
      count: r.count,
      weightKg: round(r.weightKg),
      points: r.points,
    })),
    byFaculty: (result?.byFaculty ?? []).map((r: any) => ({
      faculty: r._id,
      total: r.total,
      validated: r.validated,
      weightKg: round(r.weightKg),
    })),
    recent: {
      items: (result?.recent ?? []).map((r: any) => ({ ...r, totalWeightKg: round(r.totalWeightKg) })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
};

export interface ExportRow {
  date: Date;
  student: string;
  faculty: string;
  career: string;
  material: string;
  weightKg: number;
  status: string;
  points: number;
}

/**
 * Filas para Excel/PDF: una fila por material de cada reciclaje
 * (un reciclaje con PET + Papel genera 2 filas). Ordenadas de más reciente a más antiguo.
 */
export const fetchExportRows = async (f: ReportFilters): Promise<{ rows: ExportRow[]; truncated: boolean }> => {
  const { base, joined } = buildBase(f);

  const docs = await Recycle.aggregate<any>([
    ...base,
    { $sort: { createdAt: -1 } },
    { $limit: MAX_EXPORT_RECYCLES + 1 }, // +1 para detectar si hubo truncamiento
    ...(joined ? [] : userLookup()),
    {
      $project: {
        _id: 0,
        createdAt: 1,
        status: 1,
        name: '$u.name',
        faculty: '$u.faculty',
        career: '$u.career',
        items: 1,
      },
    },
  ]);

  const truncated = docs.length > MAX_EXPORT_RECYCLES;
  const rows: ExportRow[] = [];

  for (const d of docs.slice(0, MAX_EXPORT_RECYCLES)) {
    const items: any[] = (d.items ?? []).filter((it: any) => !f.material || it.materialType === f.material);
    for (const it of items) {
      rows.push({
        date: d.createdAt,
        student: d.name ?? 'Usuario eliminado',
        faculty: d.faculty ?? 'Sin facultad',
        career: d.career ?? '—',
        material: MATERIAL_LABELS[it.materialType as MaterialType] ?? it.materialType,
        weightKg: round(it.weight),
        status: STATUS_LABELS[d.status as RecycleStatus] ?? d.status,
        points: it.pointsEarned ?? 0,
      });
    }
  }

  return { rows, truncated };
};
