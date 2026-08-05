"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { resolveMediaUrl, type AccountUser, useAccount } from "@/hooks/useAccount";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

const inputClass = "w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2.5 text-sm outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim";

export function AdminProfile() {
  const { user: sessionUser, logout, changePassword: changeSessionPassword } = useAuth();
  const { user: accountUser, isLoading, updateProfile, uploadImage } = useAccount();
  const [profile, setProfile] = useState<AccountUser | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", bio: "", dob: "" });
  const [passwords, setPasswords] = useState({ old: "", next: "", confirm: "" });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!accountUser) return;
    setProfile(accountUser);
    setForm({ fullName: accountUser.fullName ?? "", phone: accountUser.phone ?? "", bio: accountUser.bio ?? "", dob: accountUser.dob ?? "" });
    setAvatarUrl(accountUser.avatarUrl);
  }, [accountUser]);

  const initials = useMemo(() => (profile?.fullName || profile?.email || sessionUser?.email || "A").slice(0, 1).toUpperCase(), [profile, sessionUser]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(null); setMessage(null);
    try {
      const updated = await updateProfile({ fullName: form.fullName, phone: form.phone || undefined, bio: form.bio, dob: form.dob || undefined });
      setProfile(updated); setMessage("Đã cập nhật hồ sơ admin.");
      localStorage.setItem("user", JSON.stringify(updated)); window.dispatchEvent(new Event("auth:changed"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể cập nhật hồ sơ."); }
    finally { setSaving(false); }
  };

  const uploadAvatar = async (file: File) => {
    setSaving(true); setError(null); setMessage(null);
    try {
      const upload = await uploadImage(file);
      const updated = await updateProfile({ avatarUrl: upload.url });
      setProfile(updated); setAvatarUrl(updated.avatarUrl); setMessage("Đã cập nhật ảnh đại diện.");
      localStorage.setItem("user", JSON.stringify(updated)); window.dispatchEvent(new Event("auth:changed"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể cập nhật ảnh đại diện."); }
    finally { setSaving(false); }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) { setError("Mật khẩu xác nhận không khớp."); return; }
    setChangingPassword(true); setError(null);
    try { await changeSessionPassword(passwords.old, passwords.next); await logout(); window.location.href = "/login"; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu."); setChangingPassword(false); }
  };

  if (isLoading || !profile) return <div className="p-8 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Đang tải hồ sơ...</div>;

  return <div className="mx-auto max-w-4xl space-y-6 p-6 sm:p-8">
    <div><p className="text-xs font-bold uppercase tracking-[0.25em] text-vanguard-primary">Administrator</p><h1 className="mt-2 font-display text-3xl font-bold">Hồ sơ cá nhân</h1><p className="mt-2 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">Quản lý thông tin tài khoản quản trị Mutux.</p></div>
    {message && <p className="rounded-v-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">{message}</p>}
    {error && <p className="rounded-v-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{error}</p>}
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <button type="button" onClick={() => fileRef.current?.click()} className="flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-vanguard-primary bg-vanguard-primary/10 text-2xl font-bold text-vanguard-primary">
          {resolveMediaUrl(avatarUrl) ? <Image src={resolveMediaUrl(avatarUrl) ?? ""} alt="Ảnh đại diện admin" width={80} height={80} className="size-full object-cover" /> : initials}
        </button>
        <div><h2 className="font-display text-xl font-bold">{profile.fullName || "Admin Mutux"}</h2><p className="text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{profile.email}</p><input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAvatar(file); }} /><button type="button" onClick={() => fileRef.current?.click()} className="mt-2 text-xs font-bold text-vanguard-primary">Đổi ảnh đại diện</button></div>
      </div>
      <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold">Họ và tên<input className={inputClass} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
        <label className="space-y-1 text-xs font-semibold">Email<input className={`${inputClass} opacity-60`} value={profile.email} readOnly /></label>
        <label className="space-y-1 text-xs font-semibold">Số điện thoại<input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label className="space-y-1 text-xs font-semibold">Ngày sinh<input type="date" className={inputClass} value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></label>
        <label className="space-y-1 text-xs font-semibold sm:col-span-2">Giới thiệu<textarea className={inputClass} rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
        <button disabled={saving} className="rounded-v-sm bg-vanguard-primary px-5 py-2.5 text-xs font-bold text-vanguard-dark-bg disabled:opacity-60 sm:col-span-2">{saving ? "Đang lưu..." : "Lưu thay đổi"}</button>
      </form>
    </Card>
    <Card className="p-6"><h2 className="font-display text-xl font-bold">Đổi mật khẩu</h2><form onSubmit={changePassword} className="mt-5 grid gap-4 sm:grid-cols-3"><input required type="password" placeholder="Mật khẩu hiện tại" className={inputClass} value={passwords.old} onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} /><input required minLength={8} type="password" placeholder="Mật khẩu mới" className={inputClass} value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} /><input required minLength={8} type="password" placeholder="Xác nhận mật khẩu mới" className={inputClass} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} /><button disabled={changingPassword} className="rounded-v-sm border border-vanguard-primary px-5 py-2.5 text-xs font-bold text-vanguard-primary disabled:opacity-60 sm:col-span-3">{changingPassword ? "Đang cập nhật..." : "Đổi mật khẩu"}</button></form></Card>
  </div>;
}
