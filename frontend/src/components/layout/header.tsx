"use client";

import { Menu, ShoppingBag, ShoppingCart, WalletCards, X, User, LogOut, KeyRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCart } from "@/features/cart/cart-context";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/gears", label: "Sản phẩm" },
  { href: "/orders", label: "Đơn thuê" },
  { href: "/wallet", label: "Ví Mutux" },
  { href: "/lender/gears", label: "Cho thuê" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-vanguard-light-border bg-vanguard-light-bg/90 backdrop-blur-md transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-v-sm bg-gold-metal font-display font-bold text-vanguard-dark-bg shadow-md">
            M
          </span>
          <span className="font-display text-lg font-semibold tracking-wider sm:text-xl">
            Mutux{" "}
            <span className="font-light text-vanguard-primary">GEAR</span>
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
            href="/cart"
            className="relative inline-flex size-10 items-center justify-center rounded-full text-vanguard-light-text transition-colors hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
            aria-label="Giỏ hàng"
            title="Giỏ hàng"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-vanguard-light-bg bg-vanguard-primary text-[10px] font-bold text-vanguard-dark-bg dark:border-vanguard-dark-bg">
                {totalItems}
              </span>
            )}
          </Link>
          <Link
            href="/orders"
            className="relative inline-flex size-10 items-center justify-center rounded-full text-vanguard-light-text transition-colors hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
            aria-label="Đơn thuê"
            title="Đơn thuê"
          >
            <ShoppingBag size={18} />
          </Link>

          {/* User Profile / Login Dropdown */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative inline-flex size-10 items-center justify-center rounded-full border border-vanguard-primary/30 text-vanguard-light-text transition-colors hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                aria-label="Tài khoản"
                title={user.email}
              >
                <User size={18} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-1 shadow-lg dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
                  <div className="px-3 py-2 border-b border-vanguard-light-border dark:border-vanguard-dark-border text-xs font-semibold truncate text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    {user.email}
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-2 text-left text-xs font-semibold text-vanguard-light-text hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                  >
                    <User size={14} />
                    Tài khoản cá nhân
                  </Link>
                  <Link
                    href="/change-password"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-2 text-left text-xs text-vanguard-light-text hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                  >
                    <KeyRound size={14} />
                    Đổi mật khẩu
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                  >
                    <LogOut size={14} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="relative inline-flex size-10 items-center justify-center rounded-full text-vanguard-light-text transition-colors hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
              aria-label="Đăng nhập"
              title="Đăng nhập"
            >
              <User size={18} />
            </Link>
          )}

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

            {/* Mobile Auth Links */}
            <div className="border-t border-vanguard-light-border dark:border-vanguard-dark-border mt-2 pt-2">
              {user ? (
                <>
                  <div className="px-3 py-2 text-xs font-semibold truncate text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    {user.email}
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-3 text-xs font-bold uppercase tracking-widest text-vanguard-primary hover:bg-vanguard-light-surfDim dark:hover:bg-vanguard-dark-surfBright"
                  >
                    Tài khoản cá nhân
                  </Link>
                  <Link
                    href="/change-password"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-3 text-xs font-bold uppercase tracking-widest text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
                  >
                    Đổi mật khẩu
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      void handleLogout();
                    }}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-3 text-left text-xs font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 rounded-v-sm px-3 py-3 text-xs font-bold uppercase tracking-widest text-vanguard-primary hover:bg-vanguard-light-surfDim dark:hover:bg-vanguard-dark-surfBright"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

