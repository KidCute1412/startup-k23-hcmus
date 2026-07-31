"use client";

import React, { useState } from "react";
import { AlertTriangle, Upload, X, Loader2 } from "lucide-react";
import { useDispute } from "@/hooks/useDispute";
import type { DisputeReason } from "@/types/dispute";

interface SubmitDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderCode?: string;
  onSuccess: () => void;
}

const REASON_OPTIONS: Array<{ value: DisputeReason; label: string }> = [
  { value: "device_damaged", label: "Thiết bị bị hư hỏng / nứt vỡ" },
  { value: "missing_accessory", label: "Thiếu phụ kiện" },
  { value: "device_faulty", label: "Thiết bị bị lỗi / không hoạt động" },
  { value: "device_not_as_described", label: "Thiết bị không đúng mô tả" },
  { value: "component_replaced", label: "Linh kiện bị tráo / thay thế" },
  { value: "other", label: "Lý do khác" },
];

export function SubmitDisputeModal({
  isOpen,
  onClose,
  orderId,
  orderCode,
  onSuccess,
}: SubmitDisputeModalProps) {
  const { createDispute, uploadMedia } = useDispute();
  const [reason, setReason] = useState<DisputeReason>("device_damaged");
  const [description, setDescription] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    
    if (selectedFiles.length + filesArray.length > 5) {
      setErrorMessage("Bạn chỉ được đính kèm tối đa 5 hình ảnh bằng chứng.");
      return;
    }
    setErrorMessage(null);

    const newFiles = [...selectedFiles, ...filesArray].slice(0, 5);
    setSelectedFiles(newFiles);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setPreviews(updatedFiles.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!description.trim()) {
      setErrorMessage("Vui lòng nhập mô tả chi tiết về sự cố.");
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMessage("Vui lòng tải lên ít nhất 1 hình ảnh làm bằng chứng.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload evidence images
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const url = await uploadMedia(file);
        uploadedUrls.push(url);
      }

      // 2. Submit dispute API
      await createDispute({
        rentalOrderId: orderId,
        reason,
        description: description.trim(),
        evidences: uploadedUrls.map((url) => ({
          mediaType: "image",
          url,
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message || "Gửi khiếu nại thất bại. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-red-500/30 bg-vanguard-dark-card p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 text-red-400 mb-4">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wider text-white">
            Báo cáo khiếu nại đơn thuê
          </h2>
        </div>

        {orderCode && (
          <p className="text-xs text-gray-400 mb-4">
            Đơn hàng: <span className="font-mono font-bold text-vanguard-primary">{orderCode}</span>
          </p>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              Lý do khiếu nại <span className="text-red-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as DisputeReason)}
              className="w-full rounded-lg border border-gray-700 bg-vanguard-dark-bg p-2.5 text-sm text-white focus:border-vanguard-primary focus:outline-none"
            >
              {REASON_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              Mô tả chi tiết sự cố <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể tình trạng hư hỏng, thiếu phụ kiện hoặc lý do bạn gửi khiếu nại..."
              className="w-full rounded-lg border border-gray-700 bg-vanguard-dark-bg p-2.5 text-sm text-white placeholder-gray-500 focus:border-vanguard-primary focus:outline-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
              Hình ảnh bằng chứng (1 - 5 ảnh) <span className="text-red-400">*</span>
            </label>

            {/* Previews */}
            <div className="mb-3 grid grid-cols-5 gap-2">
              {previews.map((src, index) => (
                <div key={index} className="relative aspect-square overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute right-1 top-1 rounded-full bg-red-600 p-0.5 text-white hover:bg-red-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {previews.length < 5 && (
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-600 bg-vanguard-dark-bg hover:border-vanguard-primary transition">
                  <Upload className="h-4 w-4 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-400">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end space-x-3 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-700 px-4 py-2 text-xs font-bold uppercase text-gray-300 hover:bg-gray-800 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 rounded-lg bg-red-600 px-5 py-2 text-xs font-bold uppercase text-white hover:bg-red-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi khiếu nại</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
