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
