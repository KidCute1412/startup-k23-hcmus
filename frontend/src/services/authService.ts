import { apiClient } from '@/lib/apiClient';
import type { LoginRequest, RegisterRequest, User } from '@/types/auth';

export const authService = {
  register: (request: RegisterRequest) =>
    apiClient<{ id: string; email: string; fullName: string | null }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  login: (request: LoginRequest) =>
    apiClient<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  me: () => apiClient<User>('/users/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient<null>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  logout: () => apiClient<null>('/auth/logout', { method: 'POST' }),
};
