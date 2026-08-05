"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DatePickerProps {
  value?: string; // Format: YYYY-MM-DD
  onChange?: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
}

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const POPOVER_WIDTH = 280;
const VIEWPORT_PADDING = 8;
const POPOVER_GAP = 6;
const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

function businessToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDisplayDate(isoString?: string): string {
  if (!isoString) return "";
  const parts = isoString.split("-");
  if (parts.length !== 3) return isoString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function DatePicker({
  value,
  onChange,
  disabled,
  min,
  max,
  placeholder = "Chọn ngày...",
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = React.useState({ top: 0, left: 0 });

  // Parse initial view date
  const parsedValue = React.useMemo(() => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }, [value]);

  const [viewDate, setViewDate] = React.useState<Date>(() => {
    return parsedValue || new Date();
  });

  React.useEffect(() => {
    if (parsedValue) {
      setViewDate(parsedValue);
    }
  }, [parsedValue]);

  // Handle outside click to close popover
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  React.useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = containerRef.current?.getBoundingClientRect();
      const popover = popoverRef.current;
      if (!trigger || !popover) return;

      const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2);
      const height = popover.offsetHeight;
      const left = Math.min(
        Math.max(trigger.left, VIEWPORT_PADDING),
        window.innerWidth - width - VIEWPORT_PADDING,
      );
      const hasRoomBelow =
        trigger.bottom + POPOVER_GAP + height <= window.innerHeight - VIEWPORT_PADDING;
      const top = hasRoomBelow
        ? trigger.bottom + POPOVER_GAP
        : Math.max(VIEWPORT_PADDING, trigger.top - POPOVER_GAP - height);

      setPopoverPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Days matrix generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const daysGrid = React.useMemo(() => {
    const days: Array<{ dateStr: string; dayNum: number; isCurrentMonth: boolean; isDisabled: boolean }> = [];
    
    // Previous month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = prevDate.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;

      let isDisabled = false;
      if (min && dateStr < min) isDisabled = true;
      if (max && dateStr > max) isDisabled = true;

      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isDisabled,
      });
    }

    // Next month padding to fill grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(currentYear, currentMonth + 1, i);
      const dateStr = nextDate.toISOString().slice(0, 10);
      days.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDayOfWeek, prevMonthDays, min, max]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (dateStr: string) => {
    if (disabled) return;
    onChange?.(dateStr);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "flex min-h-11 w-full items-center justify-between rounded-v-sm border border-vanguard-light-border bg-white px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text",
          !value && "text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted",
          className
        )}
      >
        <span className="truncate">{value ? formatDisplayDate(value) : placeholder}</span>
        <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-70 text-vanguard-primary" />
      </button>

      {isOpen && createPortal(
        <div
          ref={popoverRef}
          style={{ top: popoverPosition.top, left: popoverPosition.left }}
          className="fixed z-[100] max-h-[calc(100vh-16px)] w-[min(280px,calc(100vw-16px))] overflow-y-auto rounded-v-sm border border-vanguard-light-border bg-white p-3 shadow-2xl backdrop-blur-md dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
        >
          {/* Header Month / Year & Nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-v-sm hover:bg-vanguard-primary/10 text-vanguard-light-text dark:text-vanguard-dark-text transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
              {MONTHS[currentMonth]} năm {currentYear}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-v-sm hover:bg-vanguard-primary/10 text-vanguard-light-text dark:text-vanguard-dark-text transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="mb-1 grid grid-cols-7 text-center font-display text-[11px] font-semibold text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1">{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {daysGrid.map((dayObj, index) => {
              const isSelected = value === dayObj.dateStr;
              const isToday = dayObj.dateStr === businessToday();

              return (
                <button
                  key={`${dayObj.dateStr}-${index}`}
                  type="button"
                  disabled={dayObj.isDisabled || !dayObj.isCurrentMonth}
                  onClick={() => handleSelectDay(dayObj.dateStr)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-v-sm transition-all font-medium",
                    !dayObj.isCurrentMonth && "opacity-20 cursor-default",
                    dayObj.isCurrentMonth && !dayObj.isDisabled && "hover:bg-vanguard-primary/20 text-vanguard-light-text dark:text-vanguard-dark-text",
                    dayObj.isDisabled && "cursor-not-allowed opacity-30 line-through",
                    isToday && !isSelected && "border border-vanguard-primary/60 font-bold text-vanguard-primary",
                    isSelected && "bg-vanguard-primary font-bold text-vanguard-dark-bg hover:bg-vanguard-primary/90 shadow-sm"
                  )}
                >
                  {dayObj.dayNum}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
