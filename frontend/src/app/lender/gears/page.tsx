import type { Metadata } from "next";
import { PackagePlus, Star, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency } from "@/lib/format";
import { getLenderStats, getMyGears } from "@/features/lender/mock-data";
import { MyGearsList } from "@/features/lender/my-gears-list";

export const metadata: Metadata = {
  title: "Quản lý gear cho thuê | Mutux Gear",
  description:
    "Quản lý danh sách gear cho thuê của bạn trên Mutux – theo dõi đơn, doanh thu và thêm sản phẩm mới.",
};

export default function LenderGearsPage() {
  const gears = getMyGears();
  const stats = getLenderStats();

  return (
    <>
      {/* Page banner */}
      <div className="border-b border-vanguard-light-border bg-vanguard-light-surfDim/60 px-4 py-10 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim/50 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge tone="muted">Lender Dashboard</Badge>
              <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
                Gear của tôi
              </h1>
              <p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Quản lý toàn bộ danh sách cho thuê, theo dõi hiệu suất và thêm
                sản phẩm mới.
              </p>
            </div>

            <Link
              href="/lender/gears/new"
              id="header-add-gear-btn"
              className="gold-shimmer inline-flex min-h-12 items-center justify-center gap-2 rounded-v-sm bg-gold-metal px-6 py-3 font-display text-xs font-bold uppercase tracking-widest text-vanguard-dark-bg shadow-lg transition-all duration-500 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-vanguard-primary/60 sm:self-start"
            >
              <PackagePlus size={15} />
              Đăng gear mới
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-4">
              <Zap size={18} className="text-vanguard-primary" />
              <p className="mt-3 text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Đang hoạt động
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {stats.active}
              </p>
            </Card>
            <Card className="p-4">
              <TrendingUp size={18} className="text-vanguard-primary" />
              <p className="mt-3 text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Tổng đơn
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {stats.totalRentals}
              </p>
            </Card>
            <Card className="p-4">
              <Star
                size={18}
                className="text-vanguard-primary"
                fill="currentColor"
              />
              <p className="mt-3 text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Đánh giá trung bình
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {stats.avgRating.toFixed(1)}
              </p>
            </Card>
            <Card className="p-4 sm:col-span-1">
              <span className="text-lg">💰</span>
              <p className="mt-3 text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Tổng doanh thu
              </p>
              <p className="mt-1 font-display text-xl font-bold text-vanguard-primary">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Gear list */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <MyGearsList gears={gears} />
      </section>
    </>
  );
}
