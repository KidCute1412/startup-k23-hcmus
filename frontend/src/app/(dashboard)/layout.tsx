"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tabs = [
    { id: "dashboard", label: "Tổng quan & Hồ sơ", href: "/account", icon: User },
    { id: "orders", label: "Đơn thuê của tôi", href: "/orders", icon: ShoppingBag },
    { id: "wallet", label: "Ví Mutux & Hạn mức", href: "/wallet", icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-vanguard-primary">
              Danh mục quản lý
            </h3>
            <nav className="flex flex-col space-y-1" aria-label="Dashboard Sidebar">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={cn(
                      "flex items-center gap-3 rounded-v-sm px-3 py-2.5 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-vanguard-primary/10 text-vanguard-primary dark:bg-vanguard-primary/20"
                        : "text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-primary dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfDim dark:hover:text-vanguard-primary"
                    )}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
