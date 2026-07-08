"use client";

import { Menu, ShoppingBag, WalletCards, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/gears", label: "Sản phẩm" },
  { href: "/orders", label: "Đơn thuê" },
  { href: "/wallet", label: "Ví Mutux" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-vanguard-light-border bg-vanguard-light-bg/90 backdrop-blur-md transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-v-sm bg-gold-metal font-display font-bold text-vanguard-dark-bg shadow-md">
            V
          </span>
          <span className="font-display text-lg font-semibold tracking-wider sm:text-xl">
            VANGUARD{" "}
            <span className="font-light text-vanguard-primary">ELITE</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 font-display text-xs font-semibold uppercase tracking-widest md:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "border-b pb-1 transition-colors",
                  active
                    ? "border-vanguard-primary text-vanguard-primary"
                    : "border-transparent text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/wallet"
            className="relative inline-flex size-10 items-center justify-center rounded-full text-vanguard-light-text transition-colors hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
            aria-label="Ví Mutux"
            title="Ví Mutux"
          >
            <WalletCards size={18} />
          </Link>
          <Link
            href="/orders"
            className="relative inline-flex size-10 items-center justify-center rounded-full text-vanguard-light-text transition-colors hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
            aria-label="Đơn thuê"
            title="Đơn thuê"
          >
            <ShoppingBag size={18} />
            <span className="absolute right-2 top-2 size-2.5 rounded-full border border-white bg-vanguard-primary dark:border-vanguard-dark-bg" />
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full text-vanguard-light-text transition-colors hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Mở menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-vanguard-light-border bg-vanguard-light-bg px-4 py-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg md:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-v-sm px-3 py-3 font-display text-xs font-bold uppercase tracking-widest text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
