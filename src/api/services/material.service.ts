import { apiClient } from '../apiClient';

export interface MaterialItem {
  _id: string;
  key: string;
  name: string;
  pointsPerKg: number;
  unit: string;
  icon: string;
  color: string;
  bg: string;
  description?: string;
  isActive: boolean;
  order: number;
}

export const MaterialService = {
  getMaterials: async (): Promise<MaterialItem[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: MaterialItem[] }>('/materials');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  },

  getAllMaterialsAdmin: async (): Promise<MaterialItem[]> => {
    try {
      const response = await apiClient.get<{ success: boolean; data: MaterialItem[] }>('/materials/admin/all');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching all materials for admin:', error);
      throw error;
    }
  },

  createMaterial: async (data: Partial<MaterialItem>): Promise<MaterialItem> => {
    try {
      const response = await apiClient.post<{ success: boolean; data: MaterialItem }>('/materials', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  },

  updateMaterial: async (id: string, data: Partial<MaterialItem>): Promise<MaterialItem> => {
    try {
      const response = await apiClient.put<{ success: boolean; data: MaterialItem }>(`/materials/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  },

  toggleMaterialStatus: async (id: string): Promise<MaterialItem> => {
    try {
      const response = await apiClient.patch<{ success: boolean; data: MaterialItem }>(`/materials/${id}/toggle`);
      return response.data.data;
    } catch (error) {
      console.error('Error toggling material status:', error);
      throw error;
    }
  },

  deleteMaterial: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/materials/${id}`);
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  },
};
