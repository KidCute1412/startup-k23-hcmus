import type { Metadata } from "next";
import { LenderRevenuePanel } from "@/features/lender/lender-revenue-panel";

export const metadata: Metadata = { title: "Doanh thu | Mutux Lender", description: "Theo dõi doanh thu từ các gear cho thuê." };
export default function LenderRevenuePage() { return <LenderRevenuePanel />; }
