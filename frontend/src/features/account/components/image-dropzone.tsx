"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";

interface ImageDropzoneProps {
  label: string;
  description?: string;
  currentImageUrl?: string | null;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  aspectRatio?: "square" | "landscape" | "portrait";
  required?: boolean;
}

export function ImageDropzone({
  label,
  description,
  currentImageUrl,
  selectedFile,
  onFileSelect,
  aspectRatio = "landscape",
  required = false,
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const previewUrl = selectedFile
    ? URL.createObjectURL(selectedFile)
    : currentImageUrl;

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước quá 5MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }
    onFileSelect(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const aspectClasses = {
    square: "aspect-square",
    landscape: "aspect-[1.586/1]", // Standard ID card ratio 85.6mm x 54mm
    portrait: "aspect-[3/4]",
  }[aspectRatio];

  return (
    <div className="space-y-2">
      {/* Label and Status Bar */}
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-vanguard-light-text dark:text-vanguard-dark-text">
          {label} {required && <span className="text-vanguard-primary">*</span>}
        </span>
        {selectedFile ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {(selectedFile.size / (1024 * 1024)).toFixed(1)}MB
          </span>
        ) : (
          <span className="rounded-full bg-vanguard-primary/10 px-2 py-0.5 text-[10px] font-medium text-vanguard-primary border border-vanguard-primary/30">
            Cần tải lên
          </span>
        )}
      </div>

      {description && (
        <p className="text-[11px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          {description}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Luxury Scanner Target Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-v-md border transition-all duration-300 ${aspectClasses} ${
          isDragging
            ? "border-vanguard-primary bg-vanguard-primary/15 shadow-royal scale-[1.02]"
            : previewUrl
              ? "border-vanguard-primary/50 bg-vanguard-dark-surfDim shadow-md"
              : "border-vanguard-light-border bg-vanguard-light-surf/50 hover:border-vanguard-primary/70 hover:bg-vanguard-primary/5 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf/50"
        }`}
      >
        {/* Scanner Corner Brackets (Vanguard Elite Framing) */}
        <div className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l-2 border-t-2 border-vanguard-primary/60 transition-all group-hover:left-1.5 group-hover:top-1.5 group-hover:border-vanguard-primary" />
        <div className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-vanguard-primary/60 transition-all group-hover:right-1.5 group-hover:top-1.5 group-hover:border-vanguard-primary" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b-2 border-l-2 border-vanguard-primary/60 transition-all group-hover:bottom-1.5 group-hover:left-1.5 group-hover:border-vanguard-primary" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b-2 border-r-2 border-vanguard-primary/60 transition-all group-hover:bottom-1.5 group-hover:right-1.5 group-hover:border-vanguard-primary" />

        {previewUrl ? (
          <>
            {/* Full-bleed Preview Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={label}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Dark Hover Control Bar */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/70 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewZoom(true);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:scale-110 hover:bg-white/40"
                  title="Xem phóng to"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-vanguard-primary text-vanguard-dark-bg transition hover:scale-110 hover:brightness-110 shadow-md"
                  title="Thay đổi ảnh"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600/80 text-white backdrop-blur-md transition hover:scale-110 hover:bg-red-600"
                    title="Xóa ảnh"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              <span className="rounded-full bg-vanguard-primary/90 px-3 py-0.5 text-[10px] font-bold text-vanguard-dark-bg">
                Đã chuẩn bị
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-center">
            {/* Camera / Scanner Frame Icon */}
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full border border-vanguard-primary/40 bg-vanguard-primary/10 text-vanguard-primary transition-transform duration-300 group-hover:scale-110 group-hover:border-vanguard-primary group-hover:bg-vanguard-primary/20">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
              Kéo thả hoặc{" "}
              <span className="text-vanguard-primary underline decoration-vanguard-primary/50 underline-offset-2">
                chọn ảnh
              </span>
            </p>
            <p className="mt-1 text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              JPG, PNG, WEBP &lt; 5MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-red-500">{error}</p>
      )}

      {/* Fullscreen Zoom Modal */}
      {previewZoom && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setPreviewZoom(false)}
        >
          <div className="relative max-h-[88vh] max-w-[88vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Phóng to tài liệu"
              className="max-h-[88vh] max-w-[88vw] rounded-v-md border-2 border-vanguard-primary object-contain shadow-royal"
            />
            <button
              type="button"
              onClick={() => setPreviewZoom(false)}
              className="absolute -right-4 -top-4 flex h-9 w-9 items-center justify-center rounded-full bg-vanguard-primary text-vanguard-dark-bg font-bold shadow-lg transition hover:scale-110 hover:brightness-110"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
