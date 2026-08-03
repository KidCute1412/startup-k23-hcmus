"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual variant — "danger" renders red confirm button */
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible custom confirm dialog with Vanguard Elite dark aesthetic.
 * Replaces browser-native window.confirm() calls.
 */
export function ConfirmDialog({
  open,
  title = "Xác nhận",
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus cancel button when dialog opens for safety-first UX
  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  // Close when clicking the backdrop
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
      onCancel();
    }
  }

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500/40"
      : variant === "warning"
        ? "bg-amber-500 hover:bg-amber-400 text-vanguard-dark-bg focus:ring-amber-400/40"
        : "bg-vanguard-primary hover:bg-vanguard-primary/80 text-vanguard-dark-bg focus:ring-vanguard-primary/40";

  const iconClass =
    variant === "danger"
      ? "text-rose-400"
      : variant === "warning"
        ? "text-amber-400"
        : "text-vanguard-primary";

  const iconBg =
    variant === "danger"
      ? "bg-rose-500/10 border-rose-500/20"
      : variant === "warning"
        ? "bg-amber-500/10 border-amber-500/20"
        : "bg-vanguard-primary/10 border-vanguard-primary/20";

  return (
    /* Backdrop */
    <div
      role="presentation"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(5, 7, 12, 0.75)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdropClick}
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-desc" : undefined}
        className="relative w-full max-w-md rounded-v-md border border-vanguard-dark-border bg-[#0D1018] shadow-royal animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Đóng"
          className="absolute right-4 top-4 rounded p-1 text-vanguard-dark-textMuted transition hover:text-vanguard-dark-text"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-full border ${iconBg}`}
            >
              <AlertTriangle size={22} className={iconClass} />
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="confirm-dialog-title"
                className="font-display text-base font-bold leading-6 text-vanguard-dark-text"
              >
                {title}
              </h2>
              {description && (
                <p
                  id="confirm-dialog-desc"
                  className="mt-1.5 text-sm leading-relaxed text-vanguard-dark-textMuted"
                >
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Separator */}
          <div className="my-5 h-px bg-vanguard-dark-border" />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 items-center justify-center rounded-v-sm border border-vanguard-dark-border bg-transparent px-4 font-display text-[11px] font-bold uppercase tracking-widest text-vanguard-dark-textMuted transition hover:border-vanguard-dark-textMuted hover:text-vanguard-dark-text focus:outline-none focus:ring-2 focus:ring-vanguard-primary/30"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`inline-flex h-9 items-center justify-center rounded-v-sm px-5 font-display text-[11px] font-bold uppercase tracking-widest transition focus:outline-none focus:ring-2 ${confirmClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
