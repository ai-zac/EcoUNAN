import { apiClient } from '../apiClient';
import { Reward, Redemption } from '../../types';

export const rewardService = {
  getRewards: async (): Promise<Reward[]> => {
    try {
      const response = await apiClient.get('/rewards');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching rewards:', error);
      throw error;
    }
  },

  getMyRewards: async (): Promise<Redemption[]> => {
    try {
      const response = await apiClient.get('/rewards/my-rewards');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching my rewards:', error);
      throw error;
    }
  },

  redeemReward: async (rewardId: string): Promise<Redemption> => {
    try {
      const response = await apiClient.post(`/rewards/redeem/${rewardId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  },

  createReward: async (rewardData: Partial<Reward>): Promise<Reward> => {
    try {
      const response = await apiClient.post('/rewards', rewardData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
    }
  },

  updateReward: async (rewardId: string, rewardData: Partial<Reward>): Promise<Reward> => {
    try {
      const response = await apiClient.put(`/rewards/${rewardId}`, rewardData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating reward:', error);
      throw error;
    }
  },

  deleteReward: async (rewardId: string): Promise<void> => {
    try {
      await apiClient.delete(`/rewards/${rewardId}`);
    } catch (error) {
      console.error('Error deleting reward:', error);
      throw error;
    }
  }
};
