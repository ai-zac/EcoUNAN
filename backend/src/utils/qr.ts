import crypto from 'crypto';



const secret = () => {
  const s = process.env.QR_SECRET;
  if (!s) {
    console.error('[qr] WARNING: QR_SECRET not set, falling back to JWT_SECRET');
    return process.env.JWT_SECRET || 'ecounan-dev-qr-secret';
  }
  return s;
};

function hmac(msg: string): string {
  return crypto.createHmac('sha256', secret()).update(msg).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
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
  if (typeof parsed.recycleId !== 'string' || typeof parsed.ts !== 'number') return null;

  
  const TTL = 10 * 60 * 1000;
  if (Date.now() - parsed.ts > TTL || parsed.ts > Date.now() + 60 * 1000) return null;

  if (!safeEqual(hmac(`${parsed.recycleId}|${parsed.ts}`), parsed.sig)) return null;

  return { recycleId: parsed.recycleId };
}
