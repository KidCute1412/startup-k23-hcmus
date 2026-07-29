"use client";

import React, { useState } from "react";
import { AdminSidebar } from "@/features/admin/admin-sidebar";
import { Menu, X, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-vanguard-light-bg text-vanguard-light-text transition-colors duration-300 dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AdminSidebar className="sticky top-0 h-screen" />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-xs">
            <AdminSidebar className="h-full" />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute right-4 top-4 text-white"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* Main Content Workspace */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-vanguard-light-border bg-vanguard-light-bg/90 px-6 backdrop-blur-md transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg/95">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex size-10 items-center justify-center rounded-full border border-vanguard-light-border text-vanguard-light-text md:hidden dark:border-vanguard-dark-border dark:text-vanguard-dark-text"
            >
              <Menu size={20} />
            </button>

            <div className="hidden items-center gap-2 text-xs font-semibold sm:flex text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <ShieldCheck className="size-4 text-vanguard-primary" />
              <span>Mutux Admin Operations Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {/* Admin User Chip */}
            <div className="flex items-center gap-3 rounded-full border border-vanguard-primary/30 bg-vanguard-primary/5 px-3.5 py-1.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-vanguard-primary text-vanguard-dark-bg font-bold text-xs">
                <User size={14} />
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-vanguard-light-text dark:text-vanguard-dark-text truncate max-w-[140px]">
                  {user?.email ?? "Admin Portal"}
                </p>
                <p className="text-[10px] font-semibold text-vanguard-primary uppercase tracking-widest">
                  Administrator
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
