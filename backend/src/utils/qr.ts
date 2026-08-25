import crypto from 'crypto';

/**
 * QRs firmados con HMAC-SHA256.
 * Dos tipos:
 *  - eco-unan-qr : QR de BASURERO (el estudiante escanea el basurero)
 *  - eco-approve : QR de APROBACION PRESENCIAL (el brigadista lo muestra,
 *                  el estudiante lo escanea para validar su solicitud)
 * El secreto viene de QR_SECRET o, como fallback, JWT_SECRET.
 */

const secret = () =>
  process.env.QR_SECRET || process.env.JWT_SECRET || 'ecounan-dev-qr-secret';

function hmac(msg: string): string {
  return crypto.createHmac('sha256', secret()).update(msg).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// ---------- Basureros ----------
export function signBinQr(material: string, weight: number): string {
  const ts = Date.now();
  return JSON.stringify({
    type: 'eco-unan-qr',
    material,
    weight,
    ts,
    sig: hmac(`${material}|${weight}|${ts}`),
  });
}

export interface VerifiedBinQr {
  material: string;
  weight: number;
}

export function verifyBinQr(raw: string): VerifiedBinQr | null {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || parsed.type !== 'eco-unan-qr') return null;
  if (typeof parsed.sig !== 'string' || typeof parsed.ts !== 'number') return null;
  if (typeof parsed.material !== 'string' || typeof parsed.weight !== 'number') return null;
  if (!Number.isFinite(parsed.weight) || parsed.weight <= 0) return null;

  const YEAR = 365 * 24 * 60 * 60 * 1000;
  const HOUR = 60 * 60 * 1000;
  if (Date.now() - parsed.ts > YEAR || parsed.ts > Date.now() + HOUR) return null;

  if (!safeEqual(hmac(`${parsed.material}|${parsed.weight}|${parsed.ts}`), parsed.sig)) return null;

  return { material: parsed.material, weight: parsed.weight };
}

// ---------- Aprobacion presencial ----------
export function signApprovalQr(recycleId: string): string {
  const ts = Date.now();
  return JSON.stringify({
    type: 'eco-approve',
    recycleId,
    ts,
    sig: hmac(`${recycleId}|${ts}`),
  });
}

export interface VerifiedApprovalQr {
  recycleId: string;
}

export function verifyApprovalQr(raw: string): VerifiedApprovalQr | null {
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || parsed.type !== 'eco-approve') return null;
  if (typeof parsed.recycleId !== 'string' || typeof parsed.ts !== 'number') return null;

  // El QR de aprobacion es efimero: expira a los 10 minutos
  const TTL = 10 * 60 * 1000;
  if (Date.now() - parsed.ts > TTL || parsed.ts > Date.now() + 60 * 1000) return null;

  if (!safeEqual(hmac(`${parsed.recycleId}|${parsed.ts}`), parsed.sig)) return null;

  return { recycleId: parsed.recycleId };
}
