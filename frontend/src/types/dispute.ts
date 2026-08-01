export type DisputeReason =
  | 'device_not_as_described'
  | 'device_faulty'
  | 'missing_accessory'
  | 'device_damaged'
  | 'component_replaced'
  | 'other';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed';
export type ReporterRole = 'renter' | 'lender';

export interface DisputeEvidence {
  id: string;
  uploadedBy: string;
  mediaType: string;
  url: string;
  uploadedAt: string;
}

export interface DisputeRentalOrder {
  id: string;
  orderCode: string;
  status: string;
  depositAmount: number;
  totalRentFee: number;
  renter?: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
  };
  lender?: {
    id: string;
    fullName: string | null;
    email: string;
    avatarUrl: string | null;
    phone: string | null;
  };
  gear?: {
    id: string;
    name: string;
    mediaUrls: string[];
  };
}

export interface DisputeItem {
  id: string;
  rentalOrderId: string;
  reportedBy: string;
  reporterRole: ReporterRole;
  reason: DisputeReason | string;
  description: string | null;
  status: DisputeStatus;
  resolvedBy: string | null;
  resolutionNote: string | null;
  resolutionType: string | null;
  deductAmount: number | null;
  createdAt: string;
  resolvedAt: string | null;
  evidences?: DisputeEvidence[];
  rentalOrder?: DisputeRentalOrder;
}

export interface CreateDisputePayload {
  rentalOrderId: string;
  reason: DisputeReason;
  description?: string;
  evidences: Array<{
    mediaType: 'image';
    url: string;
  }>;
}

export interface GetDisputeQueueParams {
  status?: DisputeStatus;
  page?: number;
  limit?: number;
}
