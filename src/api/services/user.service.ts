import { apiClient } from '../apiClient';
import { User } from '../../types';

export const userService = {
  getRanking: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get('/users/ranking');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user ranking:', error);
      throw error;
    }
  },

  getMe: async (): Promise<User> => {
    try {
      const response = await apiClient.get('/users/me');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },

  updateProfile: async (data: { name?: string; email?: string; faculty?: string; career?: string }): Promise<User> => {
    try {
      const response = await apiClient.put('/users/profile', data);
      return response.data.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  uploadProfilePicture: async (imageUri: string): Promise<User> => {
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('profilePicture', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post('/users/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }
};
