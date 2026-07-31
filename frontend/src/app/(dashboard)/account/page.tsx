import type { Metadata } from "next";
import { AccountView } from "@/features/account/account-view";

export const metadata: Metadata = {
  title: "Tài khoản cá nhân | Mutux Gaming Gear",
  description: "Quản lý hồ sơ cá nhân, xác minh KYC, bảo mật và sổ địa chỉ nhận hàng Mutux.",
};

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-col gap-1">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          Vanguard Account Dashboard
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Tài Khoản Cá Nhân
        </h1>
      </div>
      <AccountView />
    </section>
  );
}
