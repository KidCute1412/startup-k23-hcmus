"use client";
import { useState } from "react";

export function KycSubmitModal({ open, renter, busy, onClose, onSubmit }: {
  open: boolean; renter: boolean; busy: boolean; onClose: () => void;
  onSubmit: (cccd: string, consent?: boolean) => Promise<void>;
}) {
  const [cccd, setCccd] = useState("");
  const [consent, setConsent] = useState(false);
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
    <form onSubmit={(e) => { e.preventDefault(); void onSubmit(cccd.trim(), renter ? consent : undefined); }} className="w-full max-w-md rounded-v-lg border border-vanguard-primary/30 bg-vanguard-light-surf p-6 dark:bg-vanguard-dark-surf">
      <h2 className="font-display text-xl font-bold">Gửi hồ sơ KYC</h2>
      <label className="mt-5 block text-sm font-semibold">Số CCCD
        <input value={cccd} onChange={(e) => setCccd(e.target.value)} minLength={1} maxLength={20} required className="mt-2 w-full rounded-v-sm border bg-transparent px-3 py-2" />
      </label>
      {renter && <label className="mt-4 flex items-start gap-3 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
        Tôi đồng ý điều khoản tín dụng Mutux. Khi KYC được duyệt, tôi sẽ được tự động cấp hạn mức 3.000.000đ.
      </label>}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="rounded-v-sm border px-4 py-2 text-sm">Hủy</button>
        <button disabled={busy || !cccd.trim() || (renter && !consent)} className="rounded-v-sm bg-vanguard-primary px-4 py-2 text-sm font-bold text-vanguard-dark-bg disabled:opacity-50">Gửi hồ sơ</button>
      </div>
    </form>
  </div>;
}
