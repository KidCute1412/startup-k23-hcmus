"use client";

import { X } from "lucide-react";
import type { GearCategory } from "@/types/catalog";

export type CategoryGroup = {
  parent: GearCategory;
  children: GearCategory[];
};

type CategoryModalProps = {
  shouldRenderModal: boolean;
  modalAnimateState: boolean;
  selectedCategory: string;
  groups: CategoryGroup[];
  standalone: GearCategory[];
  onClose: () => void;
  onSelectCategory: (val: string) => void;
};

export function CategoryModal({
  shouldRenderModal,
  modalAnimateState,
  selectedCategory,
  groups,
  standalone,
  onClose,
  onSelectCategory,
}: CategoryModalProps) {
  if (!shouldRenderModal) return null;

  return (
    <div
      role="presentation"
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/25 backdrop-blur-xl dark:bg-vanguard-dark-bg/85 transition-opacity duration-300 ease-out ${
        modalAnimateState ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full max-w-4xl rounded-2xl border border-vanguard-light-border bg-vanguard-light-bg/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          modalAnimateState
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-3 pointer-events-none"
        } dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim/95`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border">
          <div>
            <h3 className="font-display text-xl font-bold uppercase tracking-wide text-vanguard-light-text dark:text-vanguard-dark-text">
              Chọn danh mục sản phẩm
            </h3>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
              Lọc nhanh các tuyệt phẩm công nghệ phù hợp nhất với bạn
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng dialog chọn danh mục"
            className="rounded-full p-2 text-vanguard-light-text hover:bg-vanguard-primary/10 dark:text-vanguard-dark-text dark:hover:bg-vanguard-primary/20 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Beautifully Arranged Parents & Children Categories grid */}
        <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {/* Show All option directly at the beginning */}
          <button
            type="button"
            onClick={() => onSelectCategory("all")}
            className={`flex flex-col items-start justify-center rounded-v-sm border p-4 text-left transition-all duration-200 ${
              selectedCategory === "all"
                ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                : "border-vanguard-light-border bg-vanguard-light-surf hover:border-vanguard-primary/50 text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:border-vanguard-primary/50"
            }`}
          >
            <span className="font-display font-semibold uppercase tracking-wider text-xs">
              Tất cả gear gaming
            </span>
            <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
              Xem đầy đủ tất cả thiết bị trên sàn
            </span>
          </button>

          {groups.map(({ parent, children }) => {
            const parentVal = parent.slug || parent.id;
            const isParentActive = selectedCategory === parentVal;

            return (
              <div
                key={parent.id}
                className="flex flex-col rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
              >
                {/* Parent Selector Header */}
                <button
                  type="button"
                  onClick={() => onSelectCategory(parentVal)}
                  className={`text-left font-display font-bold uppercase tracking-wider text-xs pb-2 border-b border-vanguard-light-border dark:border-vanguard-dark-border flex items-center justify-between group transition-colors ${
                    isParentActive
                      ? "text-vanguard-primary"
                      : "text-vanguard-light-text dark:text-vanguard-dark-text hover:text-vanguard-primary"
                  }`}
                >
                  {parent.name}
                  <span className="text-[10px] text-vanguard-primary font-body lowercase tracking-normal font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    tất cả &rarr;
                  </span>
                </button>

                {/* Children List in current Parent */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {children.map((child) => {
                    const childVal = child.slug || child.id;
                    const isChildActive = selectedCategory === childVal;

                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => onSelectCategory(childVal)}
                        className={`rounded-v-sm border px-3 py-1.5 text-xs transition-all ${
                          isChildActive
                            ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary font-semibold shadow-[0_0_8px_rgba(212,175,55,0.15)]"
                            : "border-vanguard-light-border bg-vanguard-light-bg text-vanguard-light-textMuted hover:border-vanguard-primary hover:text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-textMuted dark:hover:border-vanguard-primary dark:hover:text-vanguard-dark-text"
                        }`}
                      >
                        {child.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {standalone.map((item) => {
            const itemVal = item.slug || item.id;
            const isActive = selectedCategory === itemVal;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectCategory(itemVal)}
                className={`flex flex-col items-start justify-center rounded-v-sm border p-4 text-left transition-all ${
                  isActive
                    ? "border-vanguard-primary bg-vanguard-primary/10 text-vanguard-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                    : "border-vanguard-light-border bg-vanguard-light-surf hover:border-vanguard-primary/50 text-vanguard-light-text dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text dark:hover:border-vanguard-primary/50"
                }`}
              >
                <span className="font-display font-semibold uppercase tracking-wider text-xs">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
