"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockUserAddresses, UserAddress } from "@/lib/mock-account-data";

export function AddressList() {
  const [addresses, setAddresses] = useState<UserAddress[]>(mockUserAddresses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<UserAddress | null>(null);

  const [form, setForm] = useState({
    receiverName: "",
    phone: "",
    detailAddress: "",
    ward: "",
    district: "",
    province: "TP. Hồ Chí Minh",
    isDefault: false,
  });

  const openAddModal = () => {
    setEditingAddr(null);
    setForm({
      receiverName: "",
      phone: "",
      detailAddress: "",
      ward: "",
      district: "",
      province: "TP. Hồ Chí Minh",
      isDefault: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (addr: UserAddress) => {
    setEditingAddr(addr);
    setForm({
      receiverName: addr.receiverName,
      phone: addr.phone,
      detailAddress: addr.detailAddress,
      ward: addr.ward,
      district: addr.district,
      province: addr.province,
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddr) {
      // Edit existing
      setAddresses((prev) =>
        prev.map((item) => {
          if (item.id === editingAddr.id) {
            return { ...item, ...form };
          }
          if (form.isDefault) {
            return { ...item, isDefault: false };
          }
          return item;
        })
      );
    } else {
      // Add new
      const newAddr: UserAddress = {
        id: `addr-${Date.now()}`,
        ...form,
      };
      setAddresses((prev) => {
        const updated = form.isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : [...prev];
        return [...updated, newAddr];
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSetDefault = (id: string) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }))
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl font-bold">Sổ địa chỉ nhận hàng</h3>
          <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
            Quản lý các địa chỉ giao nhận thiết bị cho các đơn thuê của bạn.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="rounded-v-sm bg-vanguard-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
        >
          + Thêm địa chỉ mới
        </button>
      </div>

      <div className="space-y-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-4 rounded-v-sm border transition ${
              addr.isDefault
                ? "border-vanguard-primary bg-vanguard-primary/5"
                : "border-vanguard-light-border dark:border-vanguard-dark-border bg-vanguard-light-surfDim/50 dark:bg-vanguard-dark-surfDim/50"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-sm">{addr.receiverName}</span>
                  <span className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">| {addr.phone}</span>
                  {addr.isDefault && <Badge tone="gold">Mặc định</Badge>}
                </div>
                <p className="text-sm mt-2 text-vanguard-light-text dark:text-vanguard-dark-text">
                  {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.province}
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-vanguard-primary hover:underline font-semibold"
                  >
                    Thiết lập mặc định
                  </button>
                )}
                <button
                  onClick={() => openEditModal(addr)}
                  className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted hover:text-vanguard-primary font-semibold"
                >
                  Sửa
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-red-500 hover:underline font-semibold"
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <p className="text-center text-sm py-8 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Bạn chưa lưu địa chỉ giao hàng nào. Bấm nút phía trên để thêm địa chỉ đầu tiên.
          </p>
        )}
      </div>

      {/* Address Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-v-lg border border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf p-6 shadow-2xl">
            <h4 className="font-display text-xl font-bold mb-4">
              {editingAddr ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ giao hàng mới"}
            </h4>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Tên người nhận</label>
                  <input
                    type="text"
                    required
                    value={form.receiverName}
                    onChange={(e) => setForm({ ...form, receiverName: e.target.value })}
                    className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Địa chỉ chi tiết (Số nhà, Tên đường)</label>
                <input
                  type="text"
                  required
                  value={form.detailAddress}
                  onChange={(e) => setForm({ ...form, detailAddress: e.target.value })}
                  className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Phường / Xã</label>
                  <input
                    type="text"
                    required
                    value={form.ward}
                    onChange={(e) => setForm({ ...form, ward: e.target.value })}
                    className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Quận / Huyện</label>
                  <input
                    type="text"
                    required
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    required
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surf px-3 py-2 text-sm text-vanguard-light-text outline-none focus:border-vanguard-primary dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim dark:text-vanguard-dark-text"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefaultCheck"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="rounded border-vanguard-light-border dark:border-vanguard-dark-border accent-vanguard-primary"
                />
                <label htmlFor="isDefaultCheck" className="text-xs font-semibold cursor-pointer">
                  Đặt làm địa chỉ giao hàng mặc định
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-vanguard-light-border dark:border-vanguard-dark-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-v-sm bg-vanguard-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-vanguard-dark-bg hover:opacity-90 transition"
                >
                  Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
