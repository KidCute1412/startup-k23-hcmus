"use client";

import React, { useState } from "react";
import {
  PackageCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Tag,
  DollarSign,
  User,
  ShieldAlert,
  Search,
  Filter,
  Check,
  X,
} from "lucide-react";
import Image from "next/image";

type ApprovalStatus = "pending" | "approved" | "rejected";

interface GearQueueItem {
  id: string;
  name: string;
  category: string;
  price_per_day: number;
  deposit_fee: number;
  approval_status: ApprovalStatus;
  rejection_reason?: string;
  image_url: string;
  specs: string;
  condition: string;
  serial_number: string;
  created_at: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
    rating: number;
  };
}

const MOCK_GEARS: GearQueueItem[] = [
  {
    id: "gear-01",
    name: "Bàn phím cơ Custom Keychron Q1 Pro Wireless RGB",
    category: "Bàn phím cơ",
    price_per_day: 120000,
    deposit_fee: 3500000,
    approval_status: "pending",
    image_url:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    specs: "Switches Banana Tactile, Keycaps PBT Double-shot, CNC Aluminum Shell",
    condition: "Mới 98% - Không trầy xước",
    serial_number: "KC-Q1P-2024-9981",
    created_at: "2026-07-29T14:20:00Z",
    owner: {
      id: "usr-101",
      fullName: "Trần Minh Hoàng",
      email: "hoang.tm@gmail.com",
      rating: 4.9,
    },
  },
  {
    id: "gear-02",
    name: "Tai nghe Gaming không dây SteelSeries Arctis Nova Pro Wireless",
    category: "Tai nghe Gaming",
    price_per_day: 180000,
    deposit_fee: 6000000,
    approval_status: "pending",
    image_url:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    specs: "Active Noise Cancellation (ANC), Dual Wireless 2.4GHz + Bluetooth",
    condition: "Mới 99% - Đầy đủ hộp & phụ kiện",
    serial_number: "SS-ANP-88231",
    created_at: "2026-07-29T11:05:00Z",
    owner: {
      id: "usr-102",
      fullName: "Lê Thị Thu",
      email: "thu.le@gmail.com",
      rating: 5.0,
    },
  },
  {
    id: "gear-03",
    name: "Chuột Gaming Razer Viper V3 Pro Ultra-lightweight",
    category: "Chuột Gaming",
    price_per_day: 90000,
    deposit_fee: 2800000,
    approval_status: "pending",
    image_url:
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
    specs: "Focus Pro 35K Optical Sensor, 54g Ultra-lightweight, 8000Hz polling rate",
    condition: "Mới 95% - Đã dán feet Glass",
    serial_number: "RZ-V3P-00129",
    created_at: "2026-07-28T18:40:00Z",
    owner: {
      id: "usr-103",
      fullName: "Phạm Quốc Bảo",
      email: "baopq@gmail.com",
      rating: 4.7,
    },
  },
  {
    id: "gear-04",
    name: "Màn hình Esports ASUS ROG Swift OLED PG27AQDM 240Hz",
    category: "Màn hình Gaming",
    price_per_day: 350000,
    deposit_fee: 15000000,
    approval_status: "approved",
    image_url:
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
    specs: "27 inch 1400p QHD OLED, 240Hz, 0.03ms GTG response time",
    condition: "Mới 99% - Còn bảo hành hãng 24 tháng",
    serial_number: "ROG-PG27-7712",
    created_at: "2026-07-25T09:15:00Z",
    owner: {
      id: "usr-104",
      fullName: "Nguyễn Văn Đức",
      email: "duc.nv@gmail.com",
      rating: 4.8,
    },
  },
  {
    id: "gear-05",
    name: "Vô lăng chơi game Logitech G923 TRUEFORCE Racing Wheel",
    category: "Vô lăng & Simulation",
    price_per_day: 220000,
    deposit_fee: 7500000,
    approval_status: "rejected",
    rejection_reason: "Hình ảnh chụp thiếu pedal số 3 và cáp nguồn adapter.",
    image_url:
      "https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=600&q=80",
    specs: "TRUEFORCE Feedback, Dual-clutch Launch Control, Premium Leather",
    condition: "Khá - Có xước nhẹ cần cần số",
    serial_number: "LOGI-G923-3391",
    created_at: "2026-07-24T16:30:00Z",
    owner: {
      id: "usr-105",
      fullName: "Đỗ Anh Tuấn",
      email: "tuan.do@gmail.com",
      rating: 4.6,
    },
  },
];

