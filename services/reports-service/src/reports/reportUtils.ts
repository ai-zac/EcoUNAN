/**
 * Utilidades compartidas para todos los reportes del microservicio.
 * Zona horaria oficial: America/Managua (UTC-6, sin horario de verano).
 */

export const TIMEZONE = 'America/Managua';
export const TZ_OFFSET = '-06:00';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const dateTimeFmt = new Intl.DateTimeFormat('es-NI', {
  timeZone: TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const isoDayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export class BadRequestError extends Error {
  status = 400;
}

export const asString = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
};

export const round = (n: number, decimals = 2): number =>
  Math.round((n || 0) * 10 ** decimals) / 10 ** decimals;

/** "24/10/2026 08:15" en hora de Nicaragua. */
export const formatDateTime = (d: Date): string =>
  dateTimeFmt.format(new Date(d)).replace(',', '');

/** "2026-10-24" en hora de Nicaragua (para nombres de archivo y cálculos de mes). */
export const todayIso = (): string => isoDayFmt.format(new Date());

/**
 * Convierte "YYYY-MM-DD" al inicio (00:00:00.000) o fin (23:59:59.999) del día en hora de Nicaragua.
 * Verifica además que la fecha no desborde en el calendario (ej. rechaza 2026-02-31).
 */
export const parseDay = (value: string, endOfDay: boolean): Date => {
  if (!DATE_RE.test(value)) {
    throw new BadRequestError(`Fecha inválida: "${value}". Usa el formato YYYY-MM-DD.`);
  }
  const d = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}${TZ_OFFSET}`);
  if (Number.isNaN(d.getTime()) || isoDayFmt.format(d) !== value) {
    throw new BadRequestError(`Fecha fuera de rango en el calendario: "${value}".`);
  }
  return d;
};

/** Valida startDate y endDate opcionales desde query params. */
export const parseDateRangeParams = (
  query: Record<string, unknown>,
): { startDate?: string; endDate?: string } => {
  const result: { startDate?: string; endDate?: string } = {};
  const startDate = asString(query.startDate);
  const endDate = asString(query.endDate);

  if (startDate) {
    parseDay(startDate, false);
    result.startDate = startDate;
  }
  if (endDate) {
    parseDay(endDate, true);
    result.endDate = endDate;
  }
  if (startDate && endDate && startDate > endDate) {
    throw new BadRequestError('startDate no puede ser posterior a endDate.');
  }
  return result;
};

/** Construye el objeto `{ $gte?, $lte? }` para filtrar por `createdAt`. */
export const buildCreatedAtRange = (f: {
  startDate?: string;
  endDate?: string;
}): Record<string, Date> | undefined => {
  if (!f.startDate && !f.endDate) return undefined;
  const range: Record<string, Date> = {};
  if (f.startDate) range.$gte = parseDay(f.startDate, false);
  if (f.endDate) range.$lte = parseDay(f.endDate, true);
  return range;
};

export const parsePagination = (query: Record<string, unknown>) => {
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit)) || 10));
  return { page, limit };
};

/** Texto legible del rango filtrado (para encabezados de Excel/PDF). */
export const describeDateRange = (f: { startDate?: string; endDate?: string }): string => {
  const fmt = (s: string) => s.split('-').reverse().join('/');
  if (f.startDate && f.endDate) return `${fmt(f.startDate)} al ${fmt(f.endDate)}`;
  if (f.startDate) return `Desde ${fmt(f.startDate)}`;
  if (f.endDate) return `Hasta ${fmt(f.endDate)}`;
  return 'Todo el historial';
};

/** Inicio del mes actual en zona horaria de Nicaragua (America/Managua). */
export const getStartOfCurrentMonthNicaragua = (): Date => {
  const yearMonth = todayIso().slice(0, 7); // YYYY-MM en America/Managua
  return parseDay(`${yearMonth}-01`, false);
};

