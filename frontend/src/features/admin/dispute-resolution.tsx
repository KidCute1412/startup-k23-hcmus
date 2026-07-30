"use client";

import React, { useState } from "react";
import {
  Scale,
  AlertTriangle,
  FileImage,
  DollarSign,
  CheckCircle2,
  XCircle,
  UserCheck,
  Ban,
  ShieldOff,
  Info,
  ChevronRight,
  User,
} from "lucide-react";
import Image from "next/image";

type ResolutionType =
  | "refund"
  | "deposit_deduct"
  | "compensation"
  | "account_ban"
  | "no_action";

interface DisputeCase {
  id: string;
  order_id: string;
  gear_name: string;
  gear_image: string;
  deposit_amount: number;
  total_rent_fee: number;
  created_at: string;
  renter: {
    name: string;
    email: string;
    claim: string;
    proof_image: string;
  };
  lender: {
    name: string;
    email: string;
    claim: string;
    proof_image: string;
  };
  status: "open" | "resolved";
  resolution?: {
    type: ResolutionType;
    deduct_amount?: number;
    note: string;
    resolved_at: string;
  };
}

const MOCK_DISPUTES: DisputeCase[] = [
  {
    id: "disp-01",
    order_id: "ORD-2026-8812",
    gear_name: "Bàn phím cơ Custom Keychron Q1 Pro Wireless",
    gear_image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    deposit_amount: 3500000,
    total_rent_fee: 360000,
    created_at: "2026-07-29T10:15:00Z",
    renter: {
      name: "Nguyễn Văn An",
      email: "an.nguyen@gmail.com",
      claim: "Tôi nhận hàng thì thấy Switch spacebar bị kẹt nhẹ, tôi đã nhắn cho Lender nhưng vẫn gửi đúng hạn.",
      proof_image:
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    },
    lender: {
      name: "Trần Minh Hoàng",
      email: "hoang.tm@gmail.com",
      claim: "Khi nhận bàn phím hoàn trả, switch phím Spacebar đã bị gãy chân pin Hotswap. Yêu cầu trừ cọc 300.000₫ để thay thế.",
      proof_image:
        "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=600&q=80",
    },
    status: "open",
  },
  {
    id: "disp-02",
    order_id: "ORD-2026-9043",
    gear_name: "Tai nghe Gaming SteelSeries Arctis Nova Pro Wireless",
    gear_image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    deposit_amount: 6000000,
    total_rent_fee: 540000,
    created_at: "2026-07-28T16:00:00Z",
    renter: {
      name: "Phạm Đức Thắng",
      email: "thang.pd@gmail.com",
      claim: "Lender giao trễ 1 ngày khiến tôi không kịp dùng cho giải đấu. Tôi muốn hủy và hoàn trả 100% tiền thuê + cọc.",
      proof_image:
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    },
    lender: {
      name: "Lê Thị Thu",
      email: "thu.le@gmail.com",
      claim: "Tôi đã gửi đơn vị vận chuyển đúng giờ, trễ do đợt mưa lớn của bên vận chuyển. Renter đã mở seal dùng.",
      proof_image:
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    },
    status: "open",
  },
];

