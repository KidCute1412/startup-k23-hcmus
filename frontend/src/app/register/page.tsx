import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/register-form';

export const metadata: Metadata = {
  title: 'Đăng ký | Mutux',
  description: 'Tạo tài khoản Mutux để thuê và cho thuê gear gaming.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
