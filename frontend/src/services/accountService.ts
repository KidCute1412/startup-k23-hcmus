import { apiClient } from "@/lib/apiClient";

export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export interface AccountUser {
  id: string;
  email: string;
  phone: string | null;
  fullName: string | null;
  dob: string | null;
  cccd: string | null;
  avatarUrl: string | null;
  bio: string | null;
  rating: number;
  totalReviews: number;
  role: "renter" | "lender" | "admin";
  kycStatus: KycStatus;
  kycRejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAccountRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  dob?: string;
}

export interface KycSubmissionRequest {
  cccd: string;
  frontCardUrl: string;
  backCardUrl: string;
  portraitUrl: string;
}

export interface UserAddress {
  id: string;
  receiverName: string;
  phone: string;
  detailAddress: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressRequest = Omit<
  UserAddress,
  "id" | "createdAt" | "updatedAt"
>;

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const backendOrigin = apiUrl.replace(/\/api\/v1\/?$/, "");

export function resolveMediaUrl(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return `${backendOrigin}${url.startsWith("/") ? url : `/${url}`}`;
}

export const accountService = {
  getProfile: () => apiClient<AccountUser>("/users/me"),

  updateProfile: (request: UpdateAccountRequest) =>
    apiClient<AccountUser>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(request),
    }),

  uploadImage: async (file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiClient<{ url: string }>("/media/upload", {
      method: "POST",
      body,
    });
  },

  submitKyc: (request: KycSubmissionRequest) =>
    apiClient<AccountUser>("/users/me/kyc", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  closeAccount: (password: string) =>
    apiClient<{ closed: true }>("/users/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    }),

  listAddresses: () => apiClient<UserAddress[]>("/users/me/addresses"),

  createAddress: (request: AddressRequest) =>
    apiClient<UserAddress>("/users/me/addresses", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  updateAddress: (id: string, request: Partial<AddressRequest>) =>
    apiClient<UserAddress>(`/users/me/addresses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(request),
    }),

  deleteAddress: (id: string) =>
    apiClient<{ id: string }>(`/users/me/addresses/${id}`, {
      method: "DELETE",
    }),

  setDefaultAddress: (id: string) =>
    apiClient<UserAddress>(`/users/me/addresses/${id}/default`, {
      method: "PATCH",
    }),
};
