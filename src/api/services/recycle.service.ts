import { apiClient } from '../apiClient';
import { RecycleRecord } from '../../types';

export const RecycleService = {
  /**
   * Get user's recycle history
   */
  getHistory: async (): Promise<RecycleRecord[]> => {
    try {
      const response = await apiClient.get<{success: boolean, data: RecycleRecord[]}>('/recycles/history');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recycle history:', error);
      throw error;
    }
  },

  registerRecycle: async (items: {materialType: string, weight: number}[], photoUri: string, description?: string): Promise<RecycleRecord> => {
    try {
      const formData = new FormData();
      formData.append('items', JSON.stringify(items));
      
      if (description) {
        formData.append('description', description);
      }
      
      const filename = photoUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      formData.append('proofImage', {
        uri: photoUri,
        name: filename,
        type
      } as any);

      const response = await apiClient.post<{success: boolean, data: RecycleRecord}>('/recycles/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error registering recycle:', error);
      throw error;
    }
  },

  scanQR: async (qrData: string): Promise<RecycleRecord> => {
    try {
      const response = await apiClient.post<{success: boolean, data: RecycleRecord}>('/recycles/scan-qr', {
        qrData
      });
      return response.data.data;
    } catch (error) {
      console.error('Error scanning QR:', error);
      throw error;
    }
  }
};
