import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Goal from '../models/goal.model';
import GoalClaim from '../models/goalClaim.model';
import Recycle from '../models/recycle.model';
import User from '../models/user.model';
import { notifyUser, notifyAllUsers } from '../services/notification.service';
import { checkAndNotifyRankUpgrade } from '../utils/ranks';

const STAFF_ROLES = ['admin', 'superadmin', 'brigadista'];

async function computeProgress(userId: string, goal: any): Promise<number> {
  const end = new Date(Math.min(Date.now(), new Date(goal.endDate).getTime()));
  const filter = {
    user: new Types.ObjectId(userId),
    status: 'validated',
    createdAt: { $gte: goal.createdAt, $lte: end },
  };

  return Recycle.countDocuments(filter as never);
}

export class GoalController {

  public async getGoals(req: Request, res: Response): Promise<void> {
    try {
      const role = (req as any).user?.role;
      const includeInactive = req.query.includeInactive === 'true' && STAFF_ROLES.includes(role);
      const filter = includeInactive ? {} : { isActive: true };

      const goals = await Goal.find(filter).sort({ createdAt: -1 });
      res.status(200).json({ success: true, data: goals });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async createGoal(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, targetRecycles, rewardPoints, endDate } = req.body;

      if (!title || !description || targetRecycles == null || rewardPoints == null || !endDate) {
        res.status(400).json({ success: false, error: 'title, description, targetRecycles, rewardPoints y endDate son obligatorios' });
        return;
      }
      const parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        res.status(400).json({ success: false, error: 'endDate no es una fecha vÃ¡lida' });
        return;
      }
      if (Number(targetRecycles) <= 0 || Number(rewardPoints) <= 0) {
        res.status(400).json({ success: false, error: 'targetRecycles y rewardPoints deben ser mayores a 0' });
        return;
      }

      const goal = await Goal.create({
        title,
        description,
        targetRecycles: Number(targetRecycles),
        rewardPoints: Number(rewardPoints),
        endDate: parsedEnd,
        isActive: true,
      });

      notifyAllUsers(
        '¡Nueva meta disponible! 🎯',
        `Participa en "${goal.title}" y gana ${goal.rewardPoints} EcoPuntos extra. ¡Únete al desafío!`
      ).catch((err) => console.error('[createGoal] Error notificando a los usuarios:', err));

      res.status(201).json({ success: true, data: goal });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async updateGoal(req: Request, res: Response): Promise<void> {
    try {
      const allowed = ['title', 'description', 'targetRecycles', 'rewardPoints', 'endDate', 'isActive'];
      const payload: Record<string, any> = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) payload[key] = req.body[key];
      }
      if (payload.endDate) {
        const d = new Date(payload.endDate);
        if (isNaN(d.getTime())) {
          res.status(400).json({ success: false, error: 'endDate no es una fecha vÃ¡lida' });
          return;
        }
        payload.endDate = d;
      }

      const goal = await Goal.findByIdAndUpdate(req.params.id, payload, {
        returnDocument: 'after',
        runValidators: true,
      });

      if (!goal) {
        res.status(404).json({ success: false, error: 'Meta no encontrada' });
        return;
      }

      res.status(200).json({ success: true, data: goal });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  public async deleteGoal(req: Request, res: Response): Promise<void> {
    try {
      const goal = await Goal.findByIdAndDelete(req.params.id);

      if (!goal) {
        res.status(404).json({ success: false, error: 'Meta no encontrada' });
        return;
      }

      res.status(200).json({ success: true, data: {} });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async getMyProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;
      const goals = await Goal.find({ isActive: true });
      const goalIds = goals.map((g: any) => g._id);

      const userClaims = await GoalClaim.find({ user: userId, goal: { $in: goalIds } }).select('goal');
      const claimedSet = new Set(userClaims.map((c: any) => String(c.goal)));

      const data = await Promise.all(
        goals.map(async (goal: any) => {
          const isClaimed = claimedSet.has(String(goal._id)) || (goal.claimedBy || []).some(
            (c: any) => String(c) === String(userId)
          );

          return {
            goalId: goal._id,
            progress: await computeProgress(String(userId), goal),
            target: goal.targetRecycles,
            claimed: isClaimed,
          };
        })
      );

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  public async claimGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = String((req as any).user._id);
      const goal = await Goal.findById(req.params.id);

      if (!goal || !goal.isActive) {
        res.status(404).json({ success: false, error: 'Meta no encontrada' });
        return;
      }
      if (new Date(goal.endDate).getTime() < Date.now()) {
        res.status(400).json({ success: false, error: 'La meta ya expiró' });
        return;
      }

      const alreadyClaimed = await GoalClaim.findOne({ goal: goal._id as any, user: (req as any).user._id });
      if (alreadyClaimed || (goal.claimedBy || []).some((c: any) => String(c) === userId)) {
        res.status(409).json({ success: false, error: 'Ya reclamaste esta meta' });
        return;
      }

      const progress = await computeProgress(userId, goal);
      if (progress < goal.targetRecycles) {
        res.status(400).json({
          success: false,
          error: `Aún no cumples la meta (${progress}/${goal.targetRecycles} reciclajes validados)`
        });
        return;
      }

      // Record claim atomically with unique index idempotency
      try {
        await GoalClaim.create({
          goal: goal._id as any,
          user: (req as any).user._id,
          pointsAwarded: goal.rewardPoints,
        });
      } catch (claimErr: any) {
        if (claimErr.code === 11000) {
          res.status(409).json({ success: false, error: 'Ya reclamaste esta meta' });
          return;
        }
        throw claimErr;
      }

      const targetUser = await User.findById(userId);
      const prevLifetimePoints = targetUser?.lifetimePoints || 0;
      const newLifetimePoints = prevLifetimePoints + goal.rewardPoints;

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { ecoPoints: goal.rewardPoints, lifetimePoints: goal.rewardPoints } },
        { returnDocument: 'after', runValidators: true }
      ).select('ecoPoints lifetimePoints');

      await notifyUser(
        userId,
        '¡Meta completada! 🎯',
        `Completaste "${goal.title}" y ganaste +${goal.rewardPoints} puntos.`
      );

      await checkAndNotifyRankUpgrade(userId, prevLifetimePoints, newLifetimePoints);

      res.status(200).json({
        success: true,
        data: {
          goalId: goal._id,
          pointsAwarded: goal.rewardPoints,
          progress,
          ecoPoints: updatedUser?.ecoPoints ?? 0
        }
      });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }
}

export const goalController = new GoalController();
