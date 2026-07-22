'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  clearSession,
} from '@/lib/apiClient';
import { authService, type LoginRequest, type RegisterRequest, type User } from '@/services/authService';

const USER_KEY = 'user';

function readStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem(USER_KEY);
  try {
    return value ? (JSON.parse(value) as User) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSession = useCallback(() => setUser(readStoredUser()), []);
  useEffect(() => {
    syncSession();
    window.addEventListener('auth:changed', syncSession);
    return () => window.removeEventListener('auth:changed', syncSession);
  }, [syncSession]);

  useEffect(() => {
    let active = true;
    void authService.me()
      .then((profile) => {
        if (!active) return;
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
        setUser(profile);
        window.dispatchEvent(new Event('auth:changed'));
      })
      .catch(() => {
        if (active) clearSession();
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    setIsLoading(true); setError(null);
    try {
      const result = await authService.login(request);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      setUser(result.user);
      window.dispatchEvent(new Event('auth:changed'));
      return result;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Đăng nhập thất bại.';
      setError(message); throw cause;
    } finally { setIsLoading(false); }
  }, []);

  const register = useCallback(async (request: RegisterRequest) => {
    setIsLoading(true); setError(null);
    try { return await authService.register(request); }
    catch (cause) { const message = cause instanceof Error ? cause.message : 'Đăng ký thất bại.'; setError(message); throw cause; }
    finally { setIsLoading(false); }
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    setIsLoading(true); setError(null);
    try { await authService.changePassword(oldPassword, newPassword); clearSession(); setUser(null); }
    catch (cause) { const message = cause instanceof Error ? cause.message : 'Đổi mật khẩu thất bại.'; setError(message); throw cause; }
    finally { setIsLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } finally { clearSession(); setUser(null); }
  }, []);

  return { user, isAuthenticated: !!user, isLoading, error, login, register, changePassword, logout };
}
