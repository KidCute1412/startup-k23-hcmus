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
  kyc_front_card_url: string | null;
  kyc_back_card_url: string | null;
  kyc_portrait_url: string | null;
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
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  description?: string | null;
  specifications?: any;
  value?: number | string | null;
  rent_price_per_day?: number | string | null;
  price_per_day?: number | string | null;
  deposit_fee?: number | string | null;
  category_id?: string | null;
  lender_id: string;
  approval_status: ApprovalStatus;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
  lender?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  owner?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  category?: {
    id: string;
    name: string;
  };
  media?: {
    id: string;
    url: string;
    is_primary?: boolean;
  }[];
}

export interface GetGearQueueParams {
  approvalStatus?: ApprovalStatus;
  page?: number;
  limit?: number;
}

export interface ResolveDisputePayload {
  resolutionType: 'refund' | 'deposit_deduct' | 'no_action';
  deductAmount?: number;
  resolutionNote?: string;
}
