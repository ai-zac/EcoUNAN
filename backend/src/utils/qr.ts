import crypto from 'crypto';



const secret = () => {
  const s = process.env.QR_SECRET || process.env.JWT_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('QR_SECRET or JWT_SECRET is required in production');
    }
    return 'ecounan-dev-qr-secret';
  }
  return s;
};

function hmac(msg: string): string {
  return crypto.createHmac('sha256', secret()).update(msg).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}




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
  if (typeof parsed.recycleId !== 'string' || typeof parsed.ts !== 'number' || typeof parsed.sig !== 'string') return null;

  
  const TTL = 10 * 60 * 1000;
  if (Date.now() - parsed.ts > TTL || parsed.ts > Date.now() + 60 * 1000) return null;

  if (!safeEqual(hmac(`${parsed.recycleId}|${parsed.ts}`), parsed.sig)) return null;

  return { recycleId: parsed.recycleId };
}
