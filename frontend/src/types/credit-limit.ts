export type CreditLimitRequestStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected"
  | "cancelled";

export interface CreditLimitRequest {
  id: string;
  userId: string;
  requestedLimit: number;
  currentLimit: number;
  approvedLimit: number | null;
  consentAcceptedAt: string;
  status: CreditLimitRequestStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyCreditLimitRequests {
  active: CreditLimitRequest | null;
  history: CreditLimitRequest[];
}

export interface CreditLimitEligibility {
  completedOrders: number;
  openDisputes: number;
  adverseDisputes: number;
}

export interface AdminCreditLimitRequest extends CreditLimitRequest {
  applicant: {
    id: string;
    email: string;
    fullName: string | null;
    kycStatus: string;
  };
  eligibility: CreditLimitEligibility;
}
