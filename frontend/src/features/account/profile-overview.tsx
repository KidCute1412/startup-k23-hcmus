"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockUserProfile, UserProfile } from "@/lib/mock-account-data";

export function ProfileOverview() {
  const [user, setUser] = useState<UserProfile>(mockUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    phone: user.phone,
    bio: user.bio,
  });
  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUser((prev) => ({
      ...prev,
      fullName: formData.fullName,
      phone: formData.phone,
      bio: formData.bio,
    }));
    setIsEditing(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const getKycBadge = (status: UserProfile['kycStatus']) => {
    switch (status) {
      case 'approved':
        return <Badge tone="gold">Đã xác thực KYC (Pro)</Badge>;
      case 'pending':
        return <Badge tone="gold">Đang chờ admin duyệt KYC</Badge>;
      case 'rejected':
        return <Badge tone="destructive">KYC Bị từ chối</Badge>;
      default:
        return <Badge tone="muted">Chưa xác thực KYC</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-vanguard-primary/40 bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="font-display text-2xl font-bold">{user.fullName}</h2>
                {getKycBadge(user.kycStatus)}
              </div>
              <p className="text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-0.5">
                {user.email} • Tham gia từ {user.createdAt}
              </p>
              <p className="text-xs text-vanguard-primary mt-1">CCCD: {user.cccd || "Chưa cập nhật"}</p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:border-vanguard-primary transition"
          >
            {isEditing ? "Hủy bỏ" : "Chỉnh sửa hồ sơ"}
          </button>
        </div>

        {savedMsg && (
          <div className="mt-4 rounded-v-sm bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-xs text-emerald-500 font-semibold">
            ✓ Đã lưu thay đổi thông tin cá nhân thành công!
          </div>
        )}

        {/* Profile Info Form / View */}
        {isEditing ? (
          <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-vanguard-light-border dark:border-vanguard-dark-border pt-6">
            <div>
              <label className="block text-xs font-semibold mb-1">Họ và tên</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Giới thiệu bản thân (Bio)</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="submit"
                className="rounded-v-sm bg-vanguard-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
              >
                Lưu thông tin
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 border-t border-vanguard-light-border dark:border-vanguard-dark-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Số điện thoại</span>
              <p className="font-semibold mt-0.5">{user.phone}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Giới thiệu</span>
              <p className="font-semibold mt-0.5">{user.bio || "Chưa có lời giới thiệu"}</p>
            </div>
          </div>
        )}
      </Card>

      {/* KYC Card Notice */}
      <Card className="p-6 border-l-4 border-l-vanguard-primary">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold">Xác thực tài khoản (KYC Identity Verification)</h3>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
              Xác thực CCCD chính chủ giúp nâng hạn mức tín dụng thuê gear không cần cọc tiền mặt tại Mutux.
            </p>
          </div>
          {user.kycStatus === 'approved' ? (
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-v-sm border border-emerald-500/20">
              ✓ Đã xác thực thành công
            </span>
          ) : (
            <button className="rounded-v-sm bg-vanguard-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition whitespace-nowrap">
              Gửi hồ sơ KYC
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
