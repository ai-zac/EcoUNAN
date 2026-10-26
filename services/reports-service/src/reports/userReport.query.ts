import { PipelineStage } from 'mongoose';
import User, { IUser } from '../models/user.model';
import Recycle from '../models/recycle.model';
import {
  BadRequestError,
  TIMEZONE,
  asString,
  buildCreatedAtRange,
  describeDateRange,
  formatDateTime,
  getStartOfCurrentMonthNicaragua,
  parseDateRangeParams,
  round,
  todayIso,
} from './reportUtils';

export { BadRequestError, TIMEZONE, formatDateTime, todayIso };

export type UserRole = IUser['role'];

export const USER_ROLES: UserRole[] = ['user', 'brigadista', 'admin', 'superadmin'];

export const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Estudiante',
  brigadista: 'Brigadista',
  admin: 'Administrador',
  superadmin: 'Superadmin',
};

const MONTH_SHORT_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const MAX_EXPORT_USERS = 5000;

export interface UserReportFilters {
  startDate?: string;
  endDate?: string;
  role?: UserRole;
  status?: 'active' | 'inactive';
  faculty?: string;
}

export const parseUserFilters = (query: Record<string, unknown>): UserReportFilters => {
  const filters: UserReportFilters = {
    ...parseDateRangeParams(query),
  };

  const role = asString(query.role);
  if (role && role !== 'all') {
    if (!USER_ROLES.includes(role as UserRole)) {
      throw new BadRequestError(`Rol inválido. Valores permitidos: ${USER_ROLES.join(', ')}.`);
    }
    filters.role = role as UserRole;
  }

  const status = asString(query.status);
  if (status && status !== 'all') {
    if (status !== 'active' && status !== 'inactive') {
      throw new BadRequestError('Estado inválido. Valores permitidos: active, inactive.');
    }
    filters.status = status;
  }

  const faculty = asString(query.faculty);
  if (faculty && faculty !== 'all') {
    if (faculty.length > 150) throw new BadRequestError('Facultad inválida.');
    filters.faculty = faculty;
  }

  return filters;
};

export const describeUserRange = describeDateRange;

export const describeUserFilters = (f: UserReportFilters): string =>
  [
    `Estado: ${f.status === 'active' ? 'Activos' : f.status === 'inactive' ? 'Inactivos' : 'Todos'}`,
    `Rol: ${f.role ? ROLE_LABELS[f.role] : 'Todos'}`,
    `Facultad: ${f.faculty ?? 'Todas'}`,
  ].join('  ·  ');

const buildUserMatch = (f: UserReportFilters): PipelineStage.Match => {
  const match: Record<string, unknown> = {};
  const createdAtRange = buildCreatedAtRange(f);
  if (createdAtRange) match.createdAt = createdAtRange;
  if (f.role) match.role = f.role;
  if (f.status === 'active') match.isActive = true;
  if (f.status === 'inactive') match.isActive = false;
  if (f.faculty) match.faculty = f.faculty;
  return { $match: match };
};

/** Une cada usuario con su conteo de reciclajes y peso total reciclado (100% aggregate). */
const recycleStatsLookup = (): PipelineStage.FacetPipelineStage[] => [
  {
    $lookup: {
      from: Recycle.collection.name,
      let: { uid: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$user', '$$uid'] } } },
        {
          $group: {
            _id: null,
            recycleCount: { $sum: 1 },
            validatedCount: {
              $sum: { $cond: [{ $eq: ['$status', 'validated'] }, 1, 0] },
            },
            totalWeightKg: { $sum: { $ifNull: ['$totalWeight', 0] } },
            lastRecycleAt: { $max: '$createdAt' },
          },
        },
      ],
      as: 'recycleStats',
    },
  },
  {
    $unwind: {
      path: '$recycleStats',
      preserveNullAndEmptyArrays: true,
    },
  },
];

export interface UserReportKpis {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  activeUsersRate: number;
  activeThisMonth: number;
  activeRecyclers: number;
  totalEcoPoints: number;
  totalLifetimePoints: number;
}

export interface MonthlyUserPoint {
  period: string;     // YYYY-MM
  monthLabel: string; // Ene, Feb, Mar...
  newUsers: number;
  activeUsers: number;
  cumulativeActive: number;
}

export interface UserFacultyBreakdown {
  faculty: string;
  total: number;
  active: number;
  ecoPoints: number;
}

export interface UserRoleBreakdown {
  role: UserRole;
  label: string;
  total: number;
  active: number;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  role: UserRole;
  roleLabel: string;
  isActive: boolean;
  faculty: string | null;
  career: string | null;
  ecoPoints: number;
  lifetimePoints: number;
  recycleCount: number;
  totalWeightKg: number;
  createdAt: Date;
}

