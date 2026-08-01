import { apiClient } from '@/lib/apiClient';
import type { CreateDisputePayload, DisputeItem } from '@/types/dispute';

export const disputeService = {
  createDispute: (payload: CreateDisputePayload) =>
    apiClient<DisputeItem>('/disputes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
