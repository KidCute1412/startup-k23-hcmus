export interface RentalOrder {
  id: string;
  order_code?: string;
  gearId: string;
  gear_id?: string;
  renterId: string;
  lenderId: string;
  renter_id?: string;
  lender_id?: string;
  status:
    | "pending_confirm"
    | "confirmed"
    | "delivering"
    | "active"
    | "returning"
    | "completed"
    | "cancelled"
    | "disputed";
  startDate: string;
  endDate: string;
  rentPrice: number;
  depositCash: number;
  depositType: "traditional" | "credit_line";
  shippingAddress: string;
  shippingName: string;
  shippingPhone: string;
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
  // snake_case variants returned by backend
  start_date?: string;
  end_date?: string;
  rental_fee?: number;
  deposit_amount?: number;
  deposit_type?: "traditional" | "credit_line";
  shipping_address?: string;
  shipping_name?: string;
  shipping_phone?: string;
  ship_deadline_at?: string | null;
  shipDeadlineAt?: string | null;
  return_deadline_at?: string | null;
  returnDeadlineAt?: string | null;
  cancelled_reason?: string | null;
  duration_days?: number;
  platform_fee?: number;
  lender_income?: number;
  // lifecycle timestamps
  lender_shipped_at?: string | null;
  renter_received_at?: string | null;
  renter_returned_at?: string | null;
  lender_received_back_at?: string | null;
  // relations
  gear?: { id?: string; name: string; media?: { url: string }[] };
  renter?: {
    id?: string;
    fullName?: string;
    avatarUrl?: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    rating?: number;
  };
  lender?: {
    id?: string;
    fullName?: string;
    avatarUrl?: string;
    full_name?: string;
    avatar_url?: string;
    phone?: string;
    rating?: number;
  };
  disputes?: Array<{
    id: string;
    status: "open" | "under_review" | "resolved" | "closed" | string;
    reason: string;
    description?: string | null;
    reported_by?: string;
    reportedBy?: string;
    created_at?: string;
    createdAt?: string;
    resolution_type?: string | null;
    resolutionType?: string | null;
    deduct_amount?: number | string | null;
    deductAmount?: number | string | null;
    resolution_note?: string | null;
    resolutionNote?: string | null;
    resolved_at?: string | null;
    resolvedAt?: string | null;
    evidences?: Array<{
      uploaded_by?: string;
      uploadedBy?: string;
      url: string;
      uploaded_at?: string;
      uploadedAt?: string;
    }>;
  }>;
}

export interface CreateRentalOrderRequest {
  gearId: string;
  startDate: string;
  endDate: string;
  depositType: "traditional" | "credit_line";
  addressId: string;
}

export interface RentalFinancialSummary {
  cash: {
    balance: number;
    lockedBalance: number;
    availableBalance: number;
    pendingCashCommitment: number;
  };
  credit: {
    availableCredit: number;
    lockedBalance: number;
    outstandingDebt: number;
    pendingDepositCommitment: number;
    status: string;
    expiredAt: string | null;
  };
  pendingOrderCount: number;
  pendingCreditOrderCount: number;
  walletStatus: string;
}

export interface GetRentalOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  /** Pass 'lender' to fetch orders where the current user is the gear owner */
  role?: "renter" | "lender";
}

export type ProofStage =
  | "pre_shipment"
  | "post_received"
  | "pre_return"
  | "post_returned";

export interface RentalProof {
  id: string;
  rentalOrderId?: string;
  rental_order_id?: string;
  uploadedBy?: string;
  uploaded_by?: string;
  stage: ProofStage | string;
  proof_type?: "image" | "video";
  proofType?: "image" | "video";
  file_url?: string;
  fileUrl?: string;
  note?: string | null;
  uploadedAt?: string;
  createdAt?: string;
}

export interface UploadProofRequest {
  stage: string;
  fileUrl: string;
  note?: string;
}

export interface UploadProofBatchRequest {
  stage: string;
  fileUrls: string[];
  note?: string;
}
