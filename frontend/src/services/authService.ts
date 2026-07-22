import { apiClient } from '@/lib/apiClient';

export interface User {
  id: string;
  email: string;
  role: 'renter' | 'lender' | 'admin';
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

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
