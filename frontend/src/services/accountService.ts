import { apiClient } from "@/lib/apiClient";
import type { User } from "@/types/auth";

export const accountService = {
  getMe: () => apiClient<User>("/users/me"),
  submitKyc: (cccd: string, creditConsentAccepted?: boolean) =>
    apiClient<User>("/users/me/kyc", {
      method: "POST",
      body: JSON.stringify({ cccd, creditConsentAccepted }),
    }),
};
