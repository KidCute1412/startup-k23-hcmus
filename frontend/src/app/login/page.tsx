import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/login-form';

export const metadata: Metadata = {
  title: 'Đăng nhập | Mutux',
  description: 'Đăng nhập vào tài khoản Mutux để thuê và quản lý gear gaming.',
};

export default function LoginPage() {
  return <LoginForm />;
}
