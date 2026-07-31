import { useState } from 'react';
import { disputeService } from '@/services/disputeService';
import { mediaService } from '@/services/mediaService';
import type { CreateDisputePayload } from '@/types/dispute';

export function useDispute() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createDispute = async (payload: CreateDisputePayload) => {
    setLoading(true);
    setError(null);
    try {
      const result = await disputeService.createDispute(payload);
      return result;
    } catch (err: any) {
      const msg = err.message || 'Gửi khiếu nại thất bại.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const uploadMedia = async (file: File): Promise<string> => {
    return mediaService.uploadImage(file);
  };

  return {
    createDispute,
    uploadMedia,
    loading,
    error,
  };
}
