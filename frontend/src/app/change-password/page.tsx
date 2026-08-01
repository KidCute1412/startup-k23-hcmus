import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/features/auth/change-password-form';

export const metadata: Metadata = {
  title: 'Đổi mật khẩu | Mutux',
  description: 'Cập nhật mật khẩu tài khoản Mutux.',
};

export default function ChangePasswordPage() {
  return <ChangePasswordForm />;
}
