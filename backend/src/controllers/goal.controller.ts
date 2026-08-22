import { Request, Response } from 'express';
import Goal from '../models/goal.model';

export class GoalController {
  // @desc    Get all active goals
  // @route   GET /api/goals
  // @access  Public
  public async getGoals(req: Request, res: Response): Promise<void> {
    try {
      const goals = await Goal.find({ isActive: true });
      res.status(200).json({ success: true, data: goals });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const goalController = new GoalController();