export function DisputeResolutionFeature() {
  const [disputes, setDisputes] = useState<DisputeCase[]>(MOCK_DISPUTES);
  const [activeCase, setActiveCase] = useState<DisputeCase>(MOCK_DISPUTES[0]);

  // Form states
  const [resolutionType, setResolutionType] =
    useState<ResolutionType>("deposit_deduct");
  const [deductAmount, setDeductAmount] = useState<number>(300000);
  const [resolutionNote, setResolutionNote] = useState<string>(
    "Căn cứ hình ảnh bàn giao và đối soát bằng chứng hoàn trả: Xác nhận hỏng hóc switch phím spacebar do quá trình sử dụng của Renter. Chấp thuận khấu trừ 300.000₫ tiền cọc để bồi thường cho Lender."
  );
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === activeCase.id
          ? {
            ...d,
            status: "resolved",
            resolution: {
              type: resolutionType,
              deduct_amount:
                resolutionType === "deposit_deduct" ||
                  resolutionType === "compensation"
                  ? deductAmount
                  : undefined,
              note: resolutionNote,
              resolved_at: new Date().toISOString(),
            },
          }
          : d
      )
    );
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="size-7 text-vanguard-primary" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text sm:text-3xl">
              Giải quyết Tranh chấp
            </h1>
          </div>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
            Phân xử khiếu nại giữa Renter & Lender, quyết định khấu trừ cọc hoặc hoàn tiền (POST /admin/disputes/:id/resolve)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Dispute Cases List */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Vụ việc tranh chấp đang mở ({disputes.length})
          </h2>

          {disputes.map((caseItem) => {
            const isSelected = activeCase.id === caseItem.id;
            return (
              <button
                key={caseItem.id}
                type="button"
                onClick={() => setActiveCase(caseItem)}
                className={`w-full rounded-v border p-4 text-left transition ${isSelected
                  ? "border-vanguard-primary bg-vanguard-primary/10 shadow-md"
                  : "border-vanguard-light-border bg-vanguard-light-surf hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-vanguard-primary">
                    {caseItem.order_id}
                  </span>
                  {caseItem.status === "open" ? (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                      Đang chờ xử lý
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                      Đã xử lý
                    </span>
                  )}
                </div>

                <h3 className="mt-2 line-clamp-1 font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                  {caseItem.gear_name}
                </h3>

                <div className="mt-3 flex items-center justify-between text-[14px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  <span>Tiền cọc: {caseItem.deposit_amount.toLocaleString("vi-VN")} ₫</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Column: Case Workspace & Resolution Form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Case Details Card */}
          <div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-md dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border">
              <div>
                <span className="font-mono text-xs font-bold text-vanguard-primary">
                  Mã đơn thuê: {activeCase.order_id}
                </span>
                <h2 className="mt-1 font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                  {activeCase.gear_name}
                </h2>
              </div>
              <div className="text-right text-xs">
                <span className=" text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Tiền cọc:</span>
                <h2 className="item-end mt-1 font-mono text-xl font-bold text-vanguard-primary">
                  {activeCase.deposit_amount.toLocaleString("vi-VN")} ₫
                </h2>
              </div>
            </div>

            {/* Evidence Comparison Grid */}
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Renter Claim */}
              <div className="rounded-v-sm border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                  <User size={14} />
                  <span>NGƯỜI THUÊ (RENTER): {activeCase.renter.name}</span>
                </div>
                <p className="mt-2 text-xs text-vanguard-light-text dark:text-vanguard-dark-text">
                  &quot;{activeCase.renter.claim}&quot;
                </p>
                <div className="relative mt-3 h-36 w-full overflow-hidden rounded-v-sm bg-black">
                  <Image
                    src={activeCase.renter.proof_image}
                    alt="Bằng chứng Renter"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                    Ảnh Renter chụp lúc nhận hàng
                  </div>
                </div>
              </div>

              {/* Lender Claim */}
              <div className="rounded-v-sm border border-purple-500/30 bg-purple-500/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-500">
                  <User size={14} />
                  <span>CHỦ THIẾT BỊ (LENDER): {activeCase.lender.name}</span>
                </div>
                <p className="mt-2 text-xs text-vanguard-light-text dark:text-vanguard-dark-text">
                  &quot;{activeCase.lender.claim}&quot;
                </p>
                <div className="relative mt-3 h-36 w-full overflow-hidden rounded-v-sm bg-black">
                  <Image
                    src={activeCase.lender.proof_image}
                    alt="Bằng chứng Lender"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                    Ảnh Lender chụp sau khi trả hàng
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Form Panel */}
            <form onSubmit={handleResolveSubmit} className="mt-8 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-vanguard-light-text dark:text-vanguard-dark-text">
                Form Phân xử của Quản trị viên (Admin Resolution Action)
              </h3>

              <div className="mt-4 space-y-4">
                {/* Resolution Type Selection */}
                <div>
                  <label className="field-label mb-2">Hình thức Phân xử (resolutionType)</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => setResolutionType("deposit_deduct")}
                      className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${resolutionType === "deposit_deduct"
                        ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                        : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                        }`}
                    >
                      <DollarSign size={16} className="mb-1" />
                      Khấu trừ cọc
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionType("refund")}
                      className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${resolutionType === "refund"
                        ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                        : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                        }`}
                    >
                      <CheckCircle2 size={16} className="mb-1 text-emerald-500" />
                      Hoàn cọc 100%
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionType("compensation")}
                      className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${resolutionType === "compensation"
                        ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                        : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                        }`}
                    >
                      <AlertTriangle size={16} className="mb-1 text-amber-500" />
                      Bồi thường tổn thất
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionType("account_ban")}
                      className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${resolutionType === "account_ban"
                        ? "border-red-500 bg-red-500/10 text-red-500"
                        : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                        }`}
                    >
                      <Ban size={16} className="mb-1 text-red-500" />
                      Khóa tài khoản
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolutionType("no_action")}
                      className={`rounded-v-sm border p-3 text-left text-xs font-bold transition ${resolutionType === "no_action"
                        ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary"
                        : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                        }`}
                    >
                      <ShieldOff size={16} className="mb-1 text-gray-400" />
                      Hủy tranh chấp
                    </button>
                  </div>
                </div>

                {/* Deduct Amount Field */}
                {(resolutionType === "deposit_deduct" ||
                  resolutionType === "compensation") && (
                    <div>
                      <label className="field-label mb-1">
                        Số tiền khấu trừ / bồi thường (deductAmount - VNĐ)
                      </label>
                      <input
                        type="number"
                        value={deductAmount}
                        onChange={(e) => setDeductAmount(Number(e.target.value))}
                        className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs font-mono font-bold text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                      />
                    </div>
                  )}

                {/* Resolution Note Field */}
                <div>
                  <label className="field-label mb-1">
                    Ghi chú Phân xử của Admin (resolutionNote)
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-6 py-2.5 font-display text-xs font-bold text-vanguard-dark-bg shadow-md transition hover:opacity-90"
                  >
                    <CheckCircle2 size={16} />
                    Xác nhận Phân xử Tranh chấp
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-v border border-vanguard-primary/40 bg-vanguard-light-surf p-6 shadow-2xl dark:border-vanguard-primary/40 dark:bg-vanguard-dark-surf">
            <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
            <h3 className="mt-3 text-center font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
              Đã Phân xử Tranh chấp Thành công!
            </h3>
            <p className="mt-2 text-center text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Hệ thống đã gửi yêu cầu tới endpoint <code className="font-mono text-vanguard-primary">POST /admin/disputes/{activeCase.id}/resolve</code> và cập nhật số dư tiền cọc phong tỏa.
            </p>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSuccessModalOpen(false)}
                className="rounded-v-sm bg-vanguard-primary px-6 py-2 text-xs font-bold text-vanguard-dark-bg"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
