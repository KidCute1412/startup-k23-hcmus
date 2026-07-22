const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error?: { message?: string };
}

export class ApiError extends Error {}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:changed'));
}

async function readBody<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
  return (await response.json()) as ApiSuccess<T> | ApiFailure;
}

export async function refreshSession(): Promise<boolean> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  const body = await readBody<null>(response);
  if (!response.ok || !body.success) return false;
  return true;
}

export async function clearRefreshCookie(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  } catch {
    // The browser clears the in-memory session even when the server is unavailable.
  }
}

export async function apiClient<T>(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' });
  const shouldRefresh = retryAfterRefresh && path !== '/auth/login';
  if (response.status === 401 && shouldRefresh && (await refreshSession())) {
    return apiClient<T>(path, init, false);
  }

  const body = await readBody<T>(response);
  if (!response.ok || !body.success) {
    if (response.status === 401 && path !== '/auth/login') {
      await clearRefreshCookie();
      clearSession();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    throw new ApiError(body.success ? 'Yêu cầu không thành công.' : (body.error?.message ?? 'Yêu cầu không thành công.'));
  }
  return body.data;
}
