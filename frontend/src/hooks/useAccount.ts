"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, clearSession } from "@/lib/apiClient";
import {
  accountService,
  type AccountUser,
  type KycSubmissionRequest,
  type UpdateAccountRequest,
} from "@/services/accountService";

export { resolveMediaUrl } from "@/services/accountService";
export type { AccountUser } from "@/services/accountService";

export function useAccount() {
  const router = useRouter();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setUser(await accountService.getProfile());
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        clearSession();
        router.replace("/login?returnTo=/account");
      }
      setError(cause instanceof Error ? cause.message : "Không thể tải hồ sơ.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const runMutation = useCallback(
    async (mutation: () => Promise<AccountUser>) => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await mutation();
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        window.dispatchEvent(new Event("auth:changed"));
        return updated;
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Yêu cầu không thành công.";
        setError(message);
        throw cause;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const updateProfile = useCallback(
    (request: UpdateAccountRequest) =>
      runMutation(() => accountService.updateProfile(request)),
    [runMutation],
  );

  const submitKyc = useCallback(
    (request: KycSubmissionRequest) =>
      runMutation(() => accountService.submitKyc(request)),
    [runMutation],
  );

  const uploadImage = useCallback(
    (file: File) => accountService.uploadImage(file),
    [],
  );

  const closeAccount = useCallback(
    async (password: string) => {
      setIsSaving(true);
      setError(null);
      try {
        await accountService.closeAccount(password);
        clearSession();
        router.replace("/login?accountClosed=1");
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Không thể đóng tài khoản.";
        setError(message);
        throw cause;
      } finally {
        setIsSaving(false);
      }
    },
    [router],
  );

  return {
    user,
    isLoading,
    isSaving,
    error,
    reload: load,
    updateProfile,
    submitKyc,
    uploadImage,
    closeAccount,
  };
}
