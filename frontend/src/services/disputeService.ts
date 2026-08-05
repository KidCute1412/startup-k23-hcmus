import { apiClient } from '@/lib/apiClient';
import type { CreateDisputePayload, CreateDisputeResponsePayload, DisputeItem } from '@/types/dispute';

export const disputeService = {
  createDispute: (payload: CreateDisputePayload) =>
    apiClient<DisputeItem>('/disputes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addResponseEvidence: (disputeId: string, payload: CreateDisputeResponsePayload) =>
    apiClient<DisputeItem>(`/disputes/${encodeURIComponent(disputeId)}/evidence`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
