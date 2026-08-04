"use client";

import { useEffect, useState } from "react";
import { PackagePlus, Star, TrendingUp, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMyGears } from "@/services/gearService";
import { resolveMediaUrl } from "@/lib/media";
import { MyGearsList } from "@/features/lender/my-gears-list";
import type { Gear } from "@/types/catalog";
import type { LenderGear, ListingStatus } from "@/features/lender/types";

export default function LenderGearsPage() {
  const [gears, setGears] = useState<LenderGear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getMyGears({ limit: 100 });
        const mapped: LenderGear[] = res.data.map((gear: Gear) => {
          let listingStatus: ListingStatus = "draft";
          if (gear.approvalStatus === "pending") {
            listingStatus = "pending_approval";
          } else if (gear.approvalStatus === "rejected") {
            listingStatus = "rejected";
          } else if (gear.status === "delisted" || gear.status === "maintenance") {
            listingStatus = "draft";
          } else if (gear.status === "available" || gear.status === "rented") {
            listingStatus = "active";
          }

          return {
            id: gear.id,
            name: gear.name,
            slug: gear.slug || gear.id,
            categoryId: gear.categoryId,
            categoryName: gear.categoryName || "Thiết bị",
            shortDescription: gear.shortDescription || gear.description || "",
            imageUrl: resolveMediaUrl(gear.media[0]?.imageUrl),
            badge: gear.badge,
            condition: gear.condition || "Like new",
            availability: gear.availability || "available",
            listingStatus,
            approvalStatus: (gear.approvalStatus as "pending" | "approved" | "rejected") || "pending",
            dailyPrice: gear.pricing.dailyPrice,
            depositCash: gear.pricing.depositCash || 0,
            creditLineRequired: gear.pricing.creditLineRequired || 0,
            totalRentals: 0,
            totalRevenue: 0,
            rating: gear.rating || 0,
            reviewCount: gear.reviewCount || 0,
            createdAt: gear.createdAt || new Date().toISOString(),
            updatedAt: gear.updatedAt || new Date().toISOString(),
          };
        });
        setGears(mapped);
      } catch (err: any) {
        setError(err?.message || "Không thể tải danh sách gear. Vui lòng đăng nhập.");
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, []);

  // Compute stats on the fly from the loaded gears
  const stats = {
    active: gears.filter((g) => g.listingStatus === "active").length,
    totalRentals: gears.reduce((sum, g) => sum + g.totalRentals, 0),
    avgRating:
      gears.filter((g) => g.reviewCount > 0).reduce((sum, g) => sum + g.rating, 0) /
      (gears.filter((g) => g.reviewCount > 0).length || 1),
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vanguard-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-v-sm border border-red-500/30 bg-red-500/10 p-6 text-red-500">
          <p className="font-semibold">{error}</p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-v-sm bg-vanguard-primary px-4 py-2 text-xs font-bold uppercase text-vanguard-dark-bg transition hover:bg-vanguard-primary/80"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="muted">Quản lý thiết bị cho thuê</Badge>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Gear của tôi
            </h1>
            <p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Quản lý toàn bộ danh sách cho thuê, theo dõi hiệu suất và thêm sản phẩm mới.
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
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <Zap size={18} className="text-vanguard-primary" />
            <p className="mt-3 text-[20px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Đang hoạt động
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.active}</p>
          </Card>
          <Card className="p-4">
            <TrendingUp size={18} className="text-vanguard-primary" />
            <p className="mt-3 text-[20px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Tổng đơn
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.totalRentals}</p>
          </Card>
          <Card className="p-4">
            <Star size={18} className="text-vanguard-primary" fill="currentColor" />
            <p className="mt-3 text-[20px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Đánh giá TB
            </p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
          </Card>
          <Card className="p-4">
            <span className="text-lg">💰</span>
            <p className="mt-3 text-[20px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Tổng doanh thu
            </p>
            <p className="mt-1 font-display text-xl font-bold text-vanguard-primary">
              <Link href="/lender/revenue" className="text-sm text-vanguard-primary hover:underline">Xem doanh thu →</Link>
            </p>
          </Card>
        </div>
      </div>

      {/* Gear list */}
      <MyGearsList gears={gears} />
    </>
  );
}
