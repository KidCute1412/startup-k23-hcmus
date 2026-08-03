"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/useAuth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady } = useAuth();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  useEffect(() => {
    if (!isReady || !user) return;

    if (user.role === "admin" && !isAdminRoute) {
      router.replace("/admin");
    }
  }, [isAdminRoute, isReady, pathname, router, user]);

  if (isAdminRoute) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col bg-vanguard-light-bg text-vanguard-light-text transition-colors duration-300 dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
