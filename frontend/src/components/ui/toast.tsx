"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastContainer({ toasts, removeToast }: { toasts: ToastItem[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[10000] flex flex-col gap-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((t) => {
        let borderClass = "border-vanguard-primary/50 text-vanguard-dark-text";
        let IconComponent = Info;
        let iconClass = "text-vanguard-primary";

        if (t.type === "success") {
          borderClass = "border-emerald-500/50 text-emerald-200";
          IconComponent = CheckCircle2;
          iconClass = "text-emerald-400";
        } else if (t.type === "error") {
          borderClass = "border-rose-500/50 text-rose-200";
          IconComponent = AlertCircle;
          iconClass = "text-rose-400";
        } else if (t.type === "warning") {
          borderClass = "border-amber-500/50 text-amber-200";
          IconComponent = AlertTriangle;
          iconClass = "text-amber-400";
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-v-md border bg-[#090B10]/95 shadow-royal backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <IconComponent className={`${iconClass} shrink-0 mt-0.5`} size={18} />
            <div className="flex-1 text-sm">
              {t.title && (
                <h5 className="font-display font-bold text-xs uppercase tracking-wider mb-0.5 text-vanguard-light-text dark:text-vanguard-dark-text">
                  {t.title}
                </h5>
              )}
              <p className="text-xs leading-relaxed">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-vanguard-dark-textMuted hover:text-vanguard-dark-text transition p-0.5 rounded"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const value: ToastContextValue = {
    toast: addToast,
    success: (msg, title) => addToast(msg, "success", title),
    error: (msg, title) => addToast(msg, "error", title),
    warning: (msg, title) => addToast(msg, "warning", title),
    info: (msg, title) => addToast(msg, "info", title),
    removeToast,
    toasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
