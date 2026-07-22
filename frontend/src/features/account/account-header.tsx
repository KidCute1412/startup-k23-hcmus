"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AccountTab {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

const tabs: AccountTab[] = [
  { id: "dashboard", label: "Tổng quan & Hồ sơ", href: "/account" },
  { id: "orders", label: "Đơn thuê của tôi", href: "/orders" },
  { id: "wallet", label: "Ví Mutux & Hạn mức", href: "/wallet" },
];

export function AccountHeader() {
  const pathname = usePathname();

  return (
    <div className="border-b border-vanguard-light-border dark:border-vanguard-dark-border mb-8">
      <nav className="flex space-x-6 overflow-x-auto pb-px" aria-label="Account Tabs">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== "/account" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`whitespace-nowrap pb-4 text-sm font-semibold transition-colors border-b-2 ${
                isActive
                  ? "border-vanguard-primary text-vanguard-primary"
                  : "border-transparent text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted hover:text-vanguard-light-text dark:hover:text-vanguard-dark-text"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
