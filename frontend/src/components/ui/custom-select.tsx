"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type CustomSelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export type CustomSelectProps = {
  options: CustomSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function CustomSelect({
  options,
  value,
  onValueChange,
  placeholder = "Chọn một tùy chọn",
  className,
  disabled,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const portalRef = React.useRef<HTMLDivElement>(null);

  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0, openUp: false });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Synchronize isOpen state into rendering and exit-animation states
  React.useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 100); // Matches vanguardDropdownExit keyframes duration (100ms)
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  const updateCoords = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuHeight = 240; // Max height configured for dropdown panel
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

      setCoords({
        top: openUp
          ? rect.top + window.scrollY - 4
          : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
        openUp,
      });
    }
  }, []);

  React.useEffect(() => {
    if (shouldRender) {
      updateCoords();
      // Listen to scroll events on capture phase to catch scroll in inner containers
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [shouldRender, updateCoords]);

  // Close dropdown when user clicks outside the component
  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const clickInsideTrigger = containerRef.current && containerRef.current.contains(event.target as Node);
      const clickInsidePortal = portalRef.current && portalRef.current.contains(event.target as Node);

      if (!clickInsideTrigger && !clickInsidePortal) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string, isOptDisabled?: boolean) => {
    if (isOptDisabled) return;
    if (onValueChange) {
      onValueChange(optionValue);
    }
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between rounded-v-sm border border-vanguard-light-border bg-white px-3 py-2 text-sm text-vanguard-light-text placeholder:text-vanguard-light-textMuted outline-none transition focus:border-vanguard-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text [&>span]:line-clamp-1",
          isOpen && "border-vanguard-primary ring-2 ring-vanguard-primary/20",
          "min-h-[unset]"
        )}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 opacity-70 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {mounted && shouldRender && createPortal(
        <div
          ref={portalRef}
          style={{
            position: "absolute",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            "--dropdown-translate-y-start": coords.openUp ? "-100%" : "0px",
            "--dropdown-translate-y-end": coords.openUp ? "-100%" : "0px",
          } as React.CSSProperties}
          className={cn(
            "z-[99999] max-h-60 overflow-y-auto rounded-v-md border border-vanguard-light-border bg-white text-vanguard-light-text shadow-2xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text",
            isClosing ? "animate-dropdown-exit" : "animate-dropdown-enter",
            coords.openUp ? "origin-bottom" : "origin-top"
          )}
        >
          <div className="p-1">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value, opt.disabled)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-v-sm py-2 pl-8 pr-3 text-sm outline-none transition-colors",
                    opt.disabled
                      ? "pointer-events-none opacity-50"
                      : "hover:bg-vanguard-primary/10 hover:text-vanguard-primary dark:hover:bg-vanguard-primary/20 dark:hover:text-vanguard-primary",
                    isSelected && "text-vanguard-primary font-medium"
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    {isSelected && <Check className="h-4 w-4 text-vanguard-primary" />}
                  </span>
                  <span>{opt.label}</span>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
