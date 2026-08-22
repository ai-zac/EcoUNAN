import { Request, Response } from 'express';
import { userService } from '../services/user.service';

export class UserController {
  
  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
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
      res.status(500).json({ success: false, error: error.message });
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
      res.status(500).json({ success: false, error: error.message });
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
      res.status(500).json({ success: false, error: error.message });
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
      res.status(500).json({ success: false, error: error.message });
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
        res.status(400).json({ success: false, error: 'No se subió ninguna imagen' });
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
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const userController = new UserController();
