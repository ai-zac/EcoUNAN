import { apiClient } from '../apiClient';
import { RecycleRecord } from '../../types';

export const RecycleService = {
  
  getHistory: async (): Promise<RecycleRecord[]> => {
    try {
      const response = await apiClient.get<{success: boolean, data: RecycleRecord[]}>('/recycles/history');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recycle history:', error);
      throw error;
    }
  },

  getUserStats: async (userId: string): Promise<{recycleCount: number, totalWeight: number}> => {
    try {
      const response = await apiClient.get<{success: boolean, data: {recycleCount: number, totalWeight: number}}>(`/recycles/user/${userId}/stats`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user recycle stats:', error);
      throw error;
    }
  },

  registerRecycle: async (
    items: {materialType: string, weight: number}[],
    photoUri: string | null,
    description?: string,
    validationMode: 'photo' | 'inperson' = 'photo'
  ): Promise<RecycleRecord> => {
    try {
      const formData = new FormData();
      formData.append('items', JSON.stringify(items));
      formData.append('validationMode', validationMode);

      if (description) {
        formData.append('description', description);
      }

      if (photoUri) {
        let filename = photoUri.split('/').pop() || 'photo.jpg';
        filename = filename.split('?')[0];

        // Asegurar extensión estándar para evitar rechazo en multer
        if (!/\.(jpe?g|png|webp|heic|heif)$/i.test(filename)) {
          filename = `${filename}.jpg`;
        }

        const extMatch = /\.(\w+)$/.exec(filename);
        const ext = extMatch ? extMatch[1].toLowerCase() : 'jpeg';
        const type = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

        formData.append('proofImage', {
          uri: photoUri,
          name: filename,
          type
        } as any);
      }

      const response = await apiClient.post<{success: boolean, data: RecycleRecord}>(
        '/recycles/register',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          transformRequest: (data) => data,
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error registering recycle:', error);
      throw error;
    }
  },

  getApprovalQr: async (recycleId: string): Promise<string> => {
    try {
      const response = await apiClient.get<{success: boolean, data: {qrData: string}}>(`/recycles/${recycleId}/approval-qr`);
      return response.data.data.qrData;
    } catch (error) {
      console.error('Error getting approval QR:', error);
      throw error;
    }
  },

  confirmPresential: async (qrData: string): Promise<RecycleRecord> => {
    try {
      const response = await apiClient.post<{ success: boolean; data?: RecycleRecord; recycle?: RecycleRecord }>(
        '/recycles/confirm-presential',
        { qrData }
      );
      return (response.data.data || (response.data as any).recycle) as RecycleRecord;
    } catch (error) {
      console.error('Error confirming presential recycle:', error);
      throw error;
    }
  },

};
