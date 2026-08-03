import type { KycStatusType, UserAddress, UserRole } from '@prisma/client';

export interface SafeUserRecord {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  dob: Date | null;
  cccd: string | null;
  avatar_url: string | null;
  bio: string | null;
  rating: number;
  total_reviews: number;
  role: UserRole;
  lender_enabled: boolean;
  lender_enabled_at: Date | null;
  kyc_status: KycStatusType;
  kyc_rejection_reason: string | null;
  kyc_front_card_url: string | null;
  kyc_back_card_url: string | null;
  kyc_portrait_url: string | null;
  credit_consent_accepted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function toCurrentUserResponse(user: SafeUserRecord) {
  const hasKycSubmission = Boolean(
    user.cccd &&
    user.kyc_front_card_url &&
    user.kyc_back_card_url &&
    user.kyc_portrait_url,
  );

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    fullName: user.full_name,
    dob: user.dob?.toISOString().slice(0, 10) ?? null,
    cccd: user.cccd,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    rating: user.rating,
    totalReviews: user.total_reviews,
    role: user.role,
    lenderEnabled: user.lender_enabled,
    lenderEnabledAt: user.lender_enabled_at,
    kycStatus:
      user.kyc_status === 'pending' && !hasKycSubmission
        ? ('unverified' as const)
        : user.kyc_status,
    kycRejectionReason: user.kyc_rejection_reason,
    creditConsentAcceptedAt: user.credit_consent_accepted_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export function toLenderUpgradeRequestResponse(request: {
  id: string | null;
  user_id: string;
  status: string;
  reason: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date | null;
  updated_at: Date | null;
}) {
  return {
    id: request.id,
    userId: request.user_id,
    status: request.status,
    reason: request.reason,
    reviewNote: request.review_note,
    reviewedBy: request.reviewed_by,
    reviewedAt: request.reviewed_at,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  };
}

export function toAddressResponse(address: UserAddress) {
  return {
    id: address.id,
    receiverName: address.receiver_name,
    phone: address.phone,
    detailAddress: address.detail_address,
    ward: address.ward,
    district: address.district,
    province: address.province,
    isDefault: address.is_default,
    createdAt: address.created_at,
    updatedAt: address.updated_at,
  };
}
