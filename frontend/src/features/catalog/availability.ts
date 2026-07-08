import type { AvailabilityStatus } from "./types";

export function availabilityLabel(status: AvailabilityStatus) {
  if (status === "available") return "Sẵn sàng thuê";
  if (status === "reserved") return "Đang được giữ lịch";
  return "Đang bảo trì";
}

export function availabilityTone(status: AvailabilityStatus) {
  if (status === "available") return "text-emerald-600 dark:text-emerald-300";
  if (status === "reserved") return "text-vanguard-secondary";
  return "text-vanguard-accent";
}
