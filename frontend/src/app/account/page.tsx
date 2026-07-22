import { AccountHeader } from "@/features/account/account-header";
import { ProfileOverview } from "@/features/account/profile-overview";
import { AddressList } from "@/features/account/address-list";

export default function AccountPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          User Dashboard
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">Tài khoản cá nhân</h1>
      </div>

      <AccountHeader />

      <div className="space-y-8">
        {/* Profile & KYC Section */}
        <ProfileOverview />

        {/* Address Book Section */}
        <AddressList />
      </div>
    </section>
  );
}
