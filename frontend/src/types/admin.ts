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
