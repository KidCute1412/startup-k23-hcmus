import type { Metadata } from "next";
import { WalletOverview } from "@/features/wallet/wallet-overview";

export const metadata: Metadata = {
  title: "Ví Mutux | Quản lý số dư theo vai trò",
  description:
    "Renter quản lý ví tiêu dùng và nạp tiền; lender theo dõi doanh thu và yêu cầu rút tiền trên Mutux.",
};

export default function WalletPage() {
  return (
    <section className="mx-auto max-w-6xl py-4 sm:py-8">
      <WalletOverview />
    </section>
  );
}
