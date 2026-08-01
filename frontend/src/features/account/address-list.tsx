"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type {
  AddressRequest,
  UserAddress,
} from "@/hooks/useAddresses";
import { useAddresses } from "@/hooks/useAddresses";

const emptyForm: AddressRequest = {
  receiverName: "",
  phone: "",
  detailAddress: "",
  ward: "",
  district: "",
  province: "TP. Hồ Chí Minh",
  isDefault: false,
};

const inputClass =
  "w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3.5 py-2.5 text-sm text-vanguard-light-text outline-none transition focus:border-vanguard-primary focus:ring-4 focus:ring-vanguard-primary/10 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text";

export function AddressList() {
  const {
    addresses,
    isLoading,
    isSaving,
    error,
    reload,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddresses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null,
  );
  const [form, setForm] = useState<AddressRequest>(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);

  const openAdd = () => {
    setEditingAddress(null);
    setForm({ ...emptyForm, isDefault: addresses.length === 0 });
    setLocalError(null);
    setIsModalOpen(true);
  };

  const openEdit = (address: UserAddress) => {
    setEditingAddress(address);
    setForm({
      receiverName: address.receiverName,
      phone: address.phone,
      detailAddress: address.detailAddress,
      ward: address.ward,
      district: address.district,
      province: address.province,
      isDefault: address.isDefault,
    });
    setLocalError(null);
    setIsModalOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError(null);
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, form);
      } else {
        await createAddress(form);
      }
      setIsModalOpen(false);
    } catch (cause) {
      setLocalError(
        cause instanceof Error ? cause.message : "Không thể lưu địa chỉ.",
      );
    }
  };

  const remove = async (address: UserAddress) => {
    if (
      !window.confirm(
        `Xóa địa chỉ giao hàng của ${address.receiverName}?${
          address.isDefault
            ? " Một địa chỉ khác sẽ được tự động chọn làm mặc định."
            : ""
        }`,
      )
    ) {
      return;
    }
    try {
      await deleteAddress(address.id);
    } catch {
      // Handled by hook
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-xl font-bold">
            Sổ địa chỉ nhận hàng
          </h3>
          <p className="mt-1 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Quản lý danh sách địa chỉ nhận và trả thiết bị gaming rental.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-v-sm bg-vanguard-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:brightness-110 shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm địa chỉ mới
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-v-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-400">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void reload()}
            className="shrink-0 font-bold underline"
          >
            Thử lại
          </button>
        </div>
      )}

      <div className="mt-6 space-y-4" aria-busy={isLoading || isSaving}>
        {isLoading ? (
          <>
            <div className="h-28 animate-pulse rounded-v-sm bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim" />
            <div className="h-28 animate-pulse rounded-v-sm bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfDim" />
          </>
        ) : (
          addresses.map((address) => (
            <article
              key={address.id}
              className={`group relative rounded-v-sm border p-5 transition-all ${
                address.isDefault
                  ? "border-vanguard-primary bg-vanguard-primary/5 shadow-md shadow-vanguard-primary/5"
                  : "border-vanguard-light-border bg-vanguard-light-surfDim/50 hover:border-vanguard-primary/50 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim/50"
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display font-bold text-base text-vanguard-light-text dark:text-vanguard-dark-text">
                      {address.receiverName}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      <svg className="h-3.5 w-3.5 text-vanguard-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {address.phone}
                    </span>
                    {address.isDefault && (
                      <Badge tone="gold" className="flex items-center gap-1">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                  <p className="flex items-start gap-1.5 text-xs leading-6 text-vanguard-light-text dark:text-vanguard-dark-text">
                    <svg className="h-4 w-4 shrink-0 text-vanguard-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      {address.detailAddress}, {address.ward},{" "}
                      {address.district}, {address.province}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs shrink-0 border-t border-vanguard-light-border/60 pt-3 dark:border-vanguard-dark-border/60 sm:border-0 sm:pt-0">
                  {!address.isDefault && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        void setDefaultAddress(address.id).catch(() => undefined)
                      }
                      className="font-bold text-vanguard-primary hover:underline disabled:opacity-50"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => openEdit(address)}
                    className="flex items-center gap-1 font-semibold text-vanguard-light-textMuted hover:text-vanguard-primary disabled:opacity-50 dark:text-vanguard-dark-textMuted"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sửa
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void remove(address)}
                    className="flex items-center gap-1 font-semibold text-red-500 hover:underline disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Xóa
                  </button>
                </div>
              </div>
            </article>
          ))
        )}

        {!isLoading && addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-v-sm border border-dashed border-vanguard-light-border px-6 py-12 text-center dark:border-vanguard-dark-border">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-vanguard-primary/10 text-vanguard-primary">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-bold text-sm">Chưa có địa chỉ giao hàng nào</p>
            <p className="mt-1 max-w-sm text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Thêm địa chỉ giao nhận để quy trình tạo đơn thuê thiết bị diễn ra nhanh chóng hơn.
            </p>
            <button
              type="button"
              onClick={openAdd}
              className="mt-4 rounded-v-sm bg-vanguard-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg"
            >
              + Thêm địa chỉ ngay
            </button>
          </div>
        )}
      </div>

      {/* Address Form Dialog */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={
            editingAddress ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ giao hàng"
          }
        >
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-v-md border border-vanguard-primary/40 bg-vanguard-light-surf p-6 shadow-2xl dark:border-vanguard-primary/40 dark:bg-vanguard-dark-surf sm:p-7">
            <div className="mb-5 flex items-center justify-between border-b border-vanguard-light-border pb-4 dark:border-vanguard-dark-border">
              <h3 className="font-display text-xl font-bold">
                {editingAddress
                  ? "Chỉnh Sửa Địa Chỉ Giao Hàng"
                  : "Thêm Địa Chỉ Giao Hàng Mới"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-vanguard-light-textMuted hover:bg-vanguard-primary/10 hover:text-vanguard-primary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <AddressField
                  label="Tên người nhận"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={form.receiverName}
                  onChange={(value) =>
                    setForm({ ...form, receiverName: value })
                  }
                />
                <AddressField
                  label="Số điện thoại"
                  required
                  placeholder="Ví dụ: 0901234567"
                  value={form.phone}
                  inputMode="tel"
                  pattern="\+?[0-9]{9,15}"
                  onChange={(value) => setForm({ ...form, phone: value })}
                />
              </div>

              <AddressField
                label="Địa chỉ chi tiết (Số nhà, đường)"
                required
                placeholder="Ví dụ: 225 Nguyễn Văn Cừ"
                value={form.detailAddress}
                onChange={(value) =>
                  setForm({ ...form, detailAddress: value })
                }
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <AddressField
                  label="Phường / Xã"
                  required
                  placeholder="Ví dụ: Phường 4"
                  value={form.ward}
                  onChange={(value) => setForm({ ...form, ward: value })}
                />
                <AddressField
                  label="Quận / Huyện"
                  required
                  placeholder="Ví dụ: Quận 5"
                  value={form.district}
                  onChange={(value) => setForm({ ...form, district: value })}
                />
                <AddressField
                  label="Tỉnh / Thành phố"
                  required
                  placeholder="Ví dụ: TP. Hồ Chí Minh"
                  value={form.province}
                  onChange={(value) => setForm({ ...form, province: value })}
                />
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold pt-1">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    setForm({ ...form, isDefault: event.target.checked })
                  }
                  className="h-4 w-4 rounded border-vanguard-light-border text-vanguard-primary focus:ring-vanguard-primary accent-vanguard-primary"
                />
                <span>Đặt làm địa chỉ giao nhận mặc định</span>
              </label>

              {localError && (
                <p className="rounded-v-sm border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-600 dark:text-red-400">
                  {localError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-vanguard-light-border pt-4 dark:border-vanguard-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-v-sm border border-vanguard-light-border px-4 py-2 text-xs font-semibold uppercase dark:border-vanguard-dark-border"
                >
                  Hủy
                </button>
                <button
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-v-sm bg-vanguard-primary px-6 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg transition hover:brightness-110 disabled:opacity-60"
                >
                  {isSaving ? "Đang lưu..." : "Lưu địa chỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}

function AddressField({
  label,
  value,
  onChange,
  inputMode,
  pattern,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "text" | "tel";
  pattern?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        required={required}
        maxLength={500}
        inputMode={inputMode}
        pattern={pattern}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}
