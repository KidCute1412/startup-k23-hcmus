"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackagePlus, ClipboardList, WalletCards } from "lucide-react";
import { cn } from "@/lib/cn";

export default function LenderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { id: "gears", label: "Gear của tôi", href: "/lender/gears", icon: PackagePlus },
    { id: "orders", label: "Đơn thuê Gear", href: "/lender/orders", icon: ClipboardList },
    { id: "revenue", label: "Doanh thu", href: "/lender/revenue", icon: WalletCards },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-56 shrink-0">
          <div className="sticky top-24 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-vanguard-primary">
              Lender Portal
            </h3>
            <nav className="flex flex-col space-y-1" aria-label="Lender Sidebar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-v-sm px-3 py-2.5 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-vanguard-primary/10 text-vanguard-primary dark:bg-vanguard-primary/20"
                        : "text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-primary dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfDim dark:hover:text-vanguard-primary"
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
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
