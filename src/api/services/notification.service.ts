import { apiClient } from '../apiClient';
import { Notification } from '../../types';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get('/notifications');
      return response.data?.data || [];
    } catch (error: any) {
      if (error?.response?.status === 429) {
        console.warn('[notificationService] Rate limited (429). Silenciando petición.');
        return [];
      }
      console.warn('Error fetching notifications (silenciado):', error?.message || error);
      return [];
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
    } catch (error: any) {
      if (error?.response?.status !== 429) {
        console.warn('Error marking notification as read:', error?.message || error);
      }
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.put('/notifications/mark-all-read');
    } catch (error: any) {
      if (error?.response?.status !== 429) {
        console.warn('Error marking all notifications as read:', error?.message || error);
      }
    }
  },
};
