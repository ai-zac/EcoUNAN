import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Goal from '../models/goal.model';
import Recycle from '../models/recycle.model';
import User from '../models/user.model';
import { notifyUser } from '../services/notification.service';

const STAFF_ROLES = ['admin', 'superadmin', 'brigadista'];

/**
 * Progreso del usuario hacia una meta:
 * reciclajes VALIDADOS creados entre el inicio de la meta y ahora (sin pasar de endDate).
 */
async function computeProgress(userId: string, goal: any): Promise<number> {
  const end = new Date(Math.min(Date.now(), new Date(goal.endDate).getTime()));
  const filter = {
    user: new Types.ObjectId(userId),
    status: 'validated',
    createdAt: { $gte: goal.createdAt, $lte: end },
  };
  // Casteo: los genericos de countDocuments en Mongoose 9 no resuelven filtros mixtos
  return Recycle.countDocuments(filter as never);
}

export class GoalController {
  // @desc    Get goals (solo activas para usuarios; staff puede pedir todas)
  // @route   GET /api/goals?includeInactive=true
  // @access  Private
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

  // @desc    Create a goal
  // @route   POST /api/goals
  // @access  Private/Admin
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

      res.status(201).json({ success: true, data: goal });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // @desc    Update a goal
  // @route   PUT /api/goals/:id
  // @access  Private/Admin
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
        new: true,
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

  // @desc    Delete a goal
  // @route   DELETE /api/goals/:id
  // @access  Private/Admin
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
  // @desc    Progreso del usuario actual en todas las metas activas
  // @route   GET /api/goals/progress
  // @access  Private
  public async getMyProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user._id;
      const goals = await Goal.find({ isActive: true });

      const data = await Promise.all(
        goals.map(async (goal: any) => ({
          goalId: goal._id,
          progress: await computeProgress(String(userId), goal),
          target: goal.targetRecycles,
          claimed: (goal.claimedBy || []).some(
            (c: any) => String(c) === String(userId)
          ),
        }))
      );

      res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('[500]', error);
      res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }
  }

  // @desc    Reclamar recompensa de una meta completada
  // @route   POST /api/goals/:id/claim
  // @access  Private
  public async claimGoal(req: Request, res: Response): Promise<void> {
    try {
      const userId = String((req as any).user._id);
      const goal = await Goal.findById(req.params.id);

      if (!goal || !goal.isActive) {
        res.status(404).json({ success: false, error: 'Meta no encontrada' });
        return;
      }
      if (new Date(goal.endDate).getTime() < Date.now()) {
        res.status(400).json({ success: false, error: 'La meta ya expirÃ³' });
        return;
      }
      if ((goal.claimedBy || []).some((c: any) => String(c) === userId)) {
        res.status(409).json({ success: false, error: 'Ya reclamaste esta meta' });
        return;
      }

      const progress = await computeProgress(userId, goal);
      if (progress < goal.targetRecycles) {
        res.status(400).json({
          success: false,
          error: `AÃºn no cumples la meta (${progress}/${goal.targetRecycles} reciclajes validados)`
        });
        return;
      }

      // Reclamo atomico: si otro request lo hizo primero, devuelve null
      const claimed = await Goal.findOneAndUpdate(
        { _id: goal._id, claimedBy: { $ne: (req as any).user._id } },
        { $addToSet: { claimedBy: (req as any).user._id } },
        { new: true }
      );
      if (!claimed) {
        res.status(409).json({ success: false, error: 'Ya reclamaste esta meta' });
        return;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { ecoPoints: goal.rewardPoints } },
        { new: true, runValidators: true }
      ).select('ecoPoints');

      await notifyUser(
        userId,
        'Â¡Meta completada! ðŸŽ¯',
        `Completaste "${goal.title}" y ganaste +${goal.rewardPoints} puntos.`
      );

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

