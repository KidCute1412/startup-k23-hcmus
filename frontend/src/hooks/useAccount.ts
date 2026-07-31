"use client";

import { useCallback, useState } from "react";
import { accountService } from "@/services/accountService";
import type { User } from "@/types/auth";

export function useAccount() {
  const [account, setAccount] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await accountService.getMe();
      setAccount(result);
      return result;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải hồ sơ.");
      throw cause;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitKyc = useCallback(
    async (cccd: string, consent?: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const result = await accountService.submitKyc(cccd, consent);
        setAccount(result);
        return result;
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Không thể gửi hồ sơ KYC.",
        );
        throw cause;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { account, loading, error, refetch, submitKyc };
}
