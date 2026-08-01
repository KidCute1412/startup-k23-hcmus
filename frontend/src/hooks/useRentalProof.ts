'use client';

import { useCallback, useState } from 'react';
import { rentalProofService } from '@/services/rentalProofService';
import type { RentalProof, UploadProofRequest } from '@/types/rentals';

export function useRentalProof(rentalOrderId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofs, setProofs] = useState<RentalProof[]>([]);

  const fetchProofs = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const data = await rentalProofService.getRentalProofs(rentalOrderId);
      setProofs(data);
      return data;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Không thể lấy danh sách minh chứng.';
      setError(message); throw cause;
    } finally { setIsLoading(false); }
  }, [rentalOrderId]);

  const uploadProof = useCallback(async (request: UploadProofRequest) => {
    setIsLoading(true); setError(null);
    try {
      const newProof = await rentalProofService.uploadRentalProof(rentalOrderId, request);
      setProofs((prev) => [...prev, newProof]);
      return newProof;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Tải lên minh chứng thất bại.';
      setError(message); throw cause;
    } finally { setIsLoading(false); }
  }, [rentalOrderId]);

  return {
    proofs,
    isLoading,
    error,
    fetchProofs,
    uploadProof,
  };
}