export interface UserReportSummary {
  filters: UserReportFilters;
  kpis: UserReportKpis;
  monthlyEvolution: MonthlyUserPoint[];
  byFaculty: UserFacultyBreakdown[];
  byRole: UserRoleBreakdown[];
  recent: {
    items: UserListItem[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const toMonthLabel = (period: string): string => {
  const parts = period.split('-');
  const monthIdx = Number(parts[1]) - 1;
  return MONTH_SHORT_ES[monthIdx] ?? period;
};

export const fetchUserSummary = async (
  f: UserReportFilters,
  { page, limit }: { page: number; limit: number },
): Promise<UserReportSummary> => {
  const startOfCurrentMonth = getStartOfCurrentMonthNicaragua();

  const [result] = await User.aggregate<any>([
    buildUserMatch(f),
    ...recycleStatsLookup(),
    {
      $facet: {
        kpis: [
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
              inactiveUsers: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
              activeThisMonth: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$isActive', true] },
                        {
                          $or: [
                            { $gte: ['$createdAt', startOfCurrentMonth] },
                            { $gte: ['$recycleStats.lastRecycleAt', startOfCurrentMonth] },
                            { $gte: ['$updatedAt', startOfCurrentMonth] },
                          ],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              activeRecyclers: {
                $sum: {
                  $cond: [{ $gt: [{ $ifNull: ['$recycleStats.recycleCount', 0] }, 0] }, 1, 0],
                },
              },
              totalEcoPoints: { $sum: { $ifNull: ['$ecoPoints', 0] } },
              totalLifetimePoints: { $sum: { $ifNull: ['$lifetimePoints', 0] } },
            },
          },
        ],
        monthlyEvolution: [
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: TIMEZONE },
              },
              newUsers: { $sum: 1 },
              activeUsers: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            },
          },
          { $sort: { _id: 1 } },
        ],
        byFaculty: [
          {
            $group: {
              _id: { $ifNull: ['$faculty', 'Sin facultad'] },
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
              ecoPoints: { $sum: { $ifNull: ['$ecoPoints', 0] } },
            },
          },
          { $sort: { total: -1 } },
        ],
        byRole: [
          {
            $group: {
              _id: '$role',
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
            },
          },
          { $sort: { total: -1 } },
        ],
        recent: [
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              id: { $toString: '$_id' },
              name: 1,
              email: 1,
              studentId: { $ifNull: ['$studentId', null] },
              role: 1,
              isActive: 1,
              faculty: { $ifNull: ['$faculty', null] },
              career: { $ifNull: ['$career', null] },
              ecoPoints: { $ifNull: ['$ecoPoints', 0] },
              lifetimePoints: { $ifNull: ['$lifetimePoints', 0] },
              recycleCount: { $ifNull: ['$recycleStats.recycleCount', 0] },
              totalWeightKg: { $ifNull: ['$recycleStats.totalWeightKg', 0] },
              createdAt: 1,
            },
          },
        ],
      },
    },
  ]);

  const k = result?.kpis?.[0] ?? {};
  const totalUsers: number = k.totalUsers ?? 0;
  const activeUsers: number = k.activeUsers ?? 0;

  let runningActive = 0;
  const monthlyEvolution: MonthlyUserPoint[] = (result?.monthlyEvolution ?? []).map((m: any) => {
    runningActive += m.activeUsers ?? 0;
    return {
      period: m._id,
      monthLabel: toMonthLabel(m._id),
      newUsers: m.newUsers ?? 0,
      activeUsers: m.activeUsers ?? 0,
      cumulativeActive: runningActive,
    };
  });

  return {
    filters: f,
    kpis: {
      totalUsers,
      activeUsers,
      inactiveUsers: k.inactiveUsers ?? 0,
      activeUsersRate: totalUsers ? round((activeUsers / totalUsers) * 100, 1) : 0,
      activeThisMonth: k.activeThisMonth ?? 0,
      activeRecyclers: k.activeRecyclers ?? 0,
      totalEcoPoints: k.totalEcoPoints ?? 0,
      totalLifetimePoints: k.totalLifetimePoints ?? 0,
    },
    monthlyEvolution,
    byFaculty: (result?.byFaculty ?? []).map((r: any) => ({
      faculty: r._id || 'Sin facultad',
      total: r.total,
      active: r.active,
      ecoPoints: r.ecoPoints,
    })),
    byRole: (result?.byRole ?? []).map((r: any) => ({
      role: r._id,
      label: ROLE_LABELS[r._id as UserRole] ?? r._id,
      total: r.total,
      active: r.active,
    })),
    recent: {
      items: (result?.recent ?? []).map((u: any) => ({
        ...u,
        roleLabel: ROLE_LABELS[u.role as UserRole] ?? u.role,
        totalWeightKg: round(u.totalWeightKg ?? 0, 2),
      })),
      page,
      limit,
      total: totalUsers,
      totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
    },
  };
};

export interface UserExportRow {
  createdAt: Date;
  name: string;
  email: string;
  studentId: string;
  faculty: string;
  career: string;
  role: string;
  status: string;
  recycleCount: number;
  totalWeightKg: number;
  ecoPoints: number;
}

export const fetchUserExportRows = async (
  f: UserReportFilters,
): Promise<{ rows: UserExportRow[]; truncated: boolean }> => {
  const docs = await User.aggregate<any>([
    buildUserMatch(f),
    { $sort: { createdAt: -1 } },
    { $limit: MAX_EXPORT_USERS + 1 },
    ...recycleStatsLookup(),
    {
      $project: {
        _id: 0,
        createdAt: 1,
        name: 1,
        email: 1,
        studentId: 1,
        faculty: 1,
        career: 1,
        role: 1,
        isActive: 1,
        ecoPoints: 1,
        recycleCount: { $ifNull: ['$recycleStats.recycleCount', 0] },
        totalWeightKg: { $ifNull: ['$recycleStats.totalWeightKg', 0] },
      },
    },
  ]);

  const truncated = docs.length > MAX_EXPORT_USERS;
  const rows: UserExportRow[] = docs.slice(0, MAX_EXPORT_USERS).map((u: any) => ({
    createdAt: u.createdAt,
    name: u.name ?? '—',
    email: u.email ?? '—',
    studentId: u.studentId ?? '—',
    faculty: u.faculty ?? 'Sin facultad',
    career: u.career ?? '—',
    role: ROLE_LABELS[u.role as UserRole] ?? u.role,
    status: u.isActive ? 'Activo' : 'Inactivo',
    recycleCount: u.recycleCount ?? 0,
    totalWeightKg: round(u.totalWeightKg ?? 0, 2),
    ecoPoints: u.ecoPoints ?? 0,
  }));

  return { rows, truncated };
};
