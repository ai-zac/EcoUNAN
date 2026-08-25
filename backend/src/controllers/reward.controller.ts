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
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
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

      // 1) Deduccion de puntos ATOMICA con guarda de saldo suficiente
      const updatedUser = await User.findOneAndUpdate(
        { _id: userId, ecoPoints: { $gte: reward.pointsCost } },
        { $inc: { ecoPoints: -reward.pointsCost } },
        { new: true }
      );
      if (!updatedUser) {
        res.status(400).json({ success: false, error: 'Puntos insuficientes' });
        return;
      }

      // 2) Descuento de stock ATOMICO (solo si queda inventario)
      let stockOk = true;
      if (reward.stock !== -1) {
        const updatedReward = await Reward.findOneAndUpdate(
          { _id: reward._id, stock: { $gt: 0 } },
          { $inc: { stock: -1 } },
          { new: true }
        );
        if (!updatedReward) {
          stockOk = false;
        }
      }

      if (!stockOk) {
        // Perdio la carrera por el ultimo articulo: reembolso atomico
        await User.findByIdAndUpdate(userId, { $inc: { ecoPoints: reward.pointsCost } });
        res.status(400).json({ success: false, error: 'Recompensa agotada' });
        return;
      }

      // Create unique QR code
      const qrData = `REDEMPTION-${userId}-${reward._id}-${crypto.randomBytes(8).toString('hex')}`;

      const redemption = await Redemption.create({
        user: userId as unknown as mongoose.Schema.Types.ObjectId,
        reward: reward._id as unknown as mongoose.Schema.Types.ObjectId,
        pointsSpent: reward.pointsCost,
        status: 'pending',
        qrCodeData: qrData
      });

      res.status(201).json({
        success: true,
        data: redemption
      });
    } catch (error) {
      console.error('[redeemReward]', error);
      res.status(500).json({ success: false, error: 'Error interno al procesar el canje' });
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
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
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
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
}

export const rewardController = new RewardController();

