import type { Metadata } from "next";
import { WalletOverview } from "@/features/wallet/wallet-overview";
import { GoldSpotlight } from "@/components/ui/animations/gold-spotlight";
import { GoldDustParticles } from "@/components/ui/animations/gold-dust-particles";

export const metadata: Metadata = {
  title: "Ví Mutux | Quản lý số dư theo vai trò",
  description:
    "Renter quản lý ví tiêu dùng và nạp tiền; lender theo dõi doanh thu và yêu cầu rút tiền trên Mutux.",
};

export default function WalletPage() {
  return (
    <section className="relative mx-auto max-w-6xl">
      <WalletOverview />
    </section>
  );
}
