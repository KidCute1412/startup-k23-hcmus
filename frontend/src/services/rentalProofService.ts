import { apiClient } from '@/lib/apiClient';

export interface RentalProof {
  id: string;
  rentalOrderId: string;
  uploaderId: string;
  stage: 'pre_shipment' | 'post_receipt' | 'pre_return' | 'post_return' | string;
  proofType: 'image' | 'video';
  fileUrl: string;
  note?: string | null;
  createdAt: string;
}

export interface UploadProofRequest {
  stage: string;
  fileUrl: string;
  note?: string;
}

export const rentalProofService = {
  getRentalProofs: (rentalOrderId: string) =>
    apiClient<RentalProof[]>(`/rental-orders/${encodeURIComponent(rentalOrderId)}/proofs`),

  uploadRentalProof: (rentalOrderId: string, request: UploadProofRequest) =>
    apiClient<RentalProof>(`/rental-orders/${encodeURIComponent(rentalOrderId)}/proofs`, {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};
