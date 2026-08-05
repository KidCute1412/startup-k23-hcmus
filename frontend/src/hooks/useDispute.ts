import { useState } from 'react';
import { disputeService } from '@/services/disputeService';
import { mediaService } from '@/services/mediaService';
import type { CreateDisputePayload, CreateDisputeResponsePayload } from '@/types/dispute';

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

  const addResponseEvidence = async (
    disputeId: string,
    payload: CreateDisputeResponsePayload,
  ) => {
    setLoading(true);
    setError(null);
    try {
      return await disputeService.addResponseEvidence(disputeId, payload);
    } catch (err: any) {
      const msg = err.message || 'Gửi bằng chứng phản hồi thất bại.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createDispute,
    uploadMedia,
    addResponseEvidence,
    loading,
    error,
  };
}
