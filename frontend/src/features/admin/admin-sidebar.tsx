"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  PackageCheck,
  Scale,
  ArrowLeft,
  BadgeDollarSign,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Tổng quan Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/kyc",
    label: "Duyệt Hàng chờ KYC",
    icon: ShieldCheck,
  },
  {
    href: "/admin/gears",
    label: "Duyệt Thiết bị Cho thuê",
    icon: PackageCheck,
  },
  {
    href: "/admin/disputes",
    label: "Xử lý Tranh chấp",
    icon: Scale,
  },
  {
    href: "/admin/credit-limits",
    label: "Duyệt Hạn mức Tín dụng",
    icon: BadgeDollarSign,
  },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-vanguard-light-border bg-vanguard-light-surf/80 backdrop-blur-md transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf/90",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between border-b border-vanguard-light-border px-6 dark:border-vanguard-dark-border">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-v-sm bg-gold-metal font-display font-bold text-vanguard-dark-bg shadow-md">
            M
          </span>
          <div>
            <span className="font-display text-base font-bold tracking-wider text-vanguard-light-text dark:text-vanguard-dark-text">
              Mutux
            </span>
            <span className="ml-1.5 rounded bg-vanguard-primary/20 px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-widest text-vanguard-primary">
              Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          Quản trị hệ thống
        </div>
        <nav className="space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-v-sm px-3.5 py-3 font-display text-xs font-semibold tracking-wide transition-all",
                  isActive
                    ? "bg-vanguard-primary/10 text-vanguard-primary border-r-2 border-vanguard-primary"
                    : "text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={cn(
                      "transition-colors",
                      isActive
                        ? "text-vanguard-primary"
                        : "group-hover:text-vanguard-primary"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                      isActive
                        ? "bg-vanguard-primary text-vanguard-dark-bg"
                        : "bg-vanguard-light-border text-vanguard-light-text dark:bg-vanguard-dark-border dark:text-vanguard-dark-text"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigation Back to Site */}
      <div className="border-t border-vanguard-light-border p-4 dark:border-vanguard-dark-border">
        <Link
          href="/"
          className="flex w-full items-center justify-center gap-2 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg px-4 py-2.5 font-display text-xs font-semibold text-vanguard-light-text transition hover:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text dark:hover:border-vanguard-primary"
        >
          <ArrowLeft size={14} />
          <span>Về trang Marketplace</span>
        </Link>
      </div>
    </aside>
  );
}
