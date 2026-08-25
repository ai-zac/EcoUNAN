import { apiClient } from '../apiClient';
import { Goal } from '../../types';

export interface GoalProgress {
  goalId: string;
  progress: number;
  target: number;
  claimed: boolean;
}

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    try {
      const response = await apiClient.get('/goals');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  getMyProgress: async (): Promise<GoalProgress[]> => {
    try {
      const response = await apiClient.get('/goals/progress');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching goal progress:', error);
      throw error;
    }
  },

  claimGoal: async (goalId: string): Promise<{ pointsAwarded: number; ecoPoints: number }> => {
    try {
      const response = await apiClient.post(`/goals/${goalId}/claim`);
      return response.data.data;
    } catch (error) {
      console.error('Error claiming goal:', error);
      throw error;
    }
  }
};
