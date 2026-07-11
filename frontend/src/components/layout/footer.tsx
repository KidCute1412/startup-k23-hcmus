import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-vanguard-light-border bg-vanguard-light-bg px-6 py-12 text-xs text-vanguard-light-textMuted transition-colors dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-textMuted">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="font-display text-sm font-semibold tracking-widest text-vanguard-light-text dark:text-vanguard-dark-text">
            © 2026 Mutux.
          </p>
          <p className="max-w-2xl text-[11px] leading-5">
            Trải nghiệm thuê thiết bị gaming hi-end, kiểm định minh bạch và ví
            tín dụng Mutux cho các món gear giá trị cao.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 font-display font-semibold uppercase tracking-widest">
          <Link href="/gears" className="hover:text-vanguard-primary">
            Catalog
          </Link>
          <Link href="/orders" className="hover:text-vanguard-primary">
            Đơn thuê
          </Link>
          <Link href="/wallet" className="hover:text-vanguard-primary">
            Ví Mutux
          </Link>
        </div>
      </div>
    </footer>
  );
}
