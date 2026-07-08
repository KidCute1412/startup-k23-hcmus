import { Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import type { GearCategory } from "./types";

type CatalogFilterProps = {
  categories: GearCategory[];
  category?: string;
  sort?: string;
  resultCount: number;
};

export function CatalogFilter({
  categories,
  category = "all",
  sort = "featured",
  resultCount,
}: CatalogFilterProps) {
  return (
    <Card className="p-5">
      <div className="mb-5 flex items-center justify-between border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">
          Bộ lọc
        </h2>
        <Filter size={16} className="text-vanguard-primary" />
      </div>

      <form className="grid gap-5" action="/gears">
        <label className="grid gap-2 text-sm">
          <span className="font-display text-xs font-semibold uppercase tracking-wider">
            Danh mục
          </span>
          <Select name="category" defaultValue={category}>
            <option value="all">Tất cả gear</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-display text-xs font-semibold uppercase tracking-wider">
            Sắp xếp
          </span>
          <Select name="sort" defaultValue={sort}>
            <option value="featured">Nổi bật</option>
            <option value="price-asc">Giá thuê tăng dần</option>
            <option value="price-desc">Giá thuê giảm dần</option>
            <option value="rating">Đánh giá cao nhất</option>
          </Select>
        </label>

        <div className="space-y-2">
          <p className="font-display text-xs font-semibold uppercase tracking-wider">
            Trạng thái
          </p>
          <div className="grid gap-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked
                readOnly
                className="size-4 rounded-v-sm accent-vanguard-primary"
              />
              Có kiểm định ảnh và serial
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked
                readOnly
                className="size-4 rounded-v-sm accent-vanguard-primary"
              />
              Hỗ trợ cọc bằng ví tín dụng
            </label>
          </div>
        </div>

        <button className="gold-shimmer min-h-11 rounded-v-sm bg-gold-metal px-4 py-3 font-display text-xs font-bold uppercase tracking-widest text-vanguard-dark-bg transition-transform hover:scale-[1.02]">
          Áp dụng
        </button>
      </form>

      <p className="mt-5 border-t border-vanguard-light-border pt-4 text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted">
        Hiển thị {resultCount} tuyệt phẩm
      </p>
    </Card>
  );
}
