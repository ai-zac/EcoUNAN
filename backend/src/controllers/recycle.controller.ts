import { Request, Response } from 'express';
import Recycle from '../models/recycle.model';
import User from '../models/user.model';

export class RecycleController {
  
  // User: Registers a new recycle action (pending validation)
  public async registerRecycle(req: Request, res: Response): Promise<void> {
    try {
      const { items, description } = req.body;
      const user = (req as any).user;

      if (!user || !items) {
        res.status(400).json({ success: false, error: 'Missing user or items' });
        return;
      }

      const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      
      let totalWeight = 0;
      let totalPoints = 0;
      
      const processedItems = parsedItems.map((item: any) => {
        const weight = Number(item.weight);
        const pointsEarned = Math.floor(weight * 10);
        totalWeight += weight;
        totalPoints += pointsEarned;
        
        return {
          materialType: item.materialType,
          weight,
          pointsEarned
        };
      });

      let proofImage = undefined;
      if (req.file) {
        proofImage = `/uploads/${req.file.filename}`;
      }

      const recycle = await Recycle.create({
        user: user._id,
        items: processedItems,
        totalWeight,
        totalPoints,
        status: 'pending',
        proofImage,
        description
      });

      res.status(201).json({ success: true, data: recycle });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // Admin: Get all pending recycles
  public async getPendingRecycles(req: Request, res: Response): Promise<void> {
    try {
      const pendingRecycles = await Recycle.find({ status: 'pending' })
        .populate('user', 'name email')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: pendingRecycles });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // User: Get personal recycle history
  public async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }

      const history = await Recycle.find({ user: user._id })
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // User: Scan QR to automatically validate recycling
  public async scanQR(req: Request, res: Response): Promise<void> {
    try {
      const { qrData } = req.body;
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({ success: false, error: 'Not authorized' });
        return;
      }

      let parsedData;
      try {
        parsedData = JSON.parse(qrData);
      } catch (e) {
        res.status(400).json({ success: false, error: 'Invalid QR format' });
        return;
      }

      if (parsedData.type !== 'eco-unan-qr') {
        res.status(400).json({ success: false, error: 'Invalid QR code' });
        return;
      }

      const weight = Number(parsedData.weight);
      const pointsEarned = Math.floor(weight * 10);

      const processedItems = [{
        materialType: parsedData.material,
        weight,
        pointsEarned
      }];

      const recycle = await Recycle.create({
        user: user._id,
        items: processedItems,
        totalWeight: weight,
        totalPoints: pointsEarned,
        status: 'validated'
      });

      // Award points directly
      const dbUser = await User.findById(user._id);
      if (dbUser) {
        dbUser.ecoPoints = (dbUser.ecoPoints || 0) + pointsEarned;
        await dbUser.save();
      }

      res.status(200).json({ success: true, data: recycle });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Validate a recycle action and award points
  public async validateRecycle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recycle = await Recycle.findById(id);

      if (!recycle) {
        res.status(404).json({ success: false, error: 'Recycle record not found' });
        return;
      }

      if (recycle.status !== 'pending') {
        res.status(400).json({ success: false, error: 'Recycle record is not pending' });
        return;
      }

      // Award points to the user
      const user = await User.findById(recycle.user);
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      user.ecoPoints = (user.ecoPoints || 0) + recycle.totalPoints;
      await user.save();

      recycle.status = 'validated';
      await recycle.save();

      res.status(200).json({ success: true, data: recycle });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Admin: Reject a recycle action
  public async rejectRecycle(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const recycle = await Recycle.findById(id);

      if (!recycle) {
        res.status(404).json({ success: false, error: 'Recycle record not found' });
        return;
      }

      if (recycle.status !== 'pending') {
        res.status(400).json({ success: false, error: 'Recycle record is not pending' });
        return;
      }

      recycle.status = 'rejected';
      await recycle.save();

      res.status(200).json({ success: true, data: recycle });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const recycleController = new RecycleController();
