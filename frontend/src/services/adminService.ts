import { apiClient, apiClientPaginated, PaginationMeta } from '@/lib/apiClient';

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface AdminKycUser {
  id: string;
  email: string;
  full_name: string | null;
  cccd: string | null;
  role: string;
  kyc_status: KycStatus;
  kyc_rejection_reason: string | null;
  kyc_reviewed_by: string | null;
  kyc_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetKycQueueParams {
  status?: KycStatus;
  page?: number;
  limit?: number;
}

export interface RejectKycPayload {
  reason?: string;
}

export interface AdminGearItem {
  id: string;
  name: string;
  category_id: string;
  owner_id: string;
  price_per_day: number;
  deposit_fee: number;
  approval_status: ApprovalStatus;
  rejection_reason: string | null;
  created_at: string;
  owner?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface GetGearQueueParams {
  approvalStatus?: ApprovalStatus;
  page?: number;
  limit?: number;
}

export interface ResolveDisputePayload {
  resolutionType: 'refund' | 'deposit_deduct' | 'compensation' | 'account_ban' | 'no_action';
  deductAmount?: number;
  resolutionNote?: string;
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

  resolveDispute: (id: string, payload: ResolveDisputePayload) =>
    apiClient<unknown>(`/admin/disputes/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
