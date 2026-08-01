"use client";

import { useCallback, useState } from "react";
import { creditLimitService } from "@/services/creditLimitService";
import type {
  AdminCreditLimitRequest,
  CreditLimitRequestStatus,
} from "@/types/credit-limit";
import type { PaginationMeta } from "@/lib/apiClient";

export function useAdminCreditLimits() {
  const [items, setItems] = useState<AdminCreditLimitRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (status: CreditLimitRequestStatus | "", page: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await creditLimitService.listAdmin(status, page);
        setItems(result.data);
        setMeta(result.meta);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Không thể tải hàng chờ.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const review = useCallback((id: string) => creditLimitService.review(id), []);
  const approve = useCallback(
    (id: string, limit: number) => creditLimitService.approve(id, limit),
    [],
  );
  const reject = useCallback(
    (id: string, note: string) => creditLimitService.reject(id, note),
    [],
  );

  return { items, meta, loading, error, load, review, approve, reject };
}
