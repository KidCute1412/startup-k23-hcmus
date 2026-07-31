import { apiClient, apiClientPaginated, PaginationMeta } from '@/lib/apiClient';
import type {
  AdminGearItem,
  AdminKycUser,
  GetGearQueueParams,
  GetKycQueueParams,
  RejectKycPayload,
  ResolveDisputePayload,
} from '@/types/admin';

export const adminService = {
  getKycQueue: (params: GetKycQueueParams = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    const path = `/admin/kyc${queryString ? `?${queryString}` : ''}`;
    return apiClientPaginated<AdminKycUser[]>(path);
  },

  approveKyc: (id: string) =>
    apiClient<AdminKycUser>(`/admin/kyc/${id}/approve`, {
      method: 'POST',
    }),

  rejectKyc: (id: string, payload: RejectKycPayload = {}) =>
    apiClient<AdminKycUser>(`/admin/kyc/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getGearQueue: (params: GetGearQueueParams = {}) => {
    const query = new URLSearchParams();
    if (params.approvalStatus) query.set('approvalStatus', params.approvalStatus);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    const path = `/admin/gears${queryString ? `?${queryString}` : ''}`;
    return apiClientPaginated<AdminGearItem[]>(path);
  },

  approveGear: (id: string) =>
    apiClient<AdminGearItem>(`/admin/gears/${id}/approve`, {
      method: 'POST',
    }),

  rejectGear: (id: string, payload: { reason?: string } = {}) =>
    apiClient<AdminGearItem>(`/admin/gears/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resolveDispute: (id: string, payload: ResolveDisputePayload) =>
    apiClient<unknown>(`/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
