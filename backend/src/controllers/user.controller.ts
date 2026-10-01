import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import User from '../models/user.model';

export class UserController {
  
  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async getUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.getUserById(req.params.id as string);
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error('[500]', error);
      if (error?.name === 'CastError') {
        res.status(400).json({ success: false, error: 'Identificador inválido' });
        return;
      }
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const allowed = ['name', 'email', 'faculty', 'career', 'studentId', 'isActive'];
      const payload: Record<string, any> = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) payload[key] = req.body[key];
      }
      const user = await userService.updateUser(req.params.id as string, payload);
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.deleteUser(req.params.id as string);
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  
  
  
public async getRanking(req: Request, res: Response): Promise<void> {
    try {
      
      const ranking = await User.find({ role: 'user', isActive: true })
        .select('name ecoPoints lifetimePoints faculty profilePicture')
        .sort({ ecoPoints: -1 })
        .limit(50);

      res.status(200).json({ success: true, data: ranking });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
  
  
  
  public async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.getUserById((req as any).user.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  
  
  
  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      
      const { name, email, faculty, career } = req.body;
      const user = await userService.updateUser((req as any).user.id, { name, email, faculty, career });
      
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  
  
  
  public async uploadProfilePicture(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No se subió ninguna imagen' });
        return;
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      const user = await userService.updateUser((req as any).user.id, { profilePicture: imageUrl });
      
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }
      
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  
  
  
  public async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const authUser = (req as any).user;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, error: 'Se requiere la contraseña actual y la nueva contraseña' });
        return;
      }
      if (String(newPassword).length < 8) {
        res.status(400).json({ success: false, error: 'La nueva contraseña debe tener al menos 8 caracteres' });
        return;
      }
      if (currentPassword === newPassword) {
        res.status(400).json({ success: false, error: 'La nueva contraseña debe ser diferente a la actual' });
        return;
      }

      
      const user = await User.findById(authUser._id).select('+password');
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        
        res.status(400).json({ success: false, error: 'La contraseña actual es incorrecta' });
        return;
      }

      user.password = newPassword;
      await user.save(); 

      res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  
  
  
  public async savePushToken(req: Request, res: Response): Promise<void> {
    try {
      const { expoPushToken } = req.body;
      if (!expoPushToken) {
        res.status(400).json({ success: false, error: 'El token de notificación (expoPushToken) es requerido' });
        return;
      }

      const user = await userService.updateUser((req as any).user.id, { expoPushToken });
      
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }

      res.status(200).json({ success: true, data: { expoPushToken: user.expoPushToken } });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
}

export const userController = new UserController();

