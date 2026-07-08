import { CalendarDays, CheckCircle2, Heart, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatRow } from "@/components/ui/stat-row";
import { formatCurrency } from "@/lib/format";
import { availabilityLabel, availabilityTone } from "./availability";
import type { Gear } from "./types";

type ProductDetailProps = {
  gear: Gear;
};

export function ProductDetail({ gear }: ProductDetailProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Badge>{gear.badge ?? "Masterpiece Series"}</Badge>
        <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
          {gear.name}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          {gear.description}
        </p>
        <div className="flex flex-wrap items-center gap-4 font-display text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          <span className="flex items-center gap-1 text-vanguard-primary">
            <Star size={16} fill="currentColor" />
            <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">
              {gear.rating.toFixed(1)}
            </strong>
          </span>
          <span>{gear.reviewCount} lượt kiểm định</span>
          <span className={availabilityTone(gear.availability)}>
            {availabilityLabel(gear.availability)}
          </span>
        </div>
      </div>

      <Card className="grid gap-5 p-5 sm:grid-cols-2">
        <div>
          <p className="font-display text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Giá trị sở hữu
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-vanguard-primary">
            {formatCurrency(gear.pricing.retailPrice)}
          </p>
        </div>
        <div>
          <p className="font-display text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Thuê trải nghiệm
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-vanguard-secondary">
            {formatCurrency(gear.pricing.dailyPrice)}/ngày
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <ShieldCheck className="text-vanguard-primary" size={22} />
          <p className="mt-3 font-display text-sm font-bold uppercase tracking-wider">
            Cọc linh hoạt
          </p>
          <p className="mt-1 text-xs leading-5 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Tiền mặt hoặc credit line Mutux.
          </p>
        </Card>
        <Card className="p-4">
          <CheckCircle2 className="text-vanguard-primary" size={22} />
          <p className="mt-3 font-display text-sm font-bold uppercase tracking-wider">
            Gear đã kiểm định
          </p>
          <p className="mt-1 text-xs leading-5 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Serial, ngoại hình và phụ kiện.
          </p>
        </Card>
        <Card className="p-4">
          <CalendarDays className="text-vanguard-primary" size={22} />
          <p className="mt-3 font-display text-sm font-bold uppercase tracking-wider">
            Giữ lịch nhanh
          </p>
          <p className="mt-1 text-xs leading-5 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Tạo yêu cầu thuê bằng mock flow.
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton
          href={`/rentals/new?gearId=${gear.slug}`}
          className="flex-1"
          icon={<CalendarDays size={15} />}
        >
          Yêu cầu thuê
        </LinkButton>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-v-sm border border-vanguard-primary px-5 py-3 text-vanguard-primary transition-colors hover:bg-vanguard-primary hover:text-vanguard-dark-bg"
          aria-label="Lưu gear yêu thích"
          title="Lưu gear yêu thích"
        >
          <Heart size={18} />
        </button>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-base font-bold uppercase tracking-widest">
          Chủ gear
        </h2>
        <div className="mt-3">
          <StatRow label="Tên" value={gear.lender.name} />
          <StatRow label="Cấp độ" value={gear.lender.tier} />
          <StatRow label="Tỷ lệ phản hồi" value={`${gear.lender.responseRate}%`} />
          <StatRow label="Đơn hoàn tất" value={`${gear.lender.completedRentals}`} />
          <StatRow label="Khu vực" value={gear.lender.location} />
        </div>
      </Card>
    </div>
  );
}
