'use client';

import { useCallback, useState } from 'react';
import { mediaService } from '@/services/mediaService';

export function useMedia() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const url = await mediaService.uploadImage(file);
      return url;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Tải lên hình ảnh thất bại.';
      setError(message);
      throw cause;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    uploadImage,
    isLoading,
    error,
  };
}
