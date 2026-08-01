import { apiClient } from '@/lib/apiClient';

export const mediaService = {
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient<{ url: string }>('/media/upload', {
      method: 'POST',
      body: formData,
    });

    return response.url;
  },
};
