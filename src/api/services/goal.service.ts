import { apiClient } from '../apiClient';
import { Goal } from '../../types';

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    try {
      const response = await apiClient.get('/goals');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  }
};
