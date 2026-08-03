"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  PackageCheck,
  Scale,
  BadgeDollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useAdminOverview } from "@/hooks/useAdminOverview";

export function AdminOverviewFeature() {
  const { statsData, loading, error, isNonAdmin, refetch } = useAdminOverview();

  const totalPendingActionItems =
    statsData.kycPending +
    statsData.gearPending +
    statsData.disputeOpen +
    statsData.creditLimitPending;

  const STATS = [
    {
      title: "KYC Chờ Phê Duyệt",
      value: loading ? "..." : `${statsData.kycPending} Hồ sơ`,
      subtext: "Cần xác thực căn cước & chân dung",
      icon: ShieldCheck,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      href: "/admin/kyc",
    },
    {
      title: "Thiết bị Chờ Duyệt",
      value: loading ? "..." : `${statsData.gearPending} Sản phẩm`,
      subtext: "Cần kiểm định thông số & ảnh",
      icon: PackageCheck,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      href: "/admin/gears",
    },
    {
      title: "Tranh chấp Cần Giải Quyết",
      value: loading ? "..." : `${statsData.disputeOpen} Vụ việc`,
      subtext: "Yêu cầu hoàn cọc / bồi thường",
      icon: Scale,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      href: "/admin/disputes",
    },
    {
      title: "Hạn mức Tín dụng Chờ Duyệt",
      value: loading ? "..." : `${statsData.creditLimitPending} Yêu cầu`,
      subtext: "Nâng tier hạn mức cho Renter",
      icon: BadgeDollarSign,
      color: "text-vanguard-primary",
      bgColor: "bg-vanguard-primary/10",
      href: "/admin/credit-limits",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Title & Refresh */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text sm:text-3xl">
            Tổng quan Trung tâm Quản trị Admin
          </h1>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
            Theo dõi hàng chờ phê duyệt KYC, kiểm định thiết bị cho thuê và xử lý tranh chấp giao dịch Mutux.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-4 py-2 text-xs font-semibold text-vanguard-light-text transition hover:bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {/* Non-Admin 403 Warning Card */}
      {isNonAdmin && (
        <div className="mb-8 rounded-v border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <ShieldAlert className="size-8 shrink-0 text-red-500" />
            <div>
              <h3 className="font-display text-lg font-bold text-red-600 dark:text-red-400">
                403 Forbidden - Admin Access Required
              </h3>
              <p className="mt-1 text-sm text-vanguard-light-text dark:text-vanguard-dark-text">
                {error}
              </p>
              <p className="mt-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Các API quản trị hệ thống yêu cầu token đăng nhập bằng tài khoản Quản trị viên (Role: <code className="font-mono">admin</code>).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      {!isNonAdmin && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.title}
                  href={stat.href}
                  className="group relative overflow-hidden rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-md transition-all hover:-translate-y-0.5 hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      {stat.title}
                    </span>
                    <div className={`flex size-10 items-center justify-center rounded-v-sm ${stat.bgColor} ${stat.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                  <p className="mt-4 font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    {stat.subtext}
                  </p>

                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-vanguard-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <span>Đi tới quản lý</span>
                    <ArrowRight size={14} />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Grid Section: Action Banner & Modules */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Quick Action Cards */}
            <div className="space-y-6 lg:col-span-2">
              {/* Pending Alerts Banner */}
              <div className="rounded-v border border-vanguard-primary/30 bg-vanguard-primary/5 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <AlertCircle className="size-6 shrink-0 text-vanguard-primary" />
                  <div>
                    <h3 className="font-display text-base font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                      Vanguard Admin Action Items
                    </h3>
                    <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Hệ thống ghi nhận <strong className="text-vanguard-primary">{totalPendingActionItems} tác vụ</strong> đang chờ quản trị viên xử lý từ backend.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/admin/kyc"
                        className="inline-flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-4 py-2 text-xs font-bold text-vanguard-dark-bg transition hover:opacity-90"
                      >
                        <ShieldCheck size={14} />
                        Duyệt KYC ({statsData.kycPending})
                      </Link>
                      <Link
                        href="/admin/gears"
                        className="inline-flex items-center gap-2 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-4 py-2 text-xs font-bold text-vanguard-light-text transition hover:bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                      >
                        <PackageCheck size={14} />
                        Duyệt Thiết bị ({statsData.gearPending})
                      </Link>
                      <Link
                        href="/admin/disputes"
                        className="inline-flex items-center gap-2 rounded-v-sm border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-500 transition hover:bg-red-500/20"
                      >
                        <Scale size={14} />
                        Phân xử Tranh chấp ({statsData.disputeOpen})
                      </Link>
                      <Link
                        href="/admin/credit-limits"
                        className="inline-flex items-center gap-2 rounded-v-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-500 transition hover:bg-emerald-500/20"
                      >
                        <BadgeDollarSign size={14} />
                        Hạn mức tín dụng ({statsData.creditLimitPending})
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Module Direct Links */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link
                  href="/admin/kyc"
                  className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-5 shadow-sm transition hover:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
                >
                  <ShieldCheck className="size-6 text-amber-500" />
                  <h4 className="mt-3 font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    Xác thực KYC
                  </h4>
                  <p className="mt-1 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Xác minh thông tin căn cước công dân và chân dung người dùng.
                  </p>
                </Link>

                <Link
                  href="/admin/gears"
                  className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-5 shadow-sm transition hover:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
                >
                  <PackageCheck className="size-6 text-blue-500" />
                  <h4 className="mt-3 font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    Kiểm định Thiết bị
                  </h4>
                  <p className="mt-1 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Duyệt hình ảnh, mô tả, giá thuê và giá trị cọc của sản phẩm mới.
                  </p>
                </Link>

                <Link
                  href="/admin/disputes"
                  className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-5 shadow-sm transition hover:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
                >
                  <Scale className="size-6 text-red-500" />
                  <h4 className="mt-3 font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    Giải quyết Tranh chấp
                  </h4>
                  <p className="mt-1 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Đánh giá ảnh bàn giao, khấu trừ cọc hoặc bồi thường thiệt hại.
                  </p>
                </Link>
              </div>
            </div>

            {/* Right Column: Activity / Info Card */}
            <div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-md dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
              <div className="mb-4 flex items-center justify-between border-b border-vanguard-light-border pb-3 dark:border-vanguard-dark-border">
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-vanguard-light-text dark:text-vanguard-dark-text">
                  Quy trình Admin Operations
                </h3>
                <Clock size={16} className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted" />
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-v-sm border border-vanguard-light-border/60 bg-vanguard-light-bg/50 p-3 dark:border-vanguard-dark-border/60 dark:bg-vanguard-dark-bg/50">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                  <div className="text-xs">
                    <span className="font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                      Tự động hóa ví tín dụng
                    </span>
                    <p className="mt-0.5 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Khi duyệt KYC cho Renter, ví Mutux tự động cấp hạn mức ban đầu 3.000.000đ.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-v-sm border border-vanguard-light-border/60 bg-vanguard-light-bg/50 p-3 dark:border-vanguard-dark-border/60 dark:bg-vanguard-dark-bg/50">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-blue-500" />
                  <div className="text-xs">
                    <span className="font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                      Kiểm định sản phẩm
                    </span>
                    <p className="mt-0.5 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Lender chỉ có thể cho thuê sản phẩm sau khi Admin duyệt trạng thái `approved`.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-v-sm border border-vanguard-light-border/60 bg-vanguard-light-bg/50 p-3 dark:border-vanguard-dark-border/60 dark:bg-vanguard-dark-bg/50">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-red-500" />
                  <div className="text-xs">
                    <span className="font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                      Escrow & Tranh chấp
                    </span>
                    <p className="mt-0.5 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Mọi hành vi khấu trừ tiền cọc Escrow đều ghi nhận lý do và ID của Admin phân xử.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
