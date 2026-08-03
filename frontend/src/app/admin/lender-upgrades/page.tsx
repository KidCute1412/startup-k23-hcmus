import type { Metadata } from 'next';
import { LenderUpgradeQueueFeature } from '@/features/admin/lender-upgrade-queue';

export const metadata: Metadata = {
  title: 'Duyệt Yêu Cầu Nâng Cấp Lender | Mutux Admin Operations',
  description: 'Giao diện quản trị phê duyệt hồ sơ nâng cấp quyền cho thuê đồ (Lender) trên nền tảng Mutux.',
};

export default function AdminLenderUpgradesPage() {
  return <LenderUpgradeQueueFeature />;
}