export function GearQueueFeature() {
  const [gears, setGears] = useState<GearQueueItem[]>(MOCK_GEARS);
  const [activeTab, setActiveTab] = useState<ApprovalStatus>("pending");
  const [selectedGear, setSelectedGear] = useState<GearQueueItem | null>(null);
  const [rejectingGearId, setRejectingGearId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredGears = gears.filter(
    (g) =>
      g.approval_status === activeTab &&
      (g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.owner.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleApprove = (id: string) => {
    setGears((prev) =>
      prev.map((g) => (g.id === id ? { ...g, approval_status: "approved" } : g))
    );
    if (selectedGear?.id === id) {
      setSelectedGear(null);
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectingGearId) return;
    setGears((prev) =>
      prev.map((g) =>
        g.id === rejectingGearId
          ? {
              ...g,
              approval_status: "rejected",
              rejection_reason: rejectReason || "Hình ảnh hoặc thông số chưa đạt yêu cầu.",
            }
          : g
      )
    );
    setRejectingGearId(null);
    setRejectReason("");
    if (selectedGear?.id === rejectingGearId) {
      setSelectedGear(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <PackageCheck className="size-7 text-vanguard-primary" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text sm:text-3xl">
              Quản lý Duyệt Thiết bị Cho thuê
            </h1>
          </div>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted sm:text-sm">
            Kiểm định chất lượng, thông số kỹ thuật và tiền cọc sản phẩm đăng tải bởi Lender (Admin Operations)
          </p>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex border-b border-vanguard-light-border dark:border-vanguard-dark-border">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`border-b-2 px-5 py-3 font-display text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "pending"
                ? "border-vanguard-primary text-vanguard-primary"
                : "border-transparent text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
            }`}
          >
            Chờ kiểm định (
            {gears.filter((g) => g.approval_status === "pending").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("approved")}
            className={`border-b-2 px-5 py-3 font-display text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "approved"
                ? "border-vanguard-primary text-vanguard-primary"
                : "border-transparent text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
            }`}
          >
            Đã duyệt (
            {gears.filter((g) => g.approval_status === "approved").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`border-b-2 px-5 py-3 font-display text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "rejected"
                ? "border-vanguard-primary text-vanguard-primary"
                : "border-transparent text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
            }`}
          >
            Bị từ chối (
            {gears.filter((g) => g.approval_status === "rejected").length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 size-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên thiết bị, chủ sở hữu..."
            className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf pl-9 pr-3 py-2 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-text"
          />
        </div>
      </div>

      {/* Grid of Gear Cards */}
      {filteredGears.length === 0 ? (
        <div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-12 text-center text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf dark:text-vanguard-dark-textMuted">
          <Clock className="mx-auto size-10 opacity-50" />
          <p className="mt-3 text-sm font-semibold">Không có sản phẩm nào ở trạng thái này</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGears.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-v border border-vanguard-light-border bg-vanguard-light-surf shadow-md transition hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"
            >
              {/* Product Thumbnail */}
              <div className="relative h-48 w-full overflow-hidden bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfBright">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 rounded-v-sm bg-black/60 px-2.5 py-1 backdrop-blur-md">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-vanguard-primary">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-2 font-display text-sm font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                  {item.name}
                </h3>

                <p className="mt-1 line-clamp-1 text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  {item.specs}
                </p>

                {/* Owner info */}
                <div className="mt-3 flex items-center gap-2 border-t border-vanguard-light-border pt-3 text-xs text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted">
                  <User size={14} className="text-vanguard-primary" />
                  <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {item.owner.fullName}
                  </span>
                  <span className="text-[10px]">({item.owner.email})</span>
                </div>

                {/* Pricing Info */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-v-sm bg-vanguard-light-surfDim p-3 text-xs dark:bg-vanguard-dark-surfBright">
                  <div>
                    <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Giá thuê/ngày
                    </span>
                    <p className="font-bold text-vanguard-primary">
                      {item.price_per_day.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      Tiền đặt cọc
                    </span>
                    <p className="font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                      {item.deposit_fee.toLocaleString("vi-VN")} ₫
                    </p>
                  </div>
                </div>

                {item.rejection_reason && (
                  <p className="mt-2 text-[10px] italic text-red-400">
                    Lý do từ chối: {item.rejection_reason}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-vanguard-light-border pt-3 dark:border-vanguard-dark-border">
                  <button
                    type="button"
                    onClick={() => setSelectedGear(item)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
                  >
                    <Eye size={14} /> Chi tiết
                  </button>

                  {item.approval_status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className="inline-flex items-center gap-1 rounded-v-sm bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                      >
                        <Check size={14} /> Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingGearId(item.id)}
                        className="inline-flex items-center gap-1 rounded-v-sm bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500"
                      >
                        <X size={14} /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Modal */}
      {selectedGear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-v border border-vanguard-light-border bg-vanguard-light-surf shadow-2xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <div className="relative h-64 w-full bg-black">
              <Image
                src={selectedGear.image_url}
                alt={selectedGear.name}
                fill
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => setSelectedGear(null)}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-xs text-vanguard-primary font-bold uppercase tracking-wider">
                <Tag size={14} /> {selectedGear.category}
              </div>
              <h2 className="mt-1 font-display text-xl font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                {selectedGear.name}
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Tình trạng:</span>
                  <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{selectedGear.condition}</p>
                </div>
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Mã Serial/IMEI:</span>
                  <p className="font-mono font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{selectedGear.serial_number}</p>
                </div>
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Chủ sở hữu (Lender):</span>
                  <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{selectedGear.owner.fullName} ({selectedGear.owner.email})</p>
                </div>
                <div>
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Thời gian tạo:</span>
                  <p className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">{new Date(selectedGear.created_at).toLocaleString("vi-VN")}</p>
                </div>
              </div>

              <div className="mt-4 rounded-v-sm bg-vanguard-light-surfDim p-3 text-xs dark:bg-vanguard-dark-surfBright">
                <span className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">Thông số kỹ thuật mô tả:</span>
                <p className="mt-1 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{selectedGear.specs}</p>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-vanguard-light-border pt-4 dark:border-vanguard-dark-border">
                <button
                  type="button"
                  onClick={() => setSelectedGear(null)}
                  className="rounded-v-sm px-4 py-2 text-xs font-semibold text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
                >
                  Đóng
                </button>
                {selectedGear.approval_status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingGearId(selectedGear.id);
                      }}
                      className="rounded-v-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedGear.id)}
                      className="rounded-v-sm bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Phê duyệt thiết bị
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingGearId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-6 shadow-2xl dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf">
            <h3 className="font-display text-lg font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
              Từ chối đăng tải thiết bị
            </h3>
            <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Nhập lý do từ chối để Lender cập nhật lại thông tin hoặc chụp lại ảnh minh họa.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="VD: Ảnh sản phẩm bị mờ, thông số cọc chưa hợp lý..."
              className="mt-4 w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg p-3 text-xs text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-text"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectingGearId(null);
                  setRejectReason("");
                }}
                className="rounded-v-sm px-4 py-2 text-xs font-semibold text-vanguard-light-textMuted hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:text-vanguard-dark-text"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="rounded-v-sm bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
