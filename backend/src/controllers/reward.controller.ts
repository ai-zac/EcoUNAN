import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Reward from '../models/reward.model';
import User from '../models/user.model';
import Redemption from '../models/redemption.model';
import crypto from 'crypto';

export class RewardController {
  // @desc    Get all active rewards
  // @route   GET /api/rewards
  // @access  Public
  public async getRewards(req: Request, res: Response): Promise<void> {
    try {
      const rewards = await Reward.find({ isActive: true });
      res.status(200).json({ success: true, data: rewards });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // @desc    Redeem a reward
  // @route   POST /api/rewards/redeem/:id
  // @access  Private
  public async redeemReward(req: Request, res: Response): Promise<void> {
    try {
      const rewardId = req.params.id;
      const userId = (req as any).user._id;

      const reward = await Reward.findById(rewardId);
      if (!reward || !reward.isActive) {
        res.status(404).json({ success: false, error: 'Recompensa no encontrada o inactiva' });
        return;
      }

      if (reward.stock === 0) {
        res.status(400).json({ success: false, error: 'Recompensa agotada' });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }

      if (user.ecoPoints < reward.pointsCost) {
        res.status(400).json({ success: false, error: 'Puntos insuficientes' });
        return;
      }

      // Deduct points
      user.ecoPoints -= reward.pointsCost;
      await user.save();

      // Update stock if not unlimited (-1)
      if (reward.stock > 0) {
        reward.stock -= 1;
        await reward.save();
      }

      // Create unique QR code
      const qrData = `REDEMPTION-${user._id}-${reward._id}-${crypto.randomBytes(4).toString('hex')}`;

      const redemption = await Redemption.create({
        user: user._id as unknown as mongoose.Schema.Types.ObjectId,
        reward: reward._id as unknown as mongoose.Schema.Types.ObjectId,
        pointsSpent: reward.pointsCost,
        status: 'pending',
        qrCodeData: qrData
      });

      res.status(201).json({
        success: true,
        data: redemption
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // @desc    Get user's redeemed rewards
  // @route   GET /api/rewards/my-rewards
  // @access  Private
  public async getMyRewards(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;
      const redemptions = await Redemption.find({ user: userId })
        .populate('reward')
        .sort({ createdAt: -1 });
      
      res.status(200).json({ success: true, data: redemptions });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // @desc    Create a reward
  // @route   POST /api/rewards
  // @access  Private/Admin
  public async createReward(req: Request, res: Response): Promise<void> {
    try {
      const reward = await Reward.create(req.body);
      res.status(201).json({ success: true, data: reward });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // @desc    Update a reward
  // @route   PUT /api/rewards/:id
  // @access  Private/Admin
  public async updateReward(req: Request, res: Response): Promise<void> {
    try {
      const reward = await Reward.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!reward) {
        res.status(404).json({ success: false, error: 'Recompensa no encontrada' });
        return;
      }

      res.status(200).json({ success: true, data: reward });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // @desc    Delete a reward
  // @route   DELETE /api/rewards/:id
  // @access  Private/Admin
  public async deleteReward(req: Request, res: Response): Promise<void> {
    try {
      const reward = await Reward.findByIdAndDelete(req.params.id);

      if (!reward) {
        res.status(404).json({ success: false, error: 'Recompensa no encontrada' });
        return;
      }

      res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const rewardController = new RewardController();
