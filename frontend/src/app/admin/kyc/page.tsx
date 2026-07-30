import type { Metadata } from 'next';
import { KycQueueFeature } from '@/features/admin/kyc-queue';

export const metadata: Metadata = {
  title: 'Quản lý Hàng chờ KYC | Mutux Admin Operations',
  description: 'Giao diện quản trị phê duyệt hồ sơ định danh (KYC) trên nền tảng Mutux.',
};

export default function AdminKycPage() {
  return <KycQueueFeature />;
}
