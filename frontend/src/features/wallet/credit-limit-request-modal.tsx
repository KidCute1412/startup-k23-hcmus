"use client";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";

export function CreditLimitRequestModal({ tier, open, busy, error, onClose, onSubmit }: {
  tier: number | null; open: boolean; busy: boolean; error?: string | null; onClose: () => void; onSubmit: () => Promise<void>;
}) {
  const [consent, setConsent] = useState(false);
  if (!open || tier === null) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
    <section className="w-full max-w-md rounded-v-lg border border-vanguard-primary/30 bg-vanguard-light-surf p-6 shadow-2xl dark:bg-vanguard-dark-surf">
      <h2 className="font-display text-xl font-bold">Yêu cầu nâng hạn mức</h2>
      <p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
        Hạn mức đề nghị: <strong>{formatCurrency(tier)}</strong>. Mutux sẽ kiểm tra lại điều kiện khi admin duyệt.
      </p>
      {error && <p role="alert" className="mt-4 rounded-v-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <label className="mt-5 flex items-start gap-3 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        Tôi đồng ý điều khoản tín dụng và xác nhận thông tin yêu cầu là chính xác.
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-v-sm border px-4 py-2 text-sm">Hủy</button>
        <button type="button" disabled={!consent || busy} onClick={() => void onSubmit()} className="rounded-v-sm bg-vanguard-primary px-4 py-2 text-sm font-bold text-vanguard-dark-bg disabled:opacity-50">Gửi yêu cầu</button>
      </div>
    </section>
  </div>;
}
