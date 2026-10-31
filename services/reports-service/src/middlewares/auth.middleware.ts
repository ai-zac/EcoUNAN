import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: IUser;
}

// Caché en memoria (30 s) para no consultar MongoDB en cada petición paralela.
const userCache = new Map<string, { user: IUser; cachedAt: number }>();
const USER_CACHE_TTL_MS = 30 * 1000;

/**
 * Valida el JWT emitido por el backend principal (mismo JWT_SECRET).
 * Los mensajes de error son idénticos a los del backend porque el
 * interceptor de src/api/apiClient.ts reacciona según su contenido
 * ('deshabilitada' -> logout, 'permisos' -> refrescar rol).
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No autorizado, token no proporcionado' });
    return;
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; iat?: number };

    let user: IUser | null = null;
    const cached = userCache.get(decoded.id);
    if (cached && Date.now() - cached.cachedAt < USER_CACHE_TTL_MS) {
      user = cached.user;
    } else {
      user = await User.findById(decoded.id);
      if (user) {
        if (userCache.size > 2000) userCache.clear();
        userCache.set(decoded.id, { user, cachedAt: Date.now() });
      }
    }

    if (!user) {
      res.status(401).json({ success: false, error: 'No autorizado, el usuario ya no existe' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ success: false, error: 'Cuenta deshabilitada. Contacta al administrador.' });
      return;
    }
    if (user.passwordChangedAt && decoded.iat) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        res.status(401).json({
          success: false,
          error: 'Tu contraseña fue modificada recientemente. Por favor, inicia sesión de nuevo.',
        });
        return;
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[reports-service auth:401]', (error as Error).message);
    res.status(401).json({ success: false, error: 'No autorizado, sesión inválida o expirada' });
  }
};

export const requireRole = (...roles: IUser['role'][]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autorizado' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'No tienes permisos para esta acción' });
      return;
    }
    next();
  };

export const admin = requireRole('admin', 'superadmin');
