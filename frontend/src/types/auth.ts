export interface User {
  id: string;
  email: string;
  role: 'renter' | 'admin';
  lenderEnabled: boolean;
  lenderEnabledAt?: string | null;
  fullName?: string | null;
  phone?: string | null;
  cccd?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  address?: string | null;
  kycStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  kycRejectionReason?: string | null;
  creditConsentAcceptedAt?: string | null;
  createdAt?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
