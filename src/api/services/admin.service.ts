import { apiClient } from '../apiClient';
import { User, RecycleRecord, Goal } from '../../types';

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

  // ===== Gestion de staff (solo superadmin) =====
  searchUsers: async (search: string = '', status: '' | 'active' | 'inactive' = ''): Promise<User[]> => {
    try {
      const response = await apiClient.get<{success: boolean, data: User[]}>('/staff/users', {
        params: { search: search || undefined, status: status || undefined },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  createStaff: async (payload: {
    name: string; email: string; password: string; role: string;
    studentId?: string; faculty?: string; career?: string;
  }): Promise<User> => {
    try {
      const response = await apiClient.post<{success: boolean, data: User}>('/staff/users', payload);
      return response.data.data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },

  updateUserRole: async (id: string, role: string): Promise<void> => {
    try {
      await apiClient.put(`/staff/users/${id}/role`, { role });
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  toggleUserStatus: async (id: string): Promise<{ isActive: boolean }> => {
    try {
      const response = await apiClient.put<{success: boolean, data: { isActive: boolean }}>(`/staff/users/${id}/status`);
      return response.data.data;
    } catch (error) {
      console.error('Error toggling status:', error);
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
  },

  // ===== Historial global de canjes (admin y superadmin) =====
  getAllRedemptions: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get<{success: boolean, data: any[]}>('/admin/redemptions');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching redemptions:', error);
      throw error;
    }
  },

  completeRedemption: async (id: string): Promise<void> => {
    try {
      await apiClient.put(`/admin/redemptions/${id}/complete`);
    } catch (error) {
      console.error('Error completing redemption:', error);
      throw error;
    }
  },

  cancelRedemption: async (id: string): Promise<void> => {
    try {
      await apiClient.put(`/admin/redemptions/${id}/cancel`);
    } catch (error) {
      console.error('Error cancelling redemption:', error);
      throw error;
    }
  },

  // ===== Gestion de metas (admin y superadmin) =====
  getGoalsAdmin: async (): Promise<Goal[]> => {
    try {
      const response = await apiClient.get<{success: boolean, data: Goal[]}>('/goals', {
        params: { includeInactive: true },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  createGoal: async (payload: Omit<Goal, '_id' | 'isActive'>): Promise<Goal> => {
    try {
      const response = await apiClient.post<{success: boolean, data: Goal}>('/goals', payload);
      return response.data.data;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  updateGoal: async (id: string, payload: Partial<Goal>): Promise<Goal> => {
    try {
      const response = await apiClient.put<{success: boolean, data: Goal}>(`/goals/${id}`, payload);
      return response.data.data;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  deleteGoal: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/goals/${id}`);
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },
};
