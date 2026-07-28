"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Input } from "@/components/ui/field";

type Props = {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
};

export function CatalogPagination({ page, totalPages, searchParams }: Props) {
  const router = useRouter();
  const [requestedPage, setRequestedPage] = useState(String(page));
  useEffect(() => setRequestedPage(String(page)), [page]);
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") query.set(key, value);
    });
    if (target > 1) query.set("page", String(target));
    return `/gears${query.size ? `?${query.toString()}` : ""}`;
  };
  const goToPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = Math.min(totalPages, Math.max(1, Number(requestedPage) || 1));
    setRequestedPage(String(target));
    router.push(href(target));
  };

  const windowStart = Math.max(2, Math.min(totalPages - 1, page - 1));
  const windowEnd = Math.min(totalPages - 1, Math.max(2, page + 1));
  const pages: Array<number | "start-ellipsis" | "end-ellipsis"> =
    totalPages <= 7
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : [
          1,
          ...(windowStart > 2 ? (["start-ellipsis"] as const) : []),
          ...Array.from(
            { length: windowEnd - windowStart + 1 },
            (_, index) => windowStart + index,
          ),
          ...(windowEnd < totalPages - 1
            ? (["end-ellipsis"] as const)
            : []),
          totalPages,
        ];
  const linkClass =
    "inline-flex min-h-10 min-w-10 items-center justify-center rounded-v-sm border border-vanguard-light-border px-3 text-sm transition hover:border-vanguard-primary hover:text-vanguard-primary dark:border-vanguard-dark-border";
  const disabledClass = `${linkClass} cursor-not-allowed opacity-35`;

  return (
    <nav aria-label="Phân trang catalog" className="grid gap-4 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border lg:grid-cols-[1fr_auto_1fr] lg:items-center">
      <p className="text-center text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted lg:text-left">
        Trang <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">{page}</strong> / {totalPages}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {page > 1 ? (
          <>
            <Link className={linkClass} href={href(1)} aria-label="Trang đầu"><ChevronsLeft size={16} /></Link>
            <Link className={linkClass} href={href(page - 1)}>Trước</Link>
          </>
        ) : (
          <>
            <span className={disabledClass} aria-disabled="true"><ChevronsLeft size={16} /></span>
            <span className={disabledClass} aria-disabled="true">Trước</span>
          </>
        )}

        {pages.map((item) =>
          typeof item === "number" ? (
            <Link
              key={item}
              aria-current={item === page ? "page" : undefined}
              className={`${linkClass} ${item === page ? "border-vanguard-primary bg-vanguard-primary/10 font-bold text-vanguard-primary" : ""}`}
              href={href(item)}
            >
              {item}
            </Link>
          ) : (
            <span
              key={item}
              className="inline-flex min-h-10 min-w-6 items-end justify-center pb-2"
              aria-hidden="true"
            >
              &hellip;
            </span>
          ),
        )}

        {page < totalPages ? (
          <>
            <Link className={linkClass} href={href(page + 1)}>Sau</Link>
            <Link className={linkClass} href={href(totalPages)} aria-label="Trang cuối"><ChevronsRight size={16} /></Link>
          </>
        ) : (
          <>
            <span className={disabledClass} aria-disabled="true">Sau</span>
            <span className={disabledClass} aria-disabled="true"><ChevronsRight size={16} /></span>
          </>
        )}
      </div>

      <form onSubmit={goToPage} className="flex items-center justify-center gap-2 lg:justify-end">
        <label htmlFor="catalog-page-input" className="whitespace-nowrap text-sm">Đến trang</label>
        <Input
          id="catalog-page-input"
          type="number"
          min={1}
          max={totalPages}
          inputMode="numeric"
          value={requestedPage}
          onChange={(event) => setRequestedPage(event.target.value)}
          className="min-h-10 w-20 py-1 text-center"
          aria-label={`Nhập trang từ 1 đến ${totalPages}`}
        />
        <button className="min-h-10 rounded-v-sm bg-gold-metal px-4 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg">
          Đi
        </button>
      </form>
    </nav>
  );
}
