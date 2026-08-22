import { apiClient } from '../apiClient';
import { User, RecycleRecord } from '../../types';

export interface DashboardStats {
  totalUsers: number;
  validatedRecycles: number;
  activeRewards: number;
  redemptions: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  time: string;
  points: string;
  type: string;
  color: string;
  user?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
}

export const AdminService = {
  getDashboardData: async (): Promise<DashboardData> => {
    try {
      const response = await apiClient.get<{success: boolean, data: DashboardData}>('/admin/dashboard');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },

  // Users Management
  getUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<{success: boolean, data: User[]}>('/users');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/users/${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Recycle Management
  getPendingRecycles: async (): Promise<RecycleRecord[]> => {
    try {
      const response = await apiClient.get<{success: boolean, data: RecycleRecord[]}>('/recycles/pending');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pending recycles:', error);
      throw error;
    }
  },

  validateRecycle: async (id: string): Promise<void> => {
    try {
      await apiClient.put(`/recycles/${id}/validate`);
    } catch (error) {
      console.error('Error validating recycle:', error);
      throw error;
    }
  },

  rejectRecycle: async (id: string): Promise<void> => {
    try {
      await apiClient.put(`/recycles/${id}/reject`);
    } catch (error) {
      console.error('Error rejecting recycle:', error);
      throw error;
    }
  }
};
