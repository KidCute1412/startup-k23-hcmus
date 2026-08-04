"use client";

import { PackagePlus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { MyGearCard } from "./my-gear-card";
import type { LenderGear, ListingStatus } from "./types";
import { useGears } from "@/hooks/useGears";

type Props = {
  gears: LenderGear[];
};

const STATUS_TABS: { value: "all" | ListingStatus; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "active", label: "Đang cho thuê" },
  { value: "pending_approval", label: "Chờ duyệt" },
  { value: "draft", label: "Đã gỡ" },
];

export function MyGearsList({ gears: initialGears }: Props) {
  const [gears, setGears] = useState(initialGears);
  const [tab, setTab] = useState<"all" | ListingStatus>("all");
  const [query, setQuery] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { softDelete, relist } = useGears();
  const { error: showError, success: showSuccess } = useToast();

  const filtered = useMemo(() => {
    let list = gears;
    if (tab !== "all") {
      list = list.filter((g) => g.listingStatus === tab);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.categoryName.toLowerCase().includes(q),
      );
    }
    return list;
  }, [gears, tab, query]);

  // Opens the custom confirm dialog
  function handleDelete(id: string) {
    setPendingDeleteId(id);
  }

  // Called when user confirms deletion in the dialog.
  // We update listingStatus -> "draft" in local state (not remove) so the gear
  // immediately moves to the "Da go" tab and the Recover button is accessible.
  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    setDeleting(true);
    try {
      await softDelete(pendingDeleteId);
      setGears((prev) =>
        prev.map((g) =>
          g.id === pendingDeleteId ? { ...g, listingStatus: "draft" as const } : g,
        ),
      );
      showSuccess(
        "Thiết bị đã được gỡ khỏi marketplace. Xem trong tab \"Đã gỡ\".",
        "Đã gỡ gear",
      );
    } catch (err: any) {
      showError(err?.message || "Không thể xóa thiết bị. Vui lòng thử lại.", "Lỗi");
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  }

  function handleCancelDelete() {
    if (!deleting) setPendingDeleteId(null);
  }

  // Gear name for the confirm dialog description
  const pendingGearName = pendingDeleteId
    ? (gears.find((g) => g.id === pendingDeleteId)?.name ?? "thiết bị này")
    : null;

  // Re-derive listingStatus from backend approvalStatus + the new operational status
  function deriveListingStatus(
    approvalStatus: "pending" | "approved" | "rejected",
    status: "available" | "delisted" | "maintenance" | "rented",
  ): import("./types").ListingStatus {
    if (approvalStatus === "pending") return "pending_approval";
    if (approvalStatus === "rejected") return "rejected";
    if (status === "delisted" || status === "maintenance") return "draft";
    return "active";
  }

  async function handleRecover(id: string) {
    try {
      const updated = await relist(id);
      setGears((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
              ...g,
              listingStatus: deriveListingStatus(
                updated.approvalStatus as "pending" | "approved" | "rejected",
                "available",
              ),
            }
            : g,
        ),
      );
      showSuccess("Thiết bị đã được khôi phục về marketplace.", "Đã khôi phục");
    } catch (err: any) {
      showError(err?.message || "Không thể khôi phục thiết bị. Vui lòng thử lại.", "Lỗi");
    }
  }

  return (
    <>
      {/* Custom delete confirmation dialog */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        variant="danger"
        title="Gỡ thiết bị"
        description={`Bạn có chắc muốn gỡ "${pendingGearName}" khỏi marketplace? Thiết bị sẽ không còn hiển thị với người thuê, nhưng bạn có thể khôi phục lại bất cứ lúc nào.`}
        confirmLabel={deleting ? "Đang xóa…" : "Xác nhận gỡ"}
        cancelLabel="Hủy"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
      {/* Main list */}
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-xs flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"
            />
            <input
              id="lender-gear-search"
              type="search"
              placeholder="Tìm gear của bạn…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf py-2 pl-9 pr-4 text-sm outline-none transition focus:border-vanguard-primary focus:ring-2 focus:ring-vanguard-primary/20 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text"
            />
          </div>

        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border">
          {STATUS_TABS.map((t) => {
            const count =
              t.value === "all"
                ? gears.length
                : gears.filter((g) => g.listingStatus === t.value).length;

            return (
              <button
                key={t.value}
                type="button"
                id={`tab-${t.value}`}
                onClick={() => setTab(t.value)}
                className={`inline-flex items-center gap-1.5 rounded-v-sm px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest transition-all ${tab === t.value
                  ? "bg-vanguard-primary text-vanguard-dark-bg"
                  : "border border-vanguard-light-border text-vanguard-light-textMuted hover:border-vanguard-primary/40 hover:text-vanguard-primary dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted"
                  }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${tab === t.value
                    ? "bg-vanguard-dark-bg/20 text-vanguard-dark-bg"
                    : "bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfBright"
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((gear) => (
              <MyGearCard
                key={gear.id}
                gear={gear}
                onDelete={handleDelete}
                onRecover={handleRecover}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 rounded-v-sm border border-dashed border-vanguard-light-border py-20 dark:border-vanguard-dark-border">
            <div className="flex size-16 items-center justify-center rounded-full bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfBright">
              <PackagePlus size={28} className="text-vanguard-primary" />
            </div>
            <div className="text-center">
              <p className="font-display text-base font-bold">
                Chưa có gear nào
              </p>
              <p className="mt-1 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                {query
                  ? "Không tìm thấy kết quả phù hợp."
                  : "Bắt đầu bằng cách đăng gear đầu tiên của bạn."}
              </p>
            </div>
            {!query && (
              <Link href="/lender/gears/new">
                <Button icon={<PackagePlus size={14} />}>Đăng gear mới</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
