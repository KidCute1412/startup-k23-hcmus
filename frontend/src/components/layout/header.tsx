"use client";

import { Menu, ShoppingBag, ShoppingCart, X, User, LogOut, KeyRound, Wallet, ShieldCheck, Package, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCart } from "@/features/cart/cart-context";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

import { resolveMediaUrl } from "@/lib/media";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/gears", label: "Sản phẩm" },
  { href: "/about", label: "About us" },
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

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return { label: "Admin", badgeStyle: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
      case "renter":
      default:
        return {
          label: user?.lenderEnabled ? "Lender" : "Renter",
          badgeStyle: user?.lenderEnabled
            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        };
    }
  };

  const roleInfo = getRoleLabel(user?.role);

  return (
    <header className="sticky top-0 z-50 border-b border-vanguard-light-border bg-vanguard-light-bg/90 backdrop-blur-md transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg/95">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center overflow-hidden rounded-v-sm shadow-md">
            <Image
              src="/favicon.ico"
              alt="Mutux logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </span>
          <span className="font-display text-lg font-semibold tracking-wider sm:text-xl">
            Mutux{" "}
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
          {user?.role === "renter" ? (
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
          ) : null}
          {user?.role === "admin" && (
            <Link
              href="/admin/kyc"
              className="relative inline-flex size-10 items-center justify-center rounded-full text-vanguard-primary transition-colors hover:bg-vanguard-light-surfDim dark:hover:bg-vanguard-dark-surfBright"
              aria-label="Quản trị Admin"
              title="Quản trị Admin"
            >
              <ShieldCheck size={18} />
            </Link>
          )}

          {/* User Profile / Login Dropdown */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 rounded-full border border-vanguard-primary/30 bg-vanguard-light-surf/80 px-3 py-1.5 text-vanguard-light-text transition-all hover:border-vanguard-primary/60 hover:bg-vanguard-light-surfDim dark:bg-vanguard-dark-surf/80 dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                aria-label="Tài khoản"
              >
                {user.avatarUrl ? (
                  <img
                    src={resolveMediaUrl(user.avatarUrl)}
                    alt={user.fullName || "Avatar"}
                    className="size-7 rounded-full object-cover border border-vanguard-primary/20"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-vanguard-primary/20 text-vanguard-primary font-bold text-xs">
                    {(user.fullName || user.email)?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="hidden flex-col text-left sm:flex">
                  <span className="max-w-[110px] truncate text-xs font-semibold leading-none">
                    {user.fullName || user.email.split("@")[0]}
                  </span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-vanguard-primary">
                    {roleInfo.label}
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-v-sm px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest sm:hidden border",
                    roleInfo.badgeStyle
                  )}
                >
                  {roleInfo.label}
                </span>
                <ChevronDown size={14} className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-1.5 shadow-xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
                  <div className="border-b border-vanguard-light-border px-3 py-2.5 dark:border-vanguard-dark-border">
                    <p className="text-xs font-bold text-vanguard-light-text dark:text-vanguard-dark-text truncate">
                      {user.fullName || "Tài khoản Mutux"}
                    </p>
                    <p className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted truncate">
                      {user.email}
                    </p>
                    <div className="mt-2 inline-flex items-center rounded bg-vanguard-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-vanguard-primary">
                      Vai trò: {roleInfo.label}
                    </div>
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
                    href="/orders"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-2 text-left text-xs font-semibold text-vanguard-light-text hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                  >
                    <ShoppingBag size={14} />
                    Đơn thuê của tôi
                  </Link>
                  <Link
                    href="/wallet"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-2 text-left text-xs font-semibold text-vanguard-light-text hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                  >
                    <Wallet size={14} />
                    Ví Mutux
                  </Link>
                  {user.lenderEnabled && (
                    <Link
                      href="/lender/gears"
                      onClick={() => setShowUserMenu(false)}
                      className="flex w-full items-center gap-2 rounded-v-sm px-3 py-2 text-left text-xs font-semibold text-vanguard-light-text hover:bg-vanguard-light-surfDim dark:text-vanguard-dark-text dark:hover:bg-vanguard-dark-surfBright"
                    >
                      <Package size={14} />
                      Quản lý cho thuê
                    </Link>
                  )}
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
                  <div className="px-3 py-2 text-xs font-semibold truncate text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted flex items-center justify-between">
                    <span>{user.email}</span>
                    <span className={cn("px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-v-sm border", roleInfo.badgeStyle)}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-3 text-xs font-bold uppercase tracking-widest text-vanguard-primary hover:bg-vanguard-light-surfDim dark:hover:bg-vanguard-dark-surfBright"
                  >
                    Tài khoản cá nhân
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-3 text-xs font-bold uppercase tracking-widest text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
                  >
                    Đơn thuê của tôi
                  </Link>
                  <Link
                    href="/wallet"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-2 rounded-v-sm px-3 py-3 text-xs font-bold uppercase tracking-widest text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
                  >
                    Ví Mutux
                  </Link>
                  {user.lenderEnabled && (
                    <Link
                      href="/lender/gears"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2 rounded-v-sm px-3 py-3 text-xs font-bold uppercase tracking-widest text-vanguard-light-textMuted hover:bg-vanguard-light-surfDim hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:bg-vanguard-dark-surfBright dark:hover:text-vanguard-dark-text"
                    >
                      Quản lý cho thuê
                    </Link>
                  )}
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
