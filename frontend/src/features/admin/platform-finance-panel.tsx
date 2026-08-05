"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { usePlatformFinance } from "@/hooks/usePlatformFinance";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AdminPagination } from "@/components/ui/admin-pagination";
import { CustomSelect } from "@/components/ui/custom-select";


import {
  Lock,
  Coins,
  TrendingUp,
  Percent,
  ArrowRight,
  ShieldCheck,
  Building,
  Info,
  DollarSign,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wallet
} from "lucide-react";


export function PlatformFinancePanel() {
  const {
    overview,
    rateBps,
    loading,
    error,
    updateRate,
    fetchRentalSettlements,
    fetchRevenueTransactions,
    fetchLenderPayableTransactions,
    fetchEscrowHistory
  } = usePlatformFinance();

  const [rate, setRate] = useState<string>(String(rateBps / 100));
  const [tempRate, setTempRate] = useState<string>("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Tab and detailed history list states
  const [activeTab, setActiveTab] = useState<'rental-settlements' | 'revenue-transactions' | 'lender-payable-transactions' | 'escrow-history'>('rental-settlements');
  const [detailPage, setDetailPage] = useState(1);
  const [detailLimit] = useState(10);
  const [detailTotal, setDetailTotal] = useState(0);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Filter states
  const [settlementStatus, setSettlementStatus] = useState<string>('all');
  const [payableType, setPayableType] = useState<string>('all');
  const [escrowStatus, setEscrowStatus] = useState<string>('all');

  const fetchDetails = useCallback(async () => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      let response;
      if (activeTab === 'rental-settlements') {
        response = await fetchRentalSettlements(detailPage, detailLimit, settlementStatus);
      } else if (activeTab === 'revenue-transactions') {
        response = await fetchRevenueTransactions(detailPage, detailLimit);
      } else if (activeTab === 'lender-payable-transactions') {
        response = await fetchLenderPayableTransactions(detailPage, detailLimit, payableType);
      } else if (activeTab === 'escrow-history') {
        response = await fetchEscrowHistory(detailPage, detailLimit, escrowStatus);
      }

      if (response) {
        setDetailData(response.data);
        setDetailTotal(response.meta.total);
      }
    } catch (err: any) {
      setDetailError(err instanceof Error ? err.message : "Không thể tải dữ liệu chi tiết");
      setDetailData([]);
      setDetailTotal(0);
    } finally {
      setDetailLoading(false);
    }
  }, [activeTab, detailPage, detailLimit, settlementStatus, payableType, escrowStatus, fetchRentalSettlements, fetchRevenueTransactions, fetchLenderPayableTransactions, fetchEscrowHistory]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  // Reset page when tab or filters change
  const handleTabChange = (tab: 'rental-settlements' | 'revenue-transactions' | 'lender-payable-transactions' | 'escrow-history') => {
    setActiveTab(tab);
    setDetailPage(1);
    setSettlementStatus('all');
    setPayableType('all');
    setEscrowStatus('all');
  };

  useEffect(() => {
    setRate(String(rateBps / 100));
  }, [rateBps]);

  const handleSaveClick = () => {
    setValidationError(null);
    const numericRate = Number(rate);
    if (isNaN(numericRate) || numericRate < 0 || numericRate > 100) {
      setValidationError("Tỷ lệ phí phải là một số hợp lệ từ 0% đến 100%");
      return;
    }
    setTempRate(rate);
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsConfirmOpen(false);
    const numericRate = Number(tempRate);
    await updateRate(Math.round(numericRate * 100));
  };

  const handleCancelSave = () => {
    setIsConfirmOpen(false);
    setRate(String(rateBps / 100));
  };

  const mockRentalFee = 1000000;
  const currentRateNum = Number(rate) || 0;
  const expectedPlatformShare = (mockRentalFee * currentRateNum) / 100;
  const expectedLenderShare = mockRentalFee - expectedPlatformShare;

  return (
    <div className="space-y-6">
      {/* Platform Fee Confirm Dialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        title="Xác nhận thay đổi Phí Platform?"
        description={`Bạn đang thực hiện thay đổi cấu hình dòng tiền hệ thống. Tỷ lệ phí platform sẽ thay đổi từ ${(rateBps / 100).toFixed(1)}% thành ${Number(tempRate).toFixed(1)}%. Thay đổi này sẽ được ghi nhận vào nhật ký kiểm toán (audit log) và áp dụng cho toàn bộ các đơn thuê mới.`}
        confirmLabel="Cập nhật cấu hình"
        cancelLabel="Hủy bỏ"
        variant="warning"
        onConfirm={() => void handleConfirmSave()}
        onCancel={handleCancelSave}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Cash Flow Config (Platform Fee) */}
        <Card className="flex flex-col justify-between border-vanguard-light-border/80 bg-gradient-to-br from-white to-vanguard-light-bg/50 p-6 dark:border-vanguard-dark-border/80 dark:from-vanguard-dark-surf dark:to-vanguard-dark-surfDim/80">
          <div>
            <div className="flex items-center gap-2 text-vanguard-primary">
              <Percent size={18} />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                Cấu hình dòng tiền
              </h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Thiết lập tỷ lệ chiết khấu phí dịch vụ của nền tảng đối với mỗi giao dịch cho thuê thành công.
            </p>

            {/* Input area */}
            <div className="mt-5 space-y-3">
              <label className="block text-xs font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                Tỷ lệ phí Platform (%)
                <div className="relative mt-1.5 flex rounded-v-sm shadow-sm">
                  <input
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    inputMode="decimal"
                    className="block w-full rounded-v-sm border border-vanguard-light-border bg-transparent px-3 py-2 text-sm font-medium tabular-nums focus:border-vanguard-primary focus:outline-none dark:border-vanguard-dark-border"
                    placeholder="30"
                  />
                  <span className="inline-flex items-center rounded-r-v-sm border border-l-0 border-vanguard-light-border bg-vanguard-light-bg px-3 text-xs font-semibold text-vanguard-light-textMuted dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg dark:text-vanguard-dark-textMuted">
                    %
                  </span>
                </div>
              </label>

              {validationError && (
                <p className="text-xs font-medium text-red-500">{validationError}</p>
              )}
            </div>

            {/* Dynamic visual preview */}
            <div className="mt-5 rounded-v-sm bg-vanguard-light-bg/50 p-3.5 dark:bg-vanguard-dark-bg/30">
              <span className="text-[10px] font-bold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                Minh họa phân phối (Đơn thuê 1Mđ)
              </span>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted flex items-center gap-1">
                    <Building size={12} />
                    Platform nhận ({currentRateNum.toFixed(1)}%):
                  </span>
                  <span className="font-bold text-vanguard-primary">
                    {formatCurrency(expectedPlatformShare)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted flex items-center gap-1">
                    <Coins size={12} />
                    Lender nhận ({(100 - currentRateNum).toFixed(1)}%):
                  </span>
                  <span className="font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                    {formatCurrency(expectedLenderShare)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-vanguard-light-border dark:border-vanguard-dark-border flex items-center justify-between">
            <span className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted flex items-center gap-1">
              <Info size={12} />
              Áp dụng tức thì cho đơn mới
            </span>
            <button
              type="button"
              onClick={handleSaveClick}
              className="rounded-v-sm bg-gradient-to-r from-vanguard-primary to-vanguard-secondary px-4 py-2 font-display text-[11px] font-bold uppercase tracking-wider text-vanguard-dark-bg shadow-md transition hover:opacity-90 active:scale-[0.98]"
            >
              Lưu cấu hình
            </button>
          </div>
        </Card>

        {/* Right Side: Cash Flow Visualization Process */}
        <Card className="lg:col-span-2 border-vanguard-light-border/80 bg-gradient-to-br from-white to-vanguard-light-bg/50 p-6 dark:border-vanguard-dark-border/80 dark:from-vanguard-dark-surf dark:to-vanguard-dark-surfDim/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-vanguard-primary">
              <TrendingUp size={18} />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider">
                Quy trình ghi nhận dòng tiền
              </h3>
            </div>
            <span className="rounded-full bg-vanguard-primary/10 border border-vanguard-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-vanguard-primary flex items-center gap-1">
              <ShieldCheck size={11} />
              Reconciliation Source of Truth
            </span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
            Dưới đây là mô hình vận hành tài chính của Mutux. Mọi khoản doanh thu của hệ thống đều tuân thủ nguyên tắc đối soát và ghi nhận nghiêm ngặt.
          </p>

          {/* Cash flow diagram steps */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3 relative">
            {/* Step 1 */}
            <div className="relative rounded-v-sm border border-vanguard-light-border bg-white p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-vanguard-primary">
                    BƯỚC 1
                  </span>
                  <Coins size={14} className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted" />
                </div>
                <h4 className="mt-2 text-xs font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                  Thanh toán & Tạm khóa
                </h4>
                <p className="mt-1.5 text-[11px] leading-relaxed text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Renter thanh toán <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">100% tiền thuê + cọc</strong>. Tiền cọc khóa tại ví Escrow.
                </p>
              </div>
              <div className="mt-3 border-t border-vanguard-light-border pt-2 dark:border-vanguard-dark-border">
                <span className="text-[9px] font-medium text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Trạng thái đơn: <code className="font-mono text-vanguard-primary">confirmed</code>
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-v-sm border border-vanguard-light-border bg-white p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-vanguard-primary">
                    BƯỚC 2
                  </span>
                  <Lock size={14} className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted" />
                </div>
                <h4 className="mt-2 text-xs font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                  Giai đoạn Tạm giữ (Hold)
                </h4>
                <p className="mt-1.5 text-[11px] leading-relaxed text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Tiền thuê được giữ ở trạng thái <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">chờ quyết toán</strong>. Không có doanh thu nào được ghi nhận ở bước này.
                </p>
              </div>
              <div className="mt-3 border-t border-vanguard-light-border pt-2 dark:border-vanguard-dark-border">
                <span className="text-[9px] font-medium text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Ví: <span className="font-mono text-blue-500">Tiền thuê đang giữ</span>
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-v-sm border border-vanguard-primary/50 bg-vanguard-primary/5 p-4 dark:border-vanguard-primary/30 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-vanguard-primary">
                    BƯỚC 3 (Quyết toán)
                  </span>
                  <ShieldCheck size={14} className="text-vanguard-primary animate-pulse" />
                </div>
                <h4 className="mt-2 text-xs font-bold text-vanguard-light-text dark:text-vanguard-dark-text flex items-center gap-1">
                  Ghi nhận Doanh thu
                </h4>
                <p className="mt-1.5 text-[11px] leading-relaxed text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  Khi đơn hoàn tất, tiền thuê được quyết toán. <span className="text-vanguard-primary font-bold">Chỉ lúc này</span> doanh thu platform mới chính thức được ghi nhận.
                </p>
              </div>
              <div className="mt-3 border-t border-vanguard-primary/20 pt-2">
                <span className="text-[9px] font-medium text-vanguard-primary">
                  Ví: <span className="font-mono">Doanh thu đã ghi nhận</span>
                </span>
              </div>
            </div>
          </div>

          {/* Explanation Alert Box */}
          <div className="mt-5 rounded-v-sm border border-vanguard-primary/20 bg-vanguard-primary/5 p-4">
            <div className="flex items-start gap-2.5">
              <Info size={16} className="text-vanguard-primary shrink-0 mt-0.5" />
              <div className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted leading-relaxed">
                <strong className="text-vanguard-light-text dark:text-vanguard-dark-text font-bold block mb-1">
                  Quy tắc kế toán của hệ thống (Revenue Accrual Rule)
                </strong>
                Để đảm bảo tính nhất quán tài chính và bảo vệ quyền lợi người dùng, Mutux áp dụng nguyên tắc tích lũy: doanh số bán hàng hay giao dịch thuê chỉ chuyển đổi thành <strong className="text-vanguard-primary font-semibold">Doanh thu platform thực nhận</strong> và <strong className="text-vanguard-light-text dark:text-vanguard-dark-text font-semibold">Thu nhập Lender</strong> sau khi đơn thuê chuyển sang trạng thái <code className="font-mono text-vanguard-primary bg-vanguard-primary/10 px-1 rounded">completed</code> (hoặc đã phân xử tranh chấp) và được quyết toán hoàn toàn.
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Metrics Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Tiền thuê đang giữ */}
        <div
          onClick={() => handleTabChange('rental-settlements')}
          className={`group rounded-v-sm p-4 flex flex-col justify-between cursor-pointer transition-all border ${
            activeTab === 'rental-settlements'
              ? 'border-vanguard-primary bg-vanguard-primary/5 shadow-[0_0_15px_rgba(235,94,40,0.15)] dark:bg-vanguard-primary/5'
              : 'border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf hover:border-vanguard-primary/40'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Tiền thuê đang giữ
              </span>
              <Lock size={14} className={activeTab === 'rental-settlements' ? 'text-vanguard-primary' : 'group-hover:text-vanguard-primary transition-colors'} />
            </div>
            <p className="mt-2.5 font-display text-xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text tabular-nums">
              {formatCurrency(Number(overview?.rentalHoldBalance ?? 0))}
            </p>
          </div>
          <p className="mt-3 text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted leading-relaxed border-t border-vanguard-light-border/40 pt-2 dark:border-vanguard-dark-border/40">
            Tổng tiền thuê tạm giữ từ <strong className="text-vanguard-light-text dark:text-vanguard-dark-text tabular-nums">{overview?.heldRentalOrders ?? 0}</strong> đơn đang hoạt động.
          </p>
        </div>

        {/* Metric 2: Doanh thu đã ghi nhận */}
        <div
          onClick={() => handleTabChange('revenue-transactions')}
          className={`group rounded-v-sm p-4 flex flex-col justify-between cursor-pointer transition-all border ${
            activeTab === 'revenue-transactions'
              ? 'border-vanguard-primary bg-vanguard-primary/10 shadow-[0_0_15px_rgba(235,94,40,0.2)] dark:bg-vanguard-primary/10'
              : 'border-vanguard-primary/30 bg-vanguard-primary/5 dark:border-vanguard-primary/20 dark:bg-vanguard-primary/5 hover:border-vanguard-primary/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-vanguard-primary">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Doanh thu đã ghi nhận
              </span>
              <ShieldCheck size={14} className={activeTab === 'revenue-transactions' ? 'text-vanguard-primary animate-pulse' : 'animate-pulse'} />
            </div>
            <p className="mt-2.5 font-display text-xl font-bold tracking-tight text-vanguard-primary tabular-nums">
              {formatCurrency(Number(overview?.platformRevenueBalance ?? 0))}
            </p>
          </div>
          <p className="mt-3 text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted leading-relaxed border-t border-vanguard-primary/10 pt-2">
            Doanh thu phí dịch vụ thực tế của nền tảng sau khi quyết toán.
          </p>
        </div>

        {/* Metric 3: Chờ trả Lender */}
        <div
          onClick={() => handleTabChange('lender-payable-transactions')}
          className={`group rounded-v-sm p-4 flex flex-col justify-between cursor-pointer transition-all border ${
            activeTab === 'lender-payable-transactions'
              ? 'border-vanguard-primary bg-vanguard-primary/5 shadow-[0_0_15px_rgba(235,94,40,0.15)] dark:bg-vanguard-primary/5'
              : 'border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf hover:border-vanguard-primary/40'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Chờ trả Lender
              </span>
              <Building size={14} className={activeTab === 'lender-payable-transactions' ? 'text-vanguard-primary' : 'group-hover:text-vanguard-primary transition-colors'} />
            </div>
            <p className="mt-2.5 font-display text-xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text tabular-nums">
              {formatCurrency(Number(overview?.lenderPayableBalance ?? 0))}
            </p>
          </div>
          <p className="mt-3 text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted leading-relaxed border-t border-vanguard-light-border/40 pt-2 dark:border-vanguard-dark-border/40">
            Số dư doanh thu tích lũy của nhà cung cấp thiết bị chờ rút hoặc thanh toán.
          </p>
        </div>

        {/* Metric 4: Tiền cọc đang khóa */}
        <div
          onClick={() => handleTabChange('escrow-history')}
          className={`group rounded-v-sm p-4 flex flex-col justify-between cursor-pointer transition-all border ${
            activeTab === 'escrow-history'
              ? 'border-vanguard-primary bg-vanguard-primary/5 shadow-[0_0_15px_rgba(235,94,40,0.15)] dark:bg-vanguard-primary/5'
              : 'border-vanguard-light-border bg-vanguard-light-surf dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf hover:border-vanguard-primary/40'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Tiền cọc đang khóa
              </span>
              <Lock size={14} className={activeTab === 'escrow-history' ? 'text-vanguard-primary' : 'group-hover:text-vanguard-primary transition-colors'} />
            </div>
            <p className="mt-2.5 font-display text-xl font-bold tracking-tight text-vanguard-light-text dark:text-vanguard-dark-text tabular-nums">
              {formatCurrency(Number(overview?.lockedDepositBalance ?? 0))}
            </p>
          </div>
          <p className="mt-3 text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted leading-relaxed border-t border-vanguard-light-border/40 pt-2 dark:border-vanguard-dark-border/40">
            Khoản ký quỹ Escrow bảo đảm tài sản cho các đơn thuê đang hoạt động.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted animate-pulse">
          <span className="size-1.5 rounded-full bg-vanguard-primary animate-ping" />
          Đang tải dữ liệu đối soát...
        </div>
      )}

      {error && (
        <div className="rounded border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-500 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Detailed History Table */}
      <Card className="border-vanguard-light-border/80 bg-white p-6 dark:border-vanguard-dark-border/80 dark:bg-vanguard-dark-surf shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-vanguard-light-border dark:border-vanguard-dark-border gap-4">
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-vanguard-light-text dark:text-vanguard-dark-text flex items-center gap-2">
              {activeTab === 'rental-settlements' && <>Chi tiết: Tiền thuê đang giữ</>}
              {activeTab === 'revenue-transactions' && <>Chi tiết: Doanh thu đã ghi nhận</>}
              {activeTab === 'lender-payable-transactions' && <>Chi tiết: Chờ trả Lender</>}
              {activeTab === 'escrow-history' && <>Chi tiết: Tiền cọc đang khóa</>}
            </h3>
            <p className="text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted mt-1">
              {activeTab === 'rental-settlements' && 'Danh sách các khoản thanh toán tiền thuê đang được hệ thống tạm giữ hoặc đã quyết toán.'}
              {activeTab === 'revenue-transactions' && 'Nhật ký doanh thu thực nhận của nền tảng (phí dịch vụ thu từ Lender khi hoàn thành đơn).'}
              {activeTab === 'lender-payable-transactions' && 'Nhật ký công nợ phải trả Lender, bao gồm thu nhập từ đơn thuê và các lệnh rút tiền.'}
              {activeTab === 'escrow-history' && 'Lịch sử ký quỹ cọc (Escrow) bảo đảm an toàn thiết bị cho các đơn thuê.'}
            </p>
          </div>

          <div className="flex items-center gap-3 animate-fadeIn">
            {/* Filters */}
            {activeTab === 'rental-settlements' && (
              <CustomSelect
                value={settlementStatus}
                onValueChange={(val) => { setSettlementStatus(val); setDetailPage(1); }}
                className="min-h-8 h-8 text-xs py-1 w-44"
                options={[
                  { value: 'all', label: 'Tất cả trạng thái' },
                  { value: 'held', label: 'Đang tạm giữ (held)' },
                  { value: 'settled', label: 'Đã quyết toán (settled)' },
                  { value: 'refunded', label: 'Đã hoàn trả (refunded)' },
                ]}
              />
            )}

            {activeTab === 'lender-payable-transactions' && (
              <CustomSelect
                value={payableType}
                onValueChange={(val) => { setPayableType(val); setDetailPage(1); }}
                className="min-h-8 h-8 text-xs py-1 w-44"
                options={[
                  { value: 'all', label: 'Tất cả giao dịch' },
                  { value: 'lender_payable', label: 'Doanh thu chờ trả' },
                  { value: 'lender_withdrawal', label: 'Lệnh rút tiền' },
                ]}
              />
            )}

            {activeTab === 'escrow-history' && (
              <CustomSelect
                value={escrowStatus}
                onValueChange={(val) => { setEscrowStatus(val); setDetailPage(1); }}
                className="min-h-8 h-8 text-xs py-1 w-48"
                options={[
                  { value: 'all', label: 'Tất cả trạng thái' },
                  { value: 'locked', label: 'Đang khóa (locked)' },
                  { value: 'released', label: 'Đã giải tỏa (released)' },
                  { value: 'compensated', label: 'Đền bù Lender (compensated)' },
                  { value: 'renter_compensated', label: 'Hoàn renter (renter_compensated)' },
                ]}
              />
            )}

            <button
              onClick={() => void fetchDetails()}
              disabled={detailLoading}
              className="p-1.5 rounded-v-sm hover:bg-vanguard-light-bg dark:hover:bg-vanguard-dark-bg transition-colors disabled:opacity-50 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={15} className={detailLoading ? "animate-spin text-vanguard-primary" : "text-vanguard-light-text dark:text-vanguard-dark-text"} />
            </button>
          </div>
        </div>

        {detailError && (
          <div className="mt-4 rounded border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle size={16} />
            {detailError}
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          {detailLoading ? (
            <div className="py-12 text-center text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted animate-pulse flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-vanguard-primary" />
              Đang tải danh sách chi tiết...
            </div>
          ) : detailData.length === 0 ? (
            <div className="py-12 text-center text-xs text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
              Không tìm thấy bản ghi lịch sử nào.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-vanguard-light-border dark:border-vanguard-dark-border text-[10px] font-bold uppercase tracking-wider text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                  {activeTab === 'rental-settlements' && (
                    <>
                      <th className="pb-3 pr-4">Mã Đơn</th>
                      <th className="pb-3 px-4">Khách Thuê (Renter)</th>
                      <th className="pb-3 px-4">Chủ Thiết Bị (Lender)</th>
                      <th className="pb-3 px-4 text-right">Tổng Tiền Thuê</th>
                      <th className="pb-3 px-4 text-right">Phí Nền Tảng</th>
                      <th className="pb-3 px-4 text-right">Thực Nhận Lender</th>
                      <th className="pb-3 px-4 text-center">Trạng Thế</th>
                      <th className="pb-3 pl-4">Thời Gian Tạm Giữ</th>
                    </>
                  )}
                  {activeTab === 'revenue-transactions' && (
                    <>
                      <th className="pb-3 pr-4">Mã Giao Dịch</th>
                      <th className="pb-3 px-4">Mã Đơn</th>
                      <th className="pb-3 px-4">Khách Thuê / Chủ Thiết Bị</th>
                      <th className="pb-3 px-4 text-right">Doanh Thu Thu Được</th>
                      <th className="pb-3 px-4">Nội Dung</th>
                      <th className="pb-3 pl-4">Ngày Ghi Nhận</th>
                    </>
                  )}
                  {activeTab === 'lender-payable-transactions' && (
                    <>
                      <th className="pb-3 pr-4">Mã Giao Dịch / Mã Đơn</th>
                      <th className="pb-3 px-4">Chủ Thiết Bị (Lender)</th>
                      <th className="pb-3 px-4">Loại Giao Dịch</th>
                      <th className="pb-3 px-4 text-right">Số Tiền</th>
                      <th className="pb-3 px-4">Ghi Chú</th>
                      <th className="pb-3 pl-4">Ngày Giao Dịch</th>
                    </>
                  )}
                  {activeTab === 'escrow-history' && (
                    <>
                      <th className="pb-3 pr-4">Mã Đơn</th>
                      <th className="pb-3 px-4">Khách Thuê (Renter)</th>
                      <th className="pb-3 px-4">Chủ Thiết Bị (Lender)</th>
                      <th className="pb-3 px-4 text-right">Tiền Cọc Ký Quỹ</th>
                      <th className="pb-3 px-4">Hình Thức Ký Quỹ</th>
                      <th className="pb-3 px-4 text-center">Trạng Thái</th>
                      <th className="pb-3 pl-4">Ngày Khóa Cọc</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-vanguard-light-border/40 dark:divide-vanguard-dark-border/40">
                {detailData.map((item) => (
                  <tr key={item.id} className="hover:bg-vanguard-light-bg/30 dark:hover:bg-vanguard-dark-bg/20 transition-colors">
                    {activeTab === 'rental-settlements' && (
                      <>
                        <td className="py-3 pr-4 font-mono font-bold text-vanguard-primary">
                          {item.rental_order?.order_code || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                            {item.rental_order?.renter?.full_name || 'N/A'}
                          </div>
                          <div className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            {item.rental_order?.renter?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                            {item.rental_order?.lender?.full_name || 'N/A'}
                          </div>
                          <div className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            {item.rental_order?.lender?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                          {formatCurrency(Number(item.gross_rental_fee))}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                          {item.status !== 'held' ? formatCurrency(Number(item.platform_fee_amount)) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-vanguard-primary font-bold">
                          {item.status !== 'held' ? formatCurrency(Number(item.lender_income_amount)) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'held'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                              : item.status === 'settled'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {item.status === 'held' ? 'Đang tạm giữ' : item.status === 'settled' ? 'Quyết toán' : 'Hoàn trả'}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted font-mono">
                          {formatShortDate(item.held_at)}
                        </td>
                      </>
                    )}

                    {activeTab === 'revenue-transactions' && (
                      <>
                        <td className="py-3 pr-4 font-mono text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                          {item.reference}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-vanguard-primary">
                          {item.rental_order?.order_code || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-vanguard-light-text dark:text-vanguard-dark-text font-medium">
                            Chủ: {item.rental_order?.lender?.full_name || 'N/A'}
                          </div>
                          <div className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            Thuê: {item.rental_order?.renter?.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-vanguard-primary">
                          +{formatCurrency(Number(item.amount))}
                        </td>
                        <td className="py-3 px-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted italic max-w-xs truncate">
                          {item.note || 'N/A'}
                        </td>
                        <td className="py-3 pl-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted font-mono">
                          {formatShortDate(item.created_at)}
                        </td>
                      </>
                    )}

                    {activeTab === 'lender-payable-transactions' && (
                      <>
                        <td className="py-3 pr-4">
                          {item.rental_order ? (
                            <span className="font-mono font-bold text-vanguard-primary">{item.rental_order.order_code}</span>
                          ) : (
                            <span className="font-mono text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">{item.reference.substring(0, 16)}...</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.rental_order?.lender ? (
                            <div>
                              <div className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                                {item.rental_order.lender.full_name || 'N/A'}
                              </div>
                              <div className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                                {item.rental_order.lender.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted italic">Giao dịch rút tiền</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.type === 'lender_payable'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                          }`}>
                            {item.type === 'lender_payable' ? 'Tích lũy thu nhập' : 'Rút tiền (debit)'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${
                          item.type === 'lender_payable' ? 'text-emerald-500' : 'text-orange-500'
                        }`}>
                          {item.type === 'lender_payable' ? '+' : '-'}{formatCurrency(Number(item.amount))}
                        </td>
                        <td className="py-3 px-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted italic max-w-xs truncate">
                          {item.note || 'N/A'}
                        </td>
                        <td className="py-3 pl-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted font-mono">
                          {formatShortDate(item.created_at)}
                        </td>
                      </>
                    )}

                    {activeTab === 'escrow-history' && (
                      <>
                        <td className="py-3 pr-4 font-mono font-bold text-vanguard-primary">
                          {item.rental_order?.order_code || 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                            {item.rental_order?.renter?.full_name || 'N/A'}
                          </div>
                          <div className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            {item.rental_order?.renter?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-vanguard-light-text dark:text-vanguard-dark-text">
                            {item.rental_order?.lender?.full_name || 'N/A'}
                          </div>
                          <div className="text-[10px] text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted">
                            {item.rental_order?.lender?.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-vanguard-light-text dark:text-vanguard-dark-text">
                          {formatCurrency(Number(item.amount))}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.source === 'credit_line'
                              ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            {item.source === 'credit_line' ? 'Hạn mức tín dụng' : 'Ví tiền mặt'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'locked'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse'
                              : item.status === 'released'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : item.status === 'pending_return'
                              ? 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {item.status === 'locked' && 'Đang khóa'}
                            {item.status === 'released' && 'Đã hoàn cọc'}
                            {item.status === 'pending_return' && 'Chờ hoàn cọc'}
                            {item.status === 'compensated' && 'Khấu trừ đền bù'}
                            {item.status === 'renter_compensated' && 'Hoàn renter'}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-vanguard-light-textMuted dark:text-vanguard-dark-textMuted font-mono">
                          {formatShortDate(item.locked_at)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {detailTotal > detailLimit && (
          <AdminPagination
            page={detailPage}
            totalPages={Math.ceil(detailTotal / detailLimit)}
            total={detailTotal}
            onPageChange={(p) => setDetailPage(p)}
          />
        )}
      </Card>
    </div>
  );
}

