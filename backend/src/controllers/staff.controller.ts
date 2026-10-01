import { Request, Response } from 'express';
import User from '../models/user.model';

const STAFF_ROLES = ['brigadista', 'admin', 'superadmin'];
const ALL_ROLES = ['user', 'brigadista', 'admin', 'superadmin'];

export class StaffController {
  
  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { search, status } = req.query;

      const query: any = {};
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;

      if (search && typeof search === 'string' && search.trim()) {
        const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        query.$or = [{ name: rx }, { email: rx }, { studentId: rx }];
      }

      const users = await User.find(query).select('-password').sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  
  public async createStaff(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, studentId, faculty, career, role } = req.body;

      if (!name || !email || !password || !role) {
        res.status(400).json({ success: false, error: 'Nombre, email, contraseña y rol son obligatorios' });
        return;
      }
      if (!STAFF_ROLES.includes(role)) {
        res.status(400).json({ success: false, error: 'Rol inválido. Usa: brigadista, admin o superadmin' });
        return;
      }
      if (String(password).length < 8) {
        res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
        return;
      }

      const exists = await User.findOne({ email });
      if (exists) {
        res.status(400).json({ success: false, error: 'Ya existe un usuario con ese correo' });
        return;
      }

      const user = await User.create({
        name,
        email,
        password,
        studentId,
        faculty,
        career,
        role
      });

      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  
  public async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!ALL_ROLES.includes(role)) {
        res.status(400).json({ success: false, error: 'Rol inválido' });
        return;
      }

      const target = await User.findById(id);
      if (!target) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }
      if (String(target._id) === String((req as any).user._id)) {
        res.status(400).json({ success: false, error: 'No puedes cambiar tu propio rol' });
        return;
      }
      if (target.role === 'superadmin') {
        res.status(403).json({ success: false, error: 'No puedes modificar a otro superadmin' });
        return;
      }

      target.role = role;
      await target.save();

      res.status(200).json({ success: true, data: { _id: target._id, role: target.role } });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  
  public async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const target = await User.findById(id);
      if (!target) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }
      if (String(target._id) === String((req as any).user._id)) {
        res.status(400).json({ success: false, error: 'No puedes deshabilitar tu propia cuenta' });
        return;
      }
      if (target.role === 'superadmin') {
        res.status(403).json({ success: false, error: 'No puedes deshabilitar a otro superadmin' });
        return;
      }

      target.isActive = !target.isActive;
      await target.save();

      res.status(200).json({
        success: true,
        data: { _id: target._id, isActive: target.isActive, role: target.role }
      });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
}

export const staffController = new StaffController();

