"use client";

import React, { useState } from "react";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { useMedia } from "@/hooks/useMedia";
import { useRentalProof } from "@/hooks/useRentalProof";
import type { ProofStage } from "@/types/rentals";

interface UploadProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  allowedStages?: ProofStage[];
  onSuccess: () => void;
}

const STAGE_LABELS: Record<ProofStage, { title: string; desc: string }> = {
  pre_shipment: {
    title: "Minh chứng trước khi giao (Pre-shipment)",
    desc: "Chủ gear chụp ngoại hình và phụ kiện của thiết bị trước khi đóng gói gửi đi.",
  },
  post_received: {
    title: "Minh chứng khi đã nhận (Post-received)",
    desc: "Người thuê chụp lại tình trạng gear ngay sau khi mở gói hàng.",
  },
  pre_return: {
    title: "Minh chứng trước khi gửi trả (Pre-return)",
    desc: "Người thuê chụp ngoại hình và đóng gói thiết bị trước khi gửi trả lại chủ gear.",
  },
  post_returned: {
    title: "Minh chứng sau khi nhận lại (Post-returned)",
    desc: "Chủ gear chụp ngoại hình thiết bị khi đã nhận lại từ shipper/người thuê.",
  },
};

export function UploadProofModal({
  isOpen,
  onClose,
  orderId,
  allowedStages = ["pre_shipment", "post_received", "pre_return", "post_returned"],
  onSuccess,
}: UploadProofModalProps) {
  const { uploadProof } = useRentalProof(orderId);
  const { uploadImage } = useMedia();
  const [stage, setStage] = useState<ProofStage>(allowedStages[0] ?? "pre_shipment");
  const [note, setNote] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Ảnh minh chứng không được vượt quá 5MB.");
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage("Vui lòng chọn 1 file ảnh minh chứng.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload media image to get local path
      const fileUrl = await uploadImage(selectedFile);

      // 2. Submit rental proof
      await uploadProof({
        stage,
        fileUrl,
        note: note.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message || "Tải lên minh chứng thất bại. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-xl border border-vanguard-primary/40 bg-vanguard-dark-surf p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute right-4 top-4 text-vanguard-dark-textMuted hover:text-vanguard-dark-text transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 text-vanguard-primary mb-4">
          <Camera className="h-6 w-6" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wider text-vanguard-dark-text">
            Tải Lên Bằng Chứng Bàn Giao
          </h2>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stage selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-vanguard-dark-textMuted mb-1.5">
              Giai đoạn kiểm định bàn giao <span className="text-vanguard-primary">*</span>
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as ProofStage)}
              className="w-full rounded-lg border border-vanguard-dark-border bg-vanguard-dark-bg p-2.5 text-xs font-semibold text-vanguard-dark-text focus:border-vanguard-primary focus:outline-none"
            >
              {allowedStages.map((stg) => (
                <option key={stg} value={stg}>
                  {STAGE_LABELS[stg].title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-vanguard-dark-textMuted">
              {STAGE_LABELS[stage]?.desc}
            </p>
          </div>

          {/* Note input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-vanguard-dark-textMuted mb-1.5">
              Ghi chú thêm (Tùy chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đầy đủ dây cáp, cáp phím không trầy xước..."
              className="w-full rounded-lg border border-vanguard-dark-border bg-vanguard-dark-bg p-2.5 text-xs text-vanguard-dark-text focus:border-vanguard-primary focus:outline-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-vanguard-dark-textMuted mb-1.5">
              Hình ảnh bàn giao <span className="text-vanguard-primary">*</span>
            </label>

            {previewUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-vanguard-primary/40 bg-black/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Proof preview" className="h-full w-full object-contain" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-vanguard-dark-border bg-vanguard-dark-bg hover:border-vanguard-primary transition">
                <Upload className="h-6 w-6 text-vanguard-primary mb-2" />
                <span className="text-xs font-semibold text-vanguard-dark-text">Bấm để chọn hoặc kéo thả ảnh minh chứng</span>
                <span className="text-[10px] text-vanguard-dark-textMuted mt-1">Định dạng JPG, PNG, WEBP tối đa 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-vanguard-dark-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-vanguard-dark-border px-4 py-2 text-xs font-bold uppercase text-vanguard-dark-textMuted hover:text-vanguard-dark-text transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="flex items-center space-x-2 rounded-lg bg-vanguard-primary px-5 py-2 text-xs font-bold uppercase text-vanguard-dark-bg hover:brightness-110 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                <span>Tải lên minh chứng</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
