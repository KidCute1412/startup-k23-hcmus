import type { Metadata } from 'next';
import { PlatformFinancePanel } from '@/features/admin/platform-finance-panel';

export const metadata: Metadata = {
  title: 'Quản lý Tài chính | Mutux Admin Operations',
  description: 'Quản lý dòng tiền hệ thống, đối soát tiền thuê tạm giữ, phí dịch vụ nền tảng, tiền cọc đang khóa và công nợ Lender.',
};

export default function AdminFinancePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text sm:text-3xl">
          Quản lý Đối soát Tài chính
        </h1>
        <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
          Thiết lập cấu hình dòng tiền hệ thống và theo dõi nhật ký dòng tiền, tiền cọc ký quỹ Escrow, doanh thu nền tảng.
        </p>
      </div>
      <PlatformFinancePanel />
    </div>
  );
}
