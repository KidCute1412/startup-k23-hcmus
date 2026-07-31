export interface User {
  id: string;
  email: string;
  role: 'renter' | 'lender' | 'admin';
  fullName?: string | null;
  phone?: string | null;
  cccd?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  address?: string | null;
  kycStatus?: 'pending' | 'verified' | 'rejected';
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
