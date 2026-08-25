import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

export interface AuthRequest extends Request {
  user?: IUser;
}

interface CachedUser {
  user: IUser;
  cachedAt: number;
}
const userCache = new Map<string, CachedUser>();
const USER_CACHE_TTL_MS = 30 * 1000;

export const invalidateUserCache = (userId: string | Types.ObjectId) => {
  userCache.delete(String(userId));
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      let decoded: any;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
      } catch (err) {

        const fallbacks = ['EcoUnanSecretKey2026!@', 'EcoUnanSecretKey2026!@#'];
        let matched = false;
        for (const secret of fallbacks) {
          try {
            decoded = jwt.verify(token, secret) as any;
            matched = true;
            break;
          } catch {

          }
        }
        if (!matched) throw err;
      }

      let user: IUser | null = null;
      const cached = userCache.get(String(decoded.id));
      if (cached && Date.now() - cached.cachedAt < USER_CACHE_TTL_MS) {
        user = cached.user;
      } else {
        user = await User.findById(decoded.id).select('-password');
        if (user) {

          if (userCache.size > 2000) userCache.clear();
          userCache.set(String(decoded.id), { user, cachedAt: Date.now() });
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
        const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
        if (decoded.iat < changedTimestamp) {
          res.status(401).json({
            success: false,
            error: 'Tu contraseña fue modificada recientemente. Por favor, inicia sesión de nuevo.'
          });
          return;
        }
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('[auth.middleware:401]', error);
      res.status(401).json({ success: false, error: 'No autorizado, sesión inválida o expirada' });
      return;
    }
    return;
  }

  res.status(401).json({ success: false, error: 'No autorizado, token no proporcionado' });
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
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
};

export const admin = requireRole('admin', 'superadmin');

export const superAdmin = requireRole('superadmin');

export const validator = requireRole('brigadista', 'admin', 'superadmin');
