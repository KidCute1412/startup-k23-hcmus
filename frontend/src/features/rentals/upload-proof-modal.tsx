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
  onSubmitProof?: (fileUrls: string[], note?: string) => Promise<unknown>;
  title?: string;
  description?: string;
  submitLabel?: string;
}

export const PROOF_STAGE_LABELS: Record<ProofStage, { title: string; desc: string }> = {
  pre_shipment: {
    title: "Ảnh trước khi giao gear",
    desc: "Chủ gear chụp ngoại hình và phụ kiện của thiết bị trước khi đóng gói gửi đi.",
  },
  post_received: {
    title: "Ảnh sau khi nhận gear",
    desc: "Người thuê chụp lại tình trạng gear ngay sau khi mở gói hàng.",
  },
  pre_return: {
    title: "Ảnh trước khi trả gear",
    desc: "Người thuê chụp ngoại hình và đóng gói thiết bị trước khi gửi trả lại chủ gear.",
  },
  post_returned: {
    title: "Ảnh sau khi nhận lại gear",
    desc: "Chủ gear chụp ngoại hình thiết bị khi đã nhận lại từ shipper/người thuê.",
  },
};

export function UploadProofModal({
  isOpen,
  onClose,
  orderId,
  allowedStages = ["pre_shipment", "post_received", "pre_return", "post_returned"],
  onSuccess,
  onSubmitProof,
  title,
  description,
  submitLabel = "Tải lên minh chứng",
}: UploadProofModalProps) {
  const { uploadProofBatch } = useRentalProof(orderId);
  const { uploadImage } = useMedia();
  const [stage, setStage] = useState<ProofStage>(allowedStages[0] ?? "pre_shipment");
  const [note, setNote] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (selectedFiles.length + files.length > 10) {
      setErrorMessage("Mỗi giai đoạn được đính kèm tối đa 10 ảnh.");
      return;
    }
    const oversized = files.find((file) => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setErrorMessage("Mỗi ảnh minh chứng không được vượt quá 5MB.");
      return;
    }
    setErrorMessage(null);
    const nextFiles = [...selectedFiles, ...files];
    setSelectedFiles(nextFiles);
    setPreviewUrls(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const removeFile = (index: number) => {
    const nextFiles = selectedFiles.filter((_, fileIndex) => fileIndex !== index);
    setSelectedFiles(nextFiles);
    setPreviewUrls(nextFiles.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedFiles.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất 1 ảnh minh chứng.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload media image to get local path
      const fileUrls = await Promise.all(selectedFiles.map((file) => uploadImage(file)));
      const trimmedNote = note.trim() || undefined;
      if (onSubmitProof) {
        await onSubmitProof(fileUrls, trimmedNote);
      } else {
        await uploadProofBatch({ stage, fileUrls, note: trimmedNote });
      }

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
            {title ?? "Tải Lên Bằng Chứng Bàn Giao"}
          </h2>
        </div>

        {description && (
          <p className="mb-4 text-xs leading-relaxed text-vanguard-dark-textMuted">
            {description}
          </p>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stage selection is unnecessary when the action has one fixed stage. */}
          {allowedStages.length > 1 ? (
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
                  {PROOF_STAGE_LABELS[stg].title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-vanguard-dark-textMuted">
                {PROOF_STAGE_LABELS[stage]?.desc}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-vanguard-primary/30 bg-vanguard-primary/5 p-3">
              <p className="text-xs font-bold text-vanguard-primary">
                {PROOF_STAGE_LABELS[stage]?.title}
              </p>
              <p className="mt-1 text-[11px] text-vanguard-dark-textMuted">
                {PROOF_STAGE_LABELS[stage]?.desc}
              </p>
            </div>
          )}

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

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {previewUrls.map((previewUrl, index) => (
                <div key={`${previewUrl}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-vanguard-primary/40 bg-black/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt={`Proof preview ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white hover:bg-red-700 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {previewUrls.length < 10 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-vanguard-dark-border bg-vanguard-dark-bg hover:border-vanguard-primary transition">
                <Upload className="h-6 w-6 text-vanguard-primary mb-2" />
                <span className="text-center text-xs font-semibold text-vanguard-dark-text">Chọn thêm ảnh</span>
                <span className="text-[10px] text-vanguard-dark-textMuted mt-1">Định dạng JPG, PNG, WEBP tối đa 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              )}
            </div>
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
               disabled={isSubmitting || selectedFiles.length === 0}
              className="flex items-center space-x-2 rounded-lg bg-vanguard-primary px-5 py-2 text-xs font-bold uppercase text-vanguard-dark-bg hover:brightness-110 disabled:opacity-50 transition"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang tải lên...</span>
                </>
              ) : (
                 <span>{isSubmitting ? "Đang tải lên..." : submitLabel}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
