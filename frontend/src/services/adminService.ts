import { apiClient, apiClientPaginated } from '@/lib/apiClient';
import type {
  AdminGearItem,
  AdminKycUser,
  GetGearQueueParams,
  GetKycQueueParams,
  RejectKycPayload,
  ResolveDisputePayload,
} from '@/types/admin';
import type { DisputeItem, GetDisputeQueueParams } from '@/types/dispute';

export interface LenderUpgradeQueueItem {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  applicant?: {
    id: string;
    email: string;
    fullName: string | null;
    kycStatus?: string;
    lenderEnabled?: boolean;
    lenderEnabledAt?: string | null;
  };
}

export interface GetLenderUpgradeQueueParams {
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}

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

  getDisputeQueue: (params: GetDisputeQueueParams = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const path = `/admin/disputes${queryString ? `?${queryString}` : ''}`;
    return apiClientPaginated<DisputeItem[]>(path);
  },

  resolveDispute: (id: string, payload: ResolveDisputePayload) =>
    apiClient<unknown>(`/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  startDisputeReview: (id: string) =>
    apiClient<DisputeItem>(`/admin/disputes/${id}/start-review`, {
      method: 'POST',
    }),

  closeDispute: (id: string, closeNote?: string) =>
    apiClient<DisputeItem>(`/admin/disputes/${id}/close`, {
      method: 'POST',
      body: JSON.stringify({ closeNote: closeNote || undefined }),
    }),

  listLenderUpgradeRequests: (
    params: GetLenderUpgradeQueueParams = {},
  ) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    const path = `/admin/lender-upgrade-requests${queryString ? `?${queryString}` : ''}`;
    return apiClientPaginated<LenderUpgradeQueueItem[]>(path);
  },

  approveLenderUpgradeRequest: (id: string) =>
    apiClient<LenderUpgradeQueueItem>(
      `/admin/lender-upgrade-requests/${id}/approve`,
      { method: 'POST' },
    ),

  rejectLenderUpgradeRequest: (id: string, reviewNote: string) =>
    apiClient<LenderUpgradeQueueItem>(
      `/admin/lender-upgrade-requests/${id}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reviewNote }),
      },
    ),
};
