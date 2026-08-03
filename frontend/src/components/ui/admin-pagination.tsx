"use client";

import { ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

interface AdminPaginationProps {
  /** Current page (1-indexed) */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total record count (shown as info text) */
  total?: number;
  /** Called when user selects a new page */
  onPageChange: (page: number) => void;
  /** How many sibling pages to show around the current page (default: 1) */
  siblingCount?: number;
}

/** Build the list of page tokens to render. */
function buildPageWindow(
  current: number,
  total: number,
  sibling: number,
): Array<number | "start-ellipsis" | "end-ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const windowStart = Math.max(2, Math.min(total - 1, current - sibling));
  const windowEnd = Math.min(total - 1, Math.max(2, current + sibling));

  return [
    1,
    ...(windowStart > 2 ? (["start-ellipsis"] as const) : []),
    ...Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i),
    ...(windowEnd < total - 1 ? (["end-ellipsis"] as const) : []),
    total,
  ];
}

/**
 * AdminPagination — full-featured pagination bar for admin tables/lists.
 *
 * Features: First · Prev · sibling pages with ellipsis · Next · Last · Go-to-page input.
 * Renders nothing when totalPages ≤ 1.
 */
export function AdminPagination({
  page,
  totalPages,
  total,
  onPageChange,
  siblingCount = 1,
}: AdminPaginationProps) {
  const [inputValue, setInputValue] = useState(String(page));
  useEffect(() => setInputValue(String(page)), [page]);

  if (totalPages <= 1) return null;

  const clamp = (n: number) => Math.min(totalPages, Math.max(1, n));
  const go = (target: number) => {
    const clamped = clamp(target);
    if (clamped !== page) onPageChange(clamped);
  };

  const handleGoTo = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseInt(inputValue, 10);
    const target = isNaN(parsed) ? page : clamp(parsed);
    setInputValue(String(target));
    go(target);
  };

  const pages = buildPageWindow(page, totalPages, siblingCount);

  // ── shared button classes ────────────────────────────────────────────────
  const base =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-v-sm border px-2 text-xs font-semibold transition select-none";
  const active = `${base} border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary`;
  const normal = `${base} border-vanguard-light-border bg-vanguard-light-surf text-vanguard-light-text hover:border-vanguard-primary/60 hover:bg-vanguard-light-surfDim dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:border-vanguard-primary/60 dark:hover:bg-vanguard-dark-surfBright`;
  const disabled = `${base} border-vanguard-light-border bg-vanguard-light-surf text-vanguard-light-text opacity-35 cursor-not-allowed dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-vanguard-light-border px-1 pt-4 dark:border-vanguard-dark-border">
      {/* ── Left: record info ── */}
      <span className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
        {total !== undefined ? (
          <>
            Trang{" "}
            <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">{page}</strong>
            {" / "}
            <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">{totalPages}</strong>
            {" · "}
            <span>{total.toLocaleString("vi-VN")} bản ghi</span>
          </>
        ) : (
          <>
            Trang{" "}
            <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">{page}</strong>
            {" / "}
            <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">{totalPages}</strong>
          </>
        )}
      </span>

      {/* ── Centre: page buttons ── */}
      <nav aria-label="Điều hướng trang" className="flex flex-wrap items-center gap-1">
        {/* First */}
        {page > 1 ? (
          <button
            type="button"
            className={normal}
            aria-label="Trang đầu"
            onClick={() => go(1)}
          >
            <ChevronsLeft size={14} />
          </button>
        ) : (
          <span className={disabled} aria-disabled="true" aria-label="Trang đầu">
            <ChevronsLeft size={14} />
          </span>
        )}

        {/* Prev */}
        {page > 1 ? (
          <button
            type="button"
            className={normal}
            aria-label="Trang trước"
            onClick={() => go(page - 1)}
          >
            <ChevronLeft size={14} />
          </button>
        ) : (
          <span className={disabled} aria-disabled="true" aria-label="Trang trước">
            <ChevronLeft size={14} />
          </span>
        )}

        {/* Page window */}
        {pages.map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              className={item === page ? active : normal}
              onClick={() => go(item)}
            >
              {item}
            </button>
          ) : (
            <span
              key={item}
              aria-hidden="true"
              className="inline-flex h-8 min-w-6 items-end justify-center pb-1.5 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"
            >
              &hellip;
            </span>
          ),
        )}

        {/* Next */}
        {page < totalPages ? (
          <button
            type="button"
            className={normal}
            aria-label="Trang sau"
            onClick={() => go(page + 1)}
          >
            <ChevronRight size={14} />
          </button>
        ) : (
          <span className={disabled} aria-disabled="true" aria-label="Trang sau">
            <ChevronRight size={14} />
          </span>
        )}

        {/* Last */}
        {page < totalPages ? (
          <button
            type="button"
            className={normal}
            aria-label="Trang cuối"
            onClick={() => go(totalPages)}
          >
            <ChevronsRight size={14} />
          </button>
        ) : (
          <span className={disabled} aria-disabled="true" aria-label="Trang cuối">
            <ChevronsRight size={14} />
          </span>
        )}
      </nav>

      {/* ── Right: go-to input ── */}
      <form
        onSubmit={handleGoTo}
        className="flex items-center gap-2"
        aria-label="Đi tới trang"
      >
        <label
          htmlFor="admin-pagination-input"
          className="whitespace-nowrap text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"
        >
          Đến trang
        </label>
        <input
          id="admin-pagination-input"
          type="number"
          min={1}
          max={totalPages}
          inputMode="numeric"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label={`Nhập số trang từ 1 đến ${totalPages}`}
          className="h-8 w-16 rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf text-center text-xs font-mono text-vanguard-light-text outline-none transition focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:focus:border-vanguard-primary"
        />
        <button
          type="submit"
          className="h-8 rounded-v-sm bg-gold-metal px-3 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:opacity-90"
        >
          Đi
        </button>
      </form>
    </div>
  );
}
