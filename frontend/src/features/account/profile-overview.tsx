"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAccount } from "@/hooks/useAccount";
import {
  accountService,
  resolveMediaUrl,
  type AccountUser,
} from "@/services/accountService";
import { ImageDropzone } from "./components/image-dropzone";

const inputClass =
  "w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3.5 py-2.5 text-sm text-vanguard-light-text outline-none transition focus:border-vanguard-primary focus:ring-4 focus:ring-vanguard-primary/10 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text";

function KycBadge({ status }: { status: AccountUser["kycStatus"] }) {
  if (status === "verified")
    return (
      <Badge tone="gold" className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Đã xác thực KYC
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge tone="gold" className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Đang chờ duyệt KYC
      </Badge>
    );
  if (status === "rejected")
    return (
      <Badge tone="destructive" className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        KYC bị từ chối
      </Badge>
    );
  return <Badge tone="muted">Chưa xác thực KYC</Badge>;
}

export function ProfileOverview({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const {
    user,
    isLoading,
    isSaving,
    error,
    reload,
    updateProfile,
    submitKyc,
    closeAccount,
  } = useAccount();

  const [isEditing, setIsEditing] = useState(false);
  const [isKycOpen, setIsKycOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    bio: "",
    dob: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      fullName: user.fullName ?? "",
      phone: user.phone ?? "",
      bio: user.bio ?? "",
      dob: user.dob ?? "",
    });
  }, [user]);

  const avatarPreview = useMemo(
    () =>
      avatarFile
        ? URL.createObjectURL(avatarFile)
        : resolveMediaUrl(user?.avatarUrl ?? null),
    [avatarFile, user?.avatarUrl],
  );

  useEffect(
    () => () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    },
    [avatarPreview],
  );

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setLocalError("Ảnh đại diện phải nhỏ hơn 5MB.");
      return;
    }
    setIsUploadingAvatar(true);
    setLocalError(null);
    setSuccess(null);
    try {
      const uploadRes = await accountService.uploadImage(file);
      await updateProfile({ avatarUrl: uploadRes.url });
      setSuccess("Cập nhật ảnh đại diện thành công.");
    } catch (cause) {
      setLocalError(
        cause instanceof Error ? cause.message : "Không thể cập nhật ảnh đại diện.",
      );
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    setSuccess(null);
    try {
      await updateProfile({
        fullName: form.fullName,
        phone: form.phone || undefined,
        bio: form.bio,
        ...(form.dob ? { dob: form.dob } : {}),
      });
      setIsEditing(false);
      setSuccess("Cập nhật hồ sơ cá nhân thành công.");
    } catch (cause) {
      setLocalError(
        cause instanceof Error ? cause.message : "Không thể lưu hồ sơ.",
      );
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6" aria-busy="true">
        <div className="h-28 animate-pulse rounded-v-sm bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim" />
        <div className="mt-6 h-36 animate-pulse rounded-v-sm bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim" />
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          {error ?? "Không thể tải hồ sơ tài khoản."}
        </p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-4 rounded-v-sm bg-vanguard-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg"
        >
          Thử lại
        </button>
      </Card>
    );
  }

  const initials = (user.fullName || user.email)
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Avatar Direct Upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarFileSelect}
        className="hidden"
      />

      {/* Hero Profile Banner */}
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-vanguard-primary/10 blur-2xl" />

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            {/* Interactive Avatar Container */}
            <div className="relative group shrink-0">
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-vanguard-primary bg-vanguard-light-surfDim font-display text-2xl font-bold text-vanguard-primary shadow-lg shadow-vanguard-primary/10 dark:bg-vanguard-dark-surfDim transition-transform hover:scale-105"
                title="Bấm để thay đổi ảnh đại diện"
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreview}
                    alt={`Ảnh đại diện của ${user.fullName ?? user.email}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}

                {/* Camera / Loading Hover Overlay */}
                <div
                  className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white backdrop-blur-[1px] transition-opacity ${
                    isUploadingAvatar
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {isUploadingAvatar ? (
                    <svg
                      className="h-6 w-6 animate-spin text-vanguard-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6 text-vanguard-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                  <span className="mt-1 text-[10px] font-semibold">
                    {isUploadingAvatar ? "Đang tải..." : "Đổi ảnh"}
                  </span>
                </div>
              </div>

              {avatarFile && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-v-sm bg-vanguard-primary px-2 py-0.5 text-[9px] font-bold text-vanguard-dark-bg">
                  Ảnh mới
                </span>
              )}
            </div>

            {/* User Meta Information */}
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="truncate font-display text-2xl font-bold sm:text-3xl">
                  {user.fullName ?? "Thành viên Mutux"}
                </h2>
                <KycBadge status={user.kycStatus} />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-vanguard-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {user.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5 text-vanguard-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Tham gia từ{" "}
                  {new Intl.DateTimeFormat("vi-VN").format(
                    new Date(user.createdAt),
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="font-semibold text-vanguard-primary">
                  CCCD: {user.cccd ?? "Chưa cập nhật"}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    <svg className="h-3.5 w-3.5 text-vanguard-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {user.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditing((current) => !current);
              setLocalError(null);
              setSuccess(null);
            }}
            className="flex items-center gap-2 self-start rounded-v-sm border border-vanguard-primary/50 bg-vanguard-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-primary transition hover:bg-vanguard-primary hover:text-vanguard-dark-bg sm:self-center"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa hồ sơ"}
          </button>
        </div>

        {/* Global Notification Messages */}
        {(success || localError || error) && (
          <div
            role="status"
            className={`mt-5 flex items-center justify-between rounded-v-sm border px-4 py-3 text-xs font-semibold ${
              localError || error
                ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <span>{localError || error || success}</span>
            <button
              type="button"
              onClick={() => {
                setLocalError(null);
                setSuccess(null);
              }}
              className="text-xs font-bold underline"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Profile Edit Form */}
        {isEditing && (
          <form
            onSubmit={handleProfileSave}
            className="mt-6 space-y-4 border-t border-vanguard-light-border pt-6 dark:border-vanguard-dark-border"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">
                  Họ và tên <span className="text-red-500">*</span>
                </span>
                <input
                  required
                  maxLength={255}
                  value={form.fullName}
                  onChange={(event) =>
                    setForm({ ...form, fullName: event.target.value })
                  }
                  className={inputClass}
                  placeholder="Nhập họ và tên đầy đủ"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">
                  Số điện thoại
                </span>
                <input
                  inputMode="tel"
                  pattern="\+?[0-9]{9,15}"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className={inputClass}
                  placeholder="Ví dụ: 0901234567"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">
                  Ngày sinh
                </span>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(event) =>
                    setForm({ ...form, dob: event.target.value })
                  }
                  className={inputClass}
                />
              </label>

            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold">
                Giới thiệu bản thân
              </span>
              <textarea
                rows={3}
                maxLength={1000}
                value={form.bio}
                onChange={(event) =>
                  setForm({ ...form, bio: event.target.value })
                }
                className={inputClass}
                placeholder="Chia sẻ ngắn về bản thân hoặc nhu cầu thuê thiết bị gaming..."
              />
            </label>

            <div className="flex items-center justify-end gap-3 border-t border-vanguard-light-border pt-4 dark:border-vanguard-dark-border">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setAvatarFile(null);
                }}
                className="rounded-v-sm border border-vanguard-light-border px-4 py-2 text-xs font-semibold uppercase dark:border-vanguard-dark-border"
              >
                Hủy
              </button>
              <button
                disabled={isSaving}
                className="flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-6 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Vanguard Tabbed Navigation Header */}
      <div className="flex border-b border-vanguard-light-border dark:border-vanguard-dark-border overflow-x-auto no-scrollbar">
        <TabButton
          active={activeTab === "profile"}
          onClick={() => onTabChange("profile")}
          svgIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          label="Thông tin cá nhân"
        />
        <TabButton
          active={activeTab === "kyc"}
          onClick={() => onTabChange("kyc")}
          svgIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
          label="Xác minh KYC"
          badge={user.kycStatus === "verified" ? "Đã duyệt" : user.kycStatus === "pending" ? "Đang chờ" : "Cần làm"}
        />
        <TabButton
          active={activeTab === "addresses"}
          onClick={() => onTabChange("addresses")}
          svgIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          label="Sổ địa chỉ"
        />
        <TabButton
          active={activeTab === "security"}
          onClick={() => onTabChange("security")}
          svgIcon={
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          label="Bảo mật & Tài khoản"
        />
      </div>

      {/* TAB 1: Profile Details */}
      {activeTab === "profile" && (
        <Card className="p-6">
          <h3 className="font-display text-lg font-bold">Chi tiết tài khoản</h3>
          <div className="mt-4 grid gap-6 border-t border-vanguard-light-border pt-5 text-sm dark:border-vanguard-dark-border sm:grid-cols-3">
            <ProfileField label="Số điện thoại" value={user.phone} />
            <ProfileField label="Ngày sinh" value={user.dob} />
            <ProfileField label="Số CCCD / CMND" value={user.cccd} />
            <div className="sm:col-span-3">
              <ProfileField label="Giới thiệu bản thân" value={user.bio} />
            </div>
          </div>
        </Card>
      )}

      {/* TAB 2: KYC Section */}
      {activeTab === "kyc" && (
        <Card className="border-l-4 border-l-vanguard-primary p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="font-display text-xl font-bold">
                  Xác thực danh tính (KYC)
                </h3>
                <KycBadge status={user.kycStatus} />
              </div>
              <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Xác minh thông tin cá nhân bằng CCCD để mở khóa các đặc quyền thuê thiết bị cao cấp không cần cọc 100%.
              </p>
              {user.kycStatus === "rejected" && (
                <div className="mt-2 rounded-v-sm border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                  <p className="font-bold flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Lý do yêu cầu lại hồ sơ:
                  </p>
                  <p className="mt-0.5">{user.kycRejectionReason ?? "Ảnh giấy tờ chưa rõ nét hoặc thông tin không khớp."}</p>
                </div>
              )}
            </div>

            {user.kycStatus === "verified" ? (
              <span className="inline-flex items-center gap-1.5 rounded-v-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Tài khoản đã xác minh
              </span>
            ) : user.kycStatus === "pending" ? (
              <span className="inline-flex items-center gap-1.5 rounded-v-sm border border-vanguard-primary/40 bg-vanguard-primary/10 px-4 py-2 text-xs font-bold text-vanguard-primary">
                <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Đang chờ Admin phê duyệt
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsKycOpen(true)}
                className="whitespace-nowrap rounded-v-sm bg-vanguard-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:brightness-110 shadow-md shadow-vanguard-primary/20"
              >
                {user.kycStatus === "rejected" ? "Nộp lại hồ sơ KYC" : "Tải lên hồ sơ KYC"}
              </button>
            )}
          </div>
        </Card>
      )}

      {/* TAB 4: Security & Account Options */}
      {activeTab === "security" && (
        <Card className="p-6 space-y-6">
          <h3 className="font-display text-lg font-bold">Cài đặt bảo mật</h3>

          <div className="flex flex-col gap-4 border-t border-vanguard-light-border pt-5 dark:border-vanguard-dark-border sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold">Mật khẩu đăng nhập</h4>
              <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Khuyến nghị đổi mật khẩu định kỳ để duy trì an toàn tài khoản.
              </p>
            </div>
            <Link
              href="/change-password"
              className="inline-flex items-center justify-center rounded-v-sm border border-vanguard-light-border px-5 py-2 text-xs font-bold uppercase tracking-wider transition hover:border-vanguard-primary hover:text-vanguard-primary dark:border-vanguard-dark-border"
            >
              Đổi mật khẩu
            </Link>
          </div>

          <div className="flex flex-col gap-4 border-t border-vanguard-light-border pt-5 dark:border-vanguard-dark-border sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">
                Đóng tài khoản Mutux
              </h4>
              <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Vô hiệu hóa tài khoản cá nhân. Đảm bảo tất cả đơn thuê và dư nợ đã được tất toán trước khi đóng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCloseOpen(true)}
              className="inline-flex items-center justify-center rounded-v-sm border border-red-600/30 bg-red-600/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-600 hover:text-white"
            >
              Đóng tài khoản
            </button>
          </div>
        </Card>
      )}

      {/* KYC Modal Upload Center */}
      {isKycOpen && (
        <KycDialog
          isSaving={isSaving}
          onCancel={() => setIsKycOpen(false)}
          onSubmit={async (values) => {
            await submitKyc(values);
            setIsKycOpen(false);
            setSuccess("Đã tải lên hồ sơ KYC thành công. Hệ thống sẽ duyệt trong 24h.");
          }}
        />
      )}

      {/* Close Account Confirmation Dialog */}
      {isCloseOpen && (
        <CloseAccountDialog
          isSaving={isSaving}
          error={error}
          onCancel={() => setIsCloseOpen(false)}
          onConfirm={closeAccount}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  svgIcon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  svgIcon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
        active
          ? "border-vanguard-primary text-vanguard-primary"
          : "border-transparent text-vanguard-light-textMuted hover:border-vanguard-light-border hover:text-vanguard-light-text dark:text-vanguard-dark-textMuted dark:hover:border-vanguard-dark-border dark:hover:text-vanguard-dark-text"
      }`}
    >
      <span>{svgIcon}</span>
      <span>{label}</span>
      {badge && (
        <span className="rounded-full bg-vanguard-primary/20 px-2 py-0.5 text-[10px] text-vanguard-primary">
          {badge}
        </span>
      )}
    </button>
  );
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
        {label}
      </span>
      <p className="break-words font-medium text-vanguard-light-text dark:text-vanguard-dark-text">
        {value || "Chưa cập nhật"}
      </p>
    </div>
  );
}

function KycDialog({
  isSaving,
  onCancel,
  onSubmit,
}: {
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (values: {
    cccd: string;
    frontCardUrl: string;
    backCardUrl: string;
    portraitUrl: string;
  }) => Promise<void>;
}) {
  const [cccd, setCccd] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [portrait, setPortrait] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedCount = [front, back, portrait].filter(Boolean).length;
  const isFormComplete = Boolean(cccd.trim() && front && back && portrait);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!front || !back || !portrait) {
      setError("Vui lòng tải lên đầy đủ bộ 3 tài liệu KYC.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const [frontResult, backResult, portraitResult] = await Promise.all([
        accountService.uploadImage(front),
        accountService.uploadImage(back),
        accountService.uploadImage(portrait),
      ]);
      await onSubmit({
        cccd,
        frontCardUrl: frontResult.url,
        backCardUrl: backResult.url,
        portraitUrl: portraitResult.url,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể tải lên hồ sơ KYC.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Xác Thực Danh Tính Hoàng Gia | Elite KYC" onCancel={onCancel}>
      <form onSubmit={submit} className="space-y-4">
        {/* Sleek Top Banner (Header & Progress & Guidelines) */}
        <div className="flex flex-col gap-3 rounded-v-sm border border-vanguard-primary/30 bg-vanguard-light-surfDim/80 text-vanguard-light-text dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-vanguard-primary/50 bg-vanguard-primary/10 text-vanguard-primary">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="font-display font-bold text-xs text-vanguard-primary uppercase tracking-wider">
                Mutux Trust Suite
              </p>
              <p className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Ảnh đủ sáng, nguyên vẹn 4 góc &amp; mã hóa bảo mật.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-semibold">
            <span className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Tiến độ:
            </span>
            <span className="rounded-full bg-vanguard-primary/20 px-2.5 py-0.5 text-xs font-bold text-vanguard-primary border border-vanguard-primary/40">
              {completedCount + (cccd ? 1 : 0)} / 4
            </span>
          </div>
        </div>

        {/* CCCD Input Field */}
        <label className="block space-y-1">
          <span className="block text-xs font-bold uppercase tracking-wider text-vanguard-light-text dark:text-vanguard-dark-text">
            Số Căn Cước Công Dân (CCCD) <span className="text-vanguard-primary">*</span>
          </span>
          <div className="relative">
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{9,20}"
              value={cccd}
              onChange={(event) => setCccd(event.target.value)}
              className={`${inputClass} pl-9 font-mono text-xs tracking-widest`}
              placeholder="Nhập 12 số CCCD"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-vanguard-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3 3 0 00-3 3h6a3 3 0 00-3-3z" />
            </svg>
          </div>
        </label>

        {/* 3 Dropzone Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-v-sm border border-vanguard-primary/20 bg-vanguard-light-surfDim/40 p-2 dark:border-vanguard-primary/20 dark:bg-vanguard-dark-surfDim/40">
            <ImageDropzone
              label="Mặt Trước CCCD"
              required
              aspectRatio="landscape"
              selectedFile={front}
              onFileSelect={setFront}
            />
          </div>
          <div className="rounded-v-sm border border-vanguard-primary/20 bg-vanguard-light-surfDim/40 p-2 dark:border-vanguard-primary/20 dark:bg-vanguard-dark-surfDim/40">
            <ImageDropzone
              label="Mặt Sau CCCD"
              required
              aspectRatio="landscape"
              selectedFile={back}
              onFileSelect={setBack}
            />
          </div>
          <div className="rounded-v-sm border border-vanguard-primary/20 bg-vanguard-light-surfDim/40 p-2 dark:border-vanguard-primary/20 dark:bg-vanguard-dark-surfDim/40">
            <ImageDropzone
              label="Ảnh Chân Dung"
              required
              aspectRatio="landscape"
              selectedFile={portrait}
              onFileSelect={setPortrait}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-v-sm border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-vanguard-light-border pt-3.5 dark:border-vanguard-dark-border">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-v-sm border border-vanguard-light-border px-4 py-2 text-xs font-bold uppercase tracking-wider transition hover:border-vanguard-primary dark:border-vanguard-dark-border"
          >
            Hủy Bỏ
          </button>
          <button
            disabled={uploading || isSaving || !isFormComplete}
            className="flex items-center gap-2 rounded-v-sm bg-gradient-to-r from-vanguard-primary via-[#F3EFE0] to-vanguard-secondary px-6 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg shadow-royal transition-all hover:scale-[1.02] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100"
          >
            {uploading || isSaving ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Đang Tải Lên...</span>
              </>
            ) : (
              <span>Gửi Hồ Sơ KYC</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CloseAccountDialog({
  isSaving,
  error,
  onCancel,
  onConfirm,
}: {
  isSaving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");

  return (
    <Modal title="Xác Nhận Đóng Tài Khoản" onCancel={onCancel}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onConfirm(password).catch(() => undefined);
        }}
        className="space-y-4"
      >
        <p className="text-xs leading-5 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          Nhập mật khẩu hiện tại để xác nhận. Lưu ý: Tài khoản không thể đóng nếu còn đơn thuê đang hoạt động, tranh chấp chưa giải quyết, hoặc tiền gửi bị khóa.
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold">
            Mật khẩu xác nhận <span className="text-red-500">*</span>
          </span>
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            placeholder="Nhập mật khẩu tài khoản"
          />
        </label>

        {error && (
          <p className="rounded-v-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-vanguard-light-border pt-4 dark:border-vanguard-dark-border">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-v-sm border border-vanguard-light-border px-4 py-2 text-xs font-semibold uppercase dark:border-vanguard-dark-border"
          >
            Hủy
          </button>
          <button
            disabled={isSaving}
            className="rounded-v-sm bg-red-600 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-60"
          >
            {isSaving ? "Đang xử lý..." : "Xác nhận đóng"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-v-md border border-vanguard-primary/40 bg-vanguard-light-surf p-5 shadow-2xl dark:border-vanguard-primary/40 dark:bg-vanguard-dark-surf sm:p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-vanguard-light-border pb-3 dark:border-vanguard-dark-border">
          <h4 className="font-display text-lg font-bold">{title}</h4>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng"
            className="flex h-7 w-7 items-center justify-center rounded-full text-vanguard-light-textMuted hover:bg-vanguard-primary/10 hover:text-vanguard-primary dark:text-vanguard-dark-textMuted transition"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
