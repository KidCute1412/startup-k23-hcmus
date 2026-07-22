import { AccountHeader } from "@/features/account/account-header";
import { WalletOverview } from "@/features/account/wallet-overview";

export default function WalletPage() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="font-display text-xs font-semibold uppercase tracking-widest text-vanguard-primary">
          Mutux Finance
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold">Ví Mutux & Hạn mức</h1>
      </div>

      <AccountHeader />

      <WalletOverview />
    </section>
  );
}
