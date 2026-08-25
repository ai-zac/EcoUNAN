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
        res.status(404).json({ success: false, error: 'User not found' });
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
      const user = await userService.updateUser(req.params.id as string, req.body);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
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
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  // @desc    Get users ranking
  // @route   GET /api/users/ranking
  // @access  Public/Protected
  public async getRanking(req: Request, res: Response): Promise<void> {
    try {
      // Get top 50 users sorted by ecoPoints descending
      const ranking = await userService.getAllUsers();
      // Since userService.getAllUsers() might just return all, let's sort them.
      // Better to query directly, but using service for now.
      const sortedRanking = ranking
        .sort((a, b) => b.ecoPoints - a.ecoPoints)
        .slice(0, 50);

      res.status(200).json({ success: true, data: sortedRanking });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
  // @desc    Get current user profile
  // @route   GET /api/users/me
  // @access  Private
  public async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.getUserById((req as any).user.id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  // @desc    Update current user profile
  // @route   PUT /api/users/profile
  // @access  Private
  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // Allow user to update certain fields like name, email, faculty, career
      const { name, email, faculty, career } = req.body;
      const user = await userService.updateUser((req as any).user.id, { name, email, faculty, career });
      
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  // @desc    Upload profile picture
  // @route   POST /api/users/profile/picture
  // @access  Private
  public async uploadProfilePicture(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, error: 'No se subiÃ³ ninguna imagen' });
        return;
      }
      
      const imageUrl = `/uploads/${req.file.filename}`;
      const user = await userService.updateUser((req as any).user.id, { profilePicture: imageUrl });
      
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }
      
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // @desc    Change own password
  // @route   PUT /api/users/password
  // @access  Private (cualquier rol, sobre su propia cuenta)
  public async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const authUser = (req as any).user;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, error: 'Se requieren currentPassword y newPassword' });
        return;
      }
      if (String(newPassword).length < 8) {
        res.status(400).json({ success: false, error: 'La nueva contraseÃ±a debe tener al menos 8 caracteres' });
        return;
      }
      if (currentPassword === newPassword) {
        res.status(400).json({ success: false, error: 'La nueva contraseÃ±a debe ser diferente a la actual' });
        return;
      }

      // Traer el documento con el hash para poder verificar
      const user = await User.findById(authUser._id);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        // 400 (no 401): evita que el interceptor de la app cierre la sesiÃ³n por error de tipeo
        res.status(400).json({ success: false, error: 'La contraseÃ±a actual es incorrecta' });
        return;
      }

      user.password = newPassword;
      await user.save(); // el pre-save hook la hashea

      res.status(200).json({ success: true, message: 'ContraseÃ±a actualizada correctamente' });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  // @desc    Save Expo Push Token
  // @route   PUT /api/users/push-token
  // @access  Private
  public async savePushToken(req: Request, res: Response): Promise<void> {
    try {
      const { expoPushToken } = req.body;
      if (!expoPushToken) {
        res.status(400).json({ success: false, error: 'expoPushToken is required' });
        return;
      }

      const user = await userService.updateUser((req as any).user.id, { expoPushToken });
      
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
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

