'use client';

import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearSession,
} from '@/lib/apiClient';
import { authService } from '@/services/authService';
import type { LoginRequest, RegisterRequest, User } from '@/types/auth';

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

function storeUser(profile: User): boolean {
  const serialized = JSON.stringify(profile);
  if (localStorage.getItem(USER_KEY) === serialized) return false;
  localStorage.setItem(USER_KEY, serialized);
  return true;
}

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  login: (request: LoginRequest) => Promise<{ user: User }>;
  register: (request: RegisterRequest) => Promise<unknown>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
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
        const changed = storeUser(profile);
        setUser(profile);
        if (changed) window.dispatchEvent(new Event('auth:changed'));
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setIsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (request: LoginRequest) => {
    setIsLoading(true); setError(null);
    try {
      const result = await authService.login(request);
      storeUser(result.user);
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

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isAuthenticated: !!user,
        isReady,
        isLoading,
        error,
        login,
        register,
        changePassword,
        logout,
      },
    },
    children,
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
