import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        res.status(401).json({ success: false, error: 'Not authorized, user no longer exists' });
        return;
      }
      if (!user.isActive) {
        res.status(403).json({ success: false, error: 'Cuenta deshabilitada. Contacta al administrador.' });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ success: false, error: 'Not authorized, token failed' });
      return;
    }
    return;
  }

  res.status(401).json({ success: false, error: 'Not authorized, no token' });
};

// Autorización por roles: requireRole('admin', 'superadmin')
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'No tienes permisos para esta acción' });
      return;
    }
    next();
  };
};

// Compatibilidad: admin ahora incluye superadmin
export const admin = requireRole('admin', 'superadmin');

// Solo superadmin: gestión de usuarios y roles
export const superAdmin = requireRole('superadmin');

// Brigadistas/recolectores + staff superior: validación de reciclajes
export const validator = requireRole('brigadista', 'admin', 'superadmin');
