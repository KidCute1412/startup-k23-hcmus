import { Card } from "@/components/ui/card";
import { ProductCard } from "./product-card";
import type { Gear } from "./types";

type ProductGridProps = {
  gears: Gear[];
};

export function ProductGrid({ gears }: ProductGridProps) {
  if (gears.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h2 className="font-display text-xl font-bold">Chưa có gear phù hợp</h2>
        <p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          Hãy thử đổi danh mục hoặc sắp xếp lại catalog.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {gears.map((gear) => (
        <ProductCard key={gear.id} gear={gear} />
      ))}
    </div>
  );
}
