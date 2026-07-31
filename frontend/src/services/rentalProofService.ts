import { apiClient } from '@/lib/apiClient';
import type { RentalProof, UploadProofRequest } from '@/types/rentals';

export const rentalProofService = {
  getRentalProofs: (rentalOrderId: string) =>
    apiClient<RentalProof[]>(`/rental-orders/${encodeURIComponent(rentalOrderId)}/proofs`),

  uploadRentalProof: (rentalOrderId: string, request: UploadProofRequest) =>
    apiClient<RentalProof>(`/rental-orders/${encodeURIComponent(rentalOrderId)}/proofs`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};
