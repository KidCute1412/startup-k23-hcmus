"use client";

import { CheckCircle, ChevronRight, ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/field";

const CATEGORIES = [
  { id: "keyboards", name: "Bàn phím chế tác" },
  { id: "mice", name: "Chuột quý tộc" },
  { id: "audio", name: "Âm thanh hi-end" },
  { id: "setups", name: "Thiết lập không gian" },
];

const CONDITION_OPTIONS = [
  "Like new, đã kiểm định",
  "Xuất sắc, chỉ dùng văn phòng",
  "Rất tốt, pad mới vệ sinh",
  "Tốt, đã hấp vệ sinh",
  "Khá tốt, có vết dùng nhỏ",
];

type SpecRow = { label: string; value: string };

const defaultSpec: SpecRow = { label: "", value: "" };

type Step = "info" | "pricing" | "specs" | "preview";
const STEPS: { key: Step; label: string }[] = [
  { key: "info", label: "Thông tin" },
  { key: "pricing", label: "Giá & Cọc" },
  { key: "specs", label: "Thông số" },
  { key: "preview", label: "Xem trước" },
];

export function AddGearForm() {
  const router = useRouter();

  // Multi-step state
  const [step, setStep] = useState<Step>("info");
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  // Form fields
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("keyboards");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState(CONDITION_OPTIONS[0]);
  const [badge, setBadge] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [dailyPrice, setDailyPrice] = useState("");
  const [depositCash, setDepositCash] = useState("");
  const [creditLine, setCreditLine] = useState("");
  const [specs, setSpecs] = useState<SpecRow[]>([{ ...defaultSpec }]);
  const [submitted, setSubmitted] = useState(false);

  const categoryName =
    CATEGORIES.find((c) => c.id === categoryId)?.name ?? "";

  // Spec helpers
  function updateSpec(i: number, field: keyof SpecRow, value: string) {
    setSpecs((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)),
    );
  }
  function addSpec() {
    setSpecs((prev) => [...prev, { ...defaultSpec }]);
  }
  function removeSpec(i: number) {
    setSpecs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-lg px-8 py-14 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-vanguard-primary/10">
          <CheckCircle size={40} className="text-vanguard-primary" />
        </div>
        <h2 className="mt-6 font-display text-2xl font-bold">Đã gửi duyệt!</h2>
        <p className="mt-3 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
          Gear <span className="font-semibold text-vanguard-primary">{name}</span> đã được gửi
          cho đội kiểm duyệt Mutux. Bạn sẽ nhận thông báo trong vòng 24h.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => router.push("/lender/gears")}>
            Về trang quản lý
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setStep("info");
              setName(""); setCategoryId("keyboards"); setShortDesc("");
              setDescription(""); setCondition(CONDITION_OPTIONS[0]);
              setBadge(""); setImageUrl(""); setDailyPrice("");
              setDepositCash(""); setCreditLine("");
              setSpecs([{ ...defaultSpec }]);
            }}
          >
            Thêm gear khác
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Main form */}
      <Card className="overflow-hidden">
        {/* Step header */}
        <div className="border-b border-vanguard-light-border bg-vanguard-light-surfDim px-6 py-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim">
          <ol className="flex items-center gap-0">
            {STEPS.map((s, i) => {
              const done = i < stepIndex;
              const current = s.key === step;
              return (
                <li key={s.key} className="flex flex-1 items-center">
                  <button
                    type="button"
                    id={`step-${s.key}`}
                    onClick={() => done && setStep(s.key)}
                    className={`flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      current
                        ? "text-vanguard-primary"
                        : done
                        ? "cursor-pointer text-vanguard-primary/60 hover:text-vanguard-primary"
                        : "text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"
                    }`}
                  >
                    <span
                      className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors ${
                        current
                          ? "bg-vanguard-primary text-vanguard-dark-bg"
                          : done
                          ? "bg-vanguard-primary/20 text-vanguard-primary"
                          : "bg-vanguard-light-surfBright text-vanguard-light-textMuted dark:bg-vanguard-dark-surfBright dark:text-vanguard-dark-textMuted"
                      }`}
                    >
                      {done ? <CheckCircle size={12} /> : i + 1}
                    </span>
                    <span className="hidden sm:block">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight
                      size={14}
                      className="mx-2 shrink-0 text-vanguard-light-border dark:text-vanguard-dark-border"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="px-6 py-8">
          {/* STEP 1: Info */}
          {step === "info" && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-bold">
                Thông tin cơ bản
              </h2>

              <div className="space-y-1.5">
                <label htmlFor="gear-name" className="field-label">
                  Tên gear <span className="text-red-500">*</span>
                </label>
                <Input
                  id="gear-name"
                  placeholder="VD: Vanguard Apex Pro 75%"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="gear-category" className="field-label">
                    Danh mục <span className="text-red-500">*</span>
                  </label>
                  <Select
                    id="gear-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="gear-badge" className="field-label">
                    Badge (tuỳ chọn)
                  </label>
                  <Input
                    id="gear-badge"
                    placeholder="VD: Bespoke, Royal Tier…"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="gear-short-desc" className="field-label">
                  Mô tả ngắn <span className="text-red-500">*</span>
                </label>
                <Input
                  id="gear-short-desc"
                  placeholder="1–2 câu mô tả nổi bật nhất"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="gear-desc" className="field-label">
                  Mô tả chi tiết
                </label>
                <Textarea
                  id="gear-desc"
                  placeholder="Mô tả tình trạng, lịch sử sử dụng, phụ kiện kèm theo…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="gear-condition" className="field-label">
                  Tình trạng <span className="text-red-500">*</span>
                </label>
                <Select
                  id="gear-condition"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full"
                >
                  {CONDITION_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="gear-image" className="field-label">
                  URL ảnh đại diện
                </label>
                <Input
                  id="gear-image"
                  type="url"
                  placeholder="https://…"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div className="relative mt-2 aspect-video w-full max-w-sm overflow-hidden rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  id="step-info-next"
                  onClick={() => setStep("pricing")}
                  disabled={!name || !shortDesc}
                >
                  Tiếp theo
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Pricing */}
          {step === "pricing" && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-bold">Giá & Cọc</h2>

              <div className="rounded-v-sm border border-vanguard-primary/20 bg-vanguard-primary/5 p-4 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                <p>
                  💡 Giá thuê và mức cọc cần phù hợp với giá trị thực tế của
                  gear. Đội Mutux sẽ kiểm tra trong bước duyệt.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label htmlFor="daily-price" className="field-label">
                    Giá / ngày (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="daily-price"
                    type="number"
                    min={0}
                    placeholder="65000"
                    value={dailyPrice}
                    onChange={(e) => setDailyPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="deposit-cash" className="field-label">
                    Tiền cọc (VNĐ) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="deposit-cash"
                    type="number"
                    min={0}
                    placeholder="1800000"
                    value={depositCash}
                    onChange={(e) => setDepositCash(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="credit-line" className="field-label">
                    Credit line tối thiểu
                  </label>
                  <Input
                    id="credit-line"
                    type="number"
                    min={0}
                    placeholder="4200000"
                    value={creditLine}
                    onChange={(e) => setCreditLine(e.target.value)}
                  />
                </div>
              </div>

              {dailyPrice && depositCash && (
                <div className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-surfDim p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surfDim">
                  <p className="font-display text-xs font-bold uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                    Ước tính doanh thu
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-4 text-center">
                    {[
                      { days: 3, label: "3 ngày" },
                      { days: 7, label: "1 tuần" },
                      { days: 30, label: "1 tháng" },
                    ].map(({ days, label }) => (
                      <div key={days}>
                        <p className="text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                          {label}
                        </p>
                        <p className="mt-1 font-display text-base font-bold text-vanguard-primary">
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                            maximumFractionDigits: 0,
                          }).format(Number(dailyPrice) * days)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("info")}>
                  Quay lại
                </Button>
                <Button
                  id="step-pricing-next"
                  onClick={() => setStep("specs")}
                  disabled={!dailyPrice || !depositCash}
                >
                  Tiếp theo
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Specs */}
          {step === "specs" && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-bold">
                Thông số kỹ thuật
              </h2>

              <div className="space-y-3">
                {specs.map((row, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Input
                      placeholder="Thuộc tính (VD: Sensor)"
                      value={row.label}
                      onChange={(e) => updateSpec(i, "label", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Giá trị (VD: 30K DPI 8K polling)"
                      value={row.value}
                      onChange={(e) => updateSpec(i, "value", e.target.value)}
                      className="flex-[2]"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(i)}
                      className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-v-sm border border-vanguard-light-border text-vanguard-light-textMuted transition hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 dark:border-vanguard-dark-border dark:text-vanguard-dark-textMuted"
                      aria-label="Xóa dòng"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                id="add-spec-row"
                onClick={addSpec}
                className="inline-flex items-center gap-2 text-sm text-vanguard-primary hover:underline"
              >
                <Plus size={14} />
                Thêm thông số
              </button>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("pricing")}>
                  Quay lại
                </Button>
                <Button id="step-specs-next" onClick={() => setStep("preview")}>
                  Xem trước
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Preview */}
          {step === "preview" && (
            <div className="space-y-6">
              <h2 className="font-display text-lg font-bold">Xem trước</h2>

              {/* Preview card */}
              <div className="overflow-hidden rounded-v-sm border border-vanguard-light-border dark:border-vanguard-dark-border">
                <div className="relative aspect-video bg-vanguard-light-surfDim dark:bg-vanguard-dark-surfBright">
                  {badge && (
                    <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-v-sm bg-vanguard-primary px-3 py-1 font-display text-[10px] font-bold uppercase tracking-widest text-vanguard-dark-bg">
                      {badge}
                    </span>
                  )}
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      <ImageIcon size={32} />
                      <p className="text-xs">Chưa có ảnh</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      {categoryName}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold">
                      {name || "Tên gear"}
                    </h3>
                    <p className="mt-1 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                      {shortDesc || "Mô tả ngắn"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-vanguard-light-border pt-4 text-xs dark:border-vanguard-dark-border">
                    <div>
                      <p className="uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                        Giá thuê
                      </p>
                      <p className="mt-1 font-display text-lg font-bold text-vanguard-primary">
                        {dailyPrice
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              maximumFractionDigits: 0,
                            }).format(Number(dailyPrice))
                          : "—"}
                        <span className="text-xs font-normal">/ngày</span>
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                        Tiền cọc
                      </p>
                      <p className="mt-1 font-display text-lg font-bold">
                        {depositCash
                          ? new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              maximumFractionDigits: 0,
                            }).format(Number(depositCash))
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {specs.some((s) => s.label || s.value) && (
                    <table className="w-full border-collapse border-t border-vanguard-light-border text-xs dark:border-vanguard-dark-border">
                      <tbody>
                        {specs
                          .filter((s) => s.label || s.value)
                          .map((s, i) => (
                            <tr
                              key={i}
                              className="border-b border-vanguard-light-border last:border-0 dark:border-vanguard-dark-border"
                            >
                              <td className="py-2 pr-4 font-semibold uppercase tracking-wide text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                                {s.label}
                              </td>
                              <td className="py-2">{s.value}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={() => setStep("specs")}>
                  Quay lại
                </Button>
                <Button
                  id="submit-gear-btn"
                  onClick={handleSubmit}
                >
                  Gửi duyệt & Đăng
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sidebar tips */}
      <div className="space-y-4">
        <Card className="p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">
            Tips cho listing tốt
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            {[
              "Ảnh chụp rõ ràng, nền trắng hoặc bàn gỗ tối sẽ được duyệt nhanh hơn.",
              "Mô tả tình trạng thực tế, bao gồm vết xước (nếu có) để tránh tranh chấp.",
              "Giá thuê hợp lý bằng 1–2% giá bán lẻ mỗi ngày giúp tăng booking.",
              "Phản hồi nhanh trong 2h đầu sẽ cải thiện thứ hạng hiển thị.",
            ].map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-vanguard-primary">✦</span>
                {tip}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="font-display text-sm font-bold uppercase tracking-widest">
            Quy trình duyệt
          </h3>
          <ol className="mt-4 space-y-3">
            {[
              "Gửi listing",
              "Mutux kiểm tra trong 24h",
              "Listing được kích hoạt",
              "Nhận đơn & xác nhận thuê",
            ].map((step, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-vanguard-primary/10 font-display text-[10px] font-bold text-vanguard-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
