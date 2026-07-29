"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/field";
import { PricingSummary } from "./pricing-summary";
import type { RentalRequestDraft } from "./types";
import { useCart, type CartItem } from "@/features/cart/cart-context";
import { useRentalOrder } from "@/hooks/useRentalOrder";
import { useRouter } from "next/navigation";

type RentalRequestFormProps = {
  items: CartItem[];
};

export function RentalRequestForm({ items }: RentalRequestFormProps) {
  const { clearCart } = useCart();
  const { createOrder, isLoading: isCreating } = useRentalOrder();
  const router = useRouter();
  const [draft, setDraft] = useState<Omit<RentalRequestDraft, "gearId" | "startDate" | "endDate">>({
    depositType: "traditional",
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(
    () =>
      draft.shippingName.trim() &&
      draft.shippingPhone.trim() &&
      draft.shippingAddress.trim(),
    [draft.shippingAddress, draft.shippingName, draft.shippingPhone],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="p-5 md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-vanguard-light-border pb-5 dark:border-vanguard-dark-border">
          <div>
            <Badge>Rental Draft</Badge>
            <h1 className="mt-3 font-display text-3xl font-bold">
              Yêu cầu thuê ({items.length} thiết bị)
            </h1>
          </div>
        </div>

        <form
          className="grid gap-5"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!canSubmit) return;
            try {
              for (const item of items) {
                await createOrder({
                  gearId: item.gear.id,
                  startDate: item.startDate,
                  endDate: item.endDate,
                  depositType: draft.depositType as "traditional" | "credit_line",
                  shippingName: draft.shippingName,
                  shippingPhone: draft.shippingPhone,
                  shippingAddress: draft.shippingAddress,
                });
              }
              setSubmitted(true);
              clearCart();
              alert("Tạo đơn thuê thành công!");
              router.push("/orders");
            } catch (e: any) {
              alert("Lỗi tạo yêu cầu thuê: " + (e.message || "Vui lòng kiểm tra lại số dư ví"));
            }
          }}
        >
          <fieldset className="grid gap-3">
            <legend className="font-display text-xs font-semibold uppercase tracking-wider">
              Hình thức cọc
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                key="traditional"
                className="flex cursor-pointer items-center gap-3 rounded-v-sm border border-vanguard-light-border p-4 text-sm dark:border-vanguard-dark-border"
              >
                <input
                  type="radio"
                  name="depositType"
                  value="traditional"
                  checked={draft.depositType === "traditional"}
                  onChange={() =>
                    setDraft((current) => ({
                      ...current,
                      depositType: "traditional",
                    }))
                  }
                  className="accent-vanguard-primary"
                />
                Cọc tiền mặt
              </label>
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-display text-xs font-semibold uppercase tracking-wider">
                Người nhận
              </span>
              <Input
                value={draft.shippingName}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    shippingName: event.target.value,
                  }))
                }
                placeholder="Nguyễn Văn A"
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span className="font-display text-xs font-semibold uppercase tracking-wider">
                Số điện thoại
              </span>
              <Input
                value={draft.shippingPhone}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    shippingPhone: event.target.value,
                  }))
                }
                placeholder="09xx xxx xxx"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="font-display text-xs font-semibold uppercase tracking-wider">
              Địa chỉ nhận gear
            </span>
            <Textarea
              value={draft.shippingAddress}
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  shippingAddress: event.target.value,
                }))
              }
              placeholder="Số nhà, phường/xã, quận/huyện, tỉnh/thành"
            />
          </label>

          {submitted ? (
            <div className="rounded-v-sm border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-200">
              Bản nháp yêu cầu thuê đã được tạo trong mock UI.
            </div>
          ) : null}

          <Button type="submit" disabled={!canSubmit || isCreating} icon={<Send size={15} />}>
            {isCreating ? "Đang xử lý..." : "Tạo yêu cầu thuê"}
          </Button>
        </form>
      </Card>

      <PricingSummary
        items={items}
        depositType={draft.depositType}
      />
    </div>
  );
}
