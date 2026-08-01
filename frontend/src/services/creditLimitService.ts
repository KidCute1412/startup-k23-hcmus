import { apiClient, apiClientPaginated } from "@/lib/apiClient";
import type {
  AdminCreditLimitRequest,
  CreditLimitRequest,
  CreditLimitRequestStatus,
  MyCreditLimitRequests,
} from "@/types/credit-limit";

export const creditLimitService = {
  create: (requestedLimit: number) =>
    apiClient<CreditLimitRequest>("/credit-limit-requests", {
      method: "POST",
      body: JSON.stringify({ requestedLimit, consentAccepted: true }),
    }),
  getMine: () =>
    apiClient<MyCreditLimitRequests>("/credit-limit-requests/me"),
  cancel: (id: string) =>
    apiClient<CreditLimitRequest>(
      `/credit-limit-requests/${encodeURIComponent(id)}/cancel`,
      { method: "POST" },
    ),
  listAdmin: (
    status: CreditLimitRequestStatus | "",
    page: number,
    limit = 20,
  ) => {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) query.set("status", status);
    return apiClientPaginated<AdminCreditLimitRequest[]>(
      `/admin/credit-limit-requests?${query}`,
    );
  },
  review: (id: string) =>
    apiClient<CreditLimitRequest>(
      `/admin/credit-limit-requests/${encodeURIComponent(id)}/review`,
      { method: "POST" },
    ),
  approve: (id: string, approvedLimit: number, reviewNote?: string) =>
    apiClient<CreditLimitRequest>(
      `/admin/credit-limit-requests/${encodeURIComponent(id)}/approve`,
      {
        method: "POST",
        body: JSON.stringify({ approvedLimit, reviewNote }),
      },
    ),
  reject: (id: string, reviewNote: string) =>
    apiClient<CreditLimitRequest>(
      `/admin/credit-limit-requests/${encodeURIComponent(id)}/reject`,
      { method: "POST", body: JSON.stringify({ reviewNote }) },
    ),
};
