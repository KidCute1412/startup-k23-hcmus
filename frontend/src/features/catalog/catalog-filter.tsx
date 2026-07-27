"use client";

import { Filter, X } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="p-5">
      <div 
        className="mb-5 flex items-center justify-between border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border cursor-pointer md:cursor-default"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="font-display text-sm font-bold uppercase tracking-widest">
          Bộ lọc
        </h2>
        {isOpen ? <X size={16} className="text-vanguard-primary md:hidden" /> : <Filter size={16} className="text-vanguard-primary" />}
      </div>

      <form className={`grid gap-5 ${isOpen ? 'block' : 'hidden md:grid'}`} action="/gears">
        <div className="grid gap-2 text-sm">
          <span className="font-display text-xs font-semibold uppercase tracking-wider">
            Danh mục
          </span>
          <Select name="category" defaultValue={category}>
            <SelectTrigger>
              <SelectValue placeholder="Tất cả gear" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả gear</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 text-sm">
          <span className="font-display text-xs font-semibold uppercase tracking-wider">
            Sắp xếp
          </span>
          <Select name="sort" defaultValue={sort}>
            <SelectTrigger>
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Nổi bật</SelectItem>
              <SelectItem value="price-asc">Giá thuê tăng dần</SelectItem>
              <SelectItem value="price-desc">Giá thuê giảm dần</SelectItem>
              <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
              Có kiểm định ảnh và serial
            </label>
          </div>
        </div>

        <button className="gold-shimmer min-h-11 rounded-v-sm bg-gold-metal px-4 py-3 font-display text-xs font-bold uppercase tracking-widest text-vanguard-dark-bg transition-transform hover:scale-[1.02]">
          Áp dụng
        </button>
      </form>

      <p className={`mt-5 border-t border-vanguard-light-border pt-4 text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted ${isOpen ? 'block' : 'hidden md:block'}`}>
        Hiển thị {resultCount} tuyệt phẩm
      </p>
    </Card>
  );
}
