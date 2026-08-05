const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

interface ApiFailure {
  success: false;
  error?: { code?: string; message?: string };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshInFlight: Promise<boolean> | null = null;

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth:changed"));
}

async function readBody<T>(response: Response): Promise<ApiSuccess<T> | ApiFailure> {
  return (await response.json()) as ApiSuccess<T> | ApiFailure;
}

export async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      const body = await readBody<null>(response);
      return response.ok && body.success;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function clearRefreshCookie(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
  } catch {
    // The browser clears its in-memory session even when the server is unavailable.
  }
}

async function request<T>(
  path: string,
  init: RequestInit,
  retryAfterRefresh: boolean,
): Promise<ApiSuccess<T>> {
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  const shouldRefresh = retryAfterRefresh && path !== "/auth/login";
  if (response.status === 401 && shouldRefresh && (await refreshSession())) {
    return request<T>(path, init, false);
  }
  const body = await readBody<T>(response);
  if (!response.ok || !body.success) {
    if (
      response.status === 401 &&
      path !== "/auth/login" &&
      path !== "/users/me"
    ) {
      await clearRefreshCookie();
      clearSession();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    throw new ApiError(
      body.success ? "Yêu cầu không thành công." : (body.error?.message ?? "Yêu cầu không thành công."),
      response.status,
      body.success ? undefined : body.error?.code,
    );
  }
  return body;
}

export async function apiClient<T>(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true,
): Promise<T> {
  return (await request<T>(path, init, retryAfterRefresh)).data;
}

export async function apiClientPaginated<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; meta: PaginationMeta }> {
  const body = await request<T>(path, init, true);
  if (!body.meta) {
    throw new ApiError("Phản hồi phân trang không hợp lệ.", 500, "INVALID_RESPONSE");
  }
  return { data: body.data, meta: body.meta };
}
