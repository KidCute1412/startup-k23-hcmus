"use client";

export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Không thể tải gear</h1>
      <p className="mt-3 text-sm">Đã có lỗi khi kết nối tới dịch vụ. Gear không được xem là đã mất.</p>
      <button className="mt-6 rounded-v-sm bg-gold-metal px-5 py-3 text-sm font-bold text-vanguard-dark-bg" onClick={reset}>Thử lại</button>
    </div>
  );
}
