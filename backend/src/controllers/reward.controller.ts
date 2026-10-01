import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Reward from '../models/reward.model';
import User from '../models/user.model';
import Redemption from '../models/redemption.model';
import crypto from 'crypto';
import { notifyUser, notifyAllUsers } from '../services/notification.service';
import { invalidateUserCache } from '../middlewares/auth.middleware';

export class RewardController {

  public async getRewards(req: Request, res: Response): Promise<void> {
    try {
      const rewards = await Reward.find({ isActive: true });
      res.status(200).json({ success: true, data: rewards });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async redeemReward(req: Request, res: Response): Promise<void> {
    const rewardId = req.params.id;
    const userId = (req as any).user._id;

    const session = await mongoose.startSession();
    let redemption: any;

    try {
      await session.withTransaction(async () => {
        const reward = await Reward.findById(rewardId).session(session);
        if (!reward || !reward.isActive) {
          throw new Error('NOT_FOUND_OR_INACTIVE');
        }
        if (reward.stock === 0) {
          throw new Error('OUT_OF_STOCK');
        }

        const updatedUser = await User.findOneAndUpdate(
          { _id: userId, ecoPoints: { $gte: reward.pointsCost } },
          { $inc: { ecoPoints: -reward.pointsCost } },
          { session, returnDocument: 'after' }
        );
        if (!updatedUser) {
          throw new Error('INSUFFICIENT_POINTS');
        }

        if (reward.stock !== -1) {
          const updatedReward = await Reward.findOneAndUpdate(
            { _id: reward._id, stock: { $gt: 0 } },
            { $inc: { stock: -1 } },
            { session, returnDocument: 'after' }
          );
          if (!updatedReward) {
            throw new Error('OUT_OF_STOCK');
          }
        }

        const qrData = `REDEMPTION-${userId}-${reward._id}-${crypto.randomBytes(8).toString('hex')}`;
        const created = await Redemption.create(
          [
            {
              user: userId as unknown as mongoose.Schema.Types.ObjectId,
              reward: reward._id as unknown as mongoose.Schema.Types.ObjectId,
              pointsSpent: reward.pointsCost,
              status: 'pending',
              qrCodeData: qrData,
            },
          ],
          { session }
        );
        redemption = created[0];
      });

      invalidateUserCache(userId);

      notifyUser(
        String(userId),
        '¡Canje solicitado! 🎟️',
        'Has canjeado tu recompensa. Presenta tu código QR en el centro de atención para retirarla.'
      ).catch((err) => console.error('[redeemReward] Error notificando al usuario:', err));

      res.status(201).json({
        success: true,
        data: redemption,
      });
    } catch (error: any) {
      if (error.message === 'NOT_FOUND_OR_INACTIVE') {
        res.status(404).json({ success: false, error: 'Recompensa no encontrada o inactiva' });
        return;
      }
      if (error.message === 'OUT_OF_STOCK') {
        res.status(400).json({ success: false, error: 'Recompensa agotada' });
        return;
      }
      if (error.message === 'INSUFFICIENT_POINTS') {
        res.status(400).json({ success: false, error: 'Puntos insuficientes' });
        return;
      }

      console.error('[redeemReward:catch]', error);
      res.status(500).json({ success: false, error: 'Error interno al procesar el canje' });
    } finally {
      await session.endSession();
    }
  }

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

public async createReward(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, pointsCost, stock, iconName, iconColor, iconBg, isActive } = req.body;
      const reward = await Reward.create({ title, description, pointsCost, stock, iconName, iconColor, iconBg, isActive });

      if (reward.isActive !== false) {
        notifyAllUsers(
          '¡Nueva recompensa en el catálogo! 🎁',
          `Ya está disponible "${reward.title}" por ${reward.pointsCost} EcoPuntos. ¡Revisa el catálogo y canjéala!`
        ).catch((err) => console.error('[createReward] Error notificando a los usuarios:', err));
      }
      res.status(201).json({ success: true, data: reward });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

public async updateReward(req: Request, res: Response): Promise<void> {
    try {
      const allowed = ['title', 'description', 'pointsCost', 'stock', 'iconName', 'iconColor', 'iconBg', 'isActive'];
      const payload: Record<string, any> = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) payload[key] = req.body[key];
      }
      const reward = await Reward.findByIdAndUpdate(req.params.id, payload, {
        returnDocument: 'after',
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
