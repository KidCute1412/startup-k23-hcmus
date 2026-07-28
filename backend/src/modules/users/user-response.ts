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
  kyc_status: KycStatusType;
  kyc_rejection_reason: string | null;
  kyc_front_card_url: string | null;
  kyc_back_card_url: string | null;
  kyc_portrait_url: string | null;
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
    kycStatus:
      user.kyc_status === 'pending' && !hasKycSubmission
        ? ('unverified' as const)
        : user.kyc_status,
    kycRejectionReason: user.kyc_rejection_reason,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
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
