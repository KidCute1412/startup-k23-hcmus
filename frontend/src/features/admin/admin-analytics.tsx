"use client";

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { DatePicker } from '@/components/ui/date-picker';
import { CustomSelect } from '@/components/ui/custom-select';

const labels: Record<string, string> = {
  pending_confirm: 'Chờ xác nhận', confirmed: 'Đã xác nhận', delivering: 'Đang giao', active: 'Đang thuê',
  returning: 'Đang trả', completed: 'Hoàn tất', cancelled: 'Đã hủy', disputed: 'Tranh chấp',
};
const queueLabels: Record<string, string> = { kyc: 'KYC', gears: 'Thiết bị', disputes: 'Tranh chấp', creditLimits: 'Hạn mức tín dụng' };
const queueColors: Record<string, { bar: string; dot: string; text: string }> = {
  kyc: { bar: 'bg-amber-500', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  gears: { bar: 'bg-blue-600', dot: 'bg-blue-600', text: 'text-blue-600 dark:text-blue-400' },
  disputes: { bar: 'bg-rose-600', dot: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400' },
  creditLimits: { bar: 'bg-emerald-600', dot: 'bg-emerald-600', text: 'text-emerald-600 dark:text-emerald-400' },
};

function BarList({ rows }: { rows: Array<{ status: string; count: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return <div className="space-y-3">{rows.map((row) => <div key={row.status}>
    <div className="mb-1 flex justify-between text-xs"><span>{labels[row.status] ?? row.status}</span><strong>{row.count}</strong></div>
    <div className="h-2 rounded-full bg-vanguard-light-bg dark:bg-vanguard-dark-bg"><div className="h-full rounded-full bg-vanguard-primary" style={{ width: `${(row.count / max) * 100}%` }} /></div>
  </div>)}</div>;
}

function TimelineChart({ timeline }: { timeline: Array<{ date: string; orders: number; users: number; gears: number; revenue: number }> }) {
  const max = Math.max(1, ...timeline.map((row) => Math.max(row.orders, row.users, row.gears)));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const width = 900; const height = 260; const left = 42; const right = 18; const top = 18; const bottom = 34;
  const chartWidth = width - left - right; const chartHeight = height - top - bottom;
  const x = (index: number) => left + (timeline.length === 1 ? chartWidth / 2 : (index / (timeline.length - 1)) * chartWidth);
  const y = (value: number) => top + chartHeight - (value / max) * chartHeight;
  const points = (key: 'orders' | 'users' | 'gears') => timeline.map((row, index) => `${x(index)},${y(row[key])}`).join(' ');
  const active = activeIndex === null ? null : timeline[activeIndex];
  const yTicks = [max, Math.ceil(max / 2), 0];
  return <div className="relative overflow-hidden rounded-v-sm border border-vanguard-light-border/60 bg-gradient-to-br from-vanguard-light-bg/70 to-white dark:border-vanguard-dark-border/60 dark:from-vanguard-dark-bg/70 dark:to-vanguard-dark-surfDim/50">
    <div className="relative aspect-[900/260] w-full min-w-[560px]">
      <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Biểu đồ đường hoạt động theo thời gian" onMouseLeave={() => setActiveIndex(null)}>
        <defs><linearGradient id="orders-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#c8a96b" stopOpacity=".24" /><stop offset="100%" stopColor="#c8a96b" stopOpacity="0" /></linearGradient></defs>
        {yTicks.map((tick) => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="currentColor" className="text-vanguard-light-border/70 dark:text-vanguard-dark-border/70" strokeDasharray="4 6" /><text x={left - 10} y={y(tick) + 4} textAnchor="end" className="fill-vanguard-light-textMuted text-[11px] dark:fill-vanguard-dark-textMuted">{tick}</text></g>)}
        <line x1={left} x2={width - right} y1={top + chartHeight} y2={top + chartHeight} stroke="currentColor" className="text-vanguard-light-border dark:text-vanguard-dark-border" />
        <polygon points={`${left},${top + chartHeight} ${points('orders')} ${width - right},${top + chartHeight}`} fill="url(#orders-fill)" />
        <polyline points={points('orders')} fill="none" stroke="#c8a96b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-sm transition-all duration-500" />
        <polyline points={points('users')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
        <polyline points={points('gears')} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
        {timeline.map((row, index) => <g key={row.date} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} tabIndex={0} className="cursor-crosshair outline-none"><rect x={x(index) - chartWidth / Math.max(2, timeline.length * 2)} y={top} width={chartWidth / Math.max(2, timeline.length)} height={chartHeight} fill="transparent" /><circle cx={x(index)} cy={y(row.orders)} r={activeIndex === index ? 6 : 3.5} fill="#c8a96b" stroke="white" strokeWidth="2" className="transition-all duration-200" /><circle cx={x(index)} cy={y(row.users)} r={activeIndex === index ? 5 : 3} fill="#3b82f6" stroke="white" strokeWidth="2" className="transition-all duration-200" /><circle cx={x(index)} cy={y(row.gears)} r={activeIndex === index ? 5 : 3} fill="#10b981" stroke="white" strokeWidth="2" className="transition-all duration-200" />{(index === 0 || index === timeline.length - 1 || index === activeIndex) && <text x={x(index)} y={height - 10} textAnchor="middle" className="fill-vanguard-light-textMuted text-[10px] dark:fill-vanguard-dark-textMuted">{new Date(row.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</text>}</g>)}
      </svg>
      {active && <div className="pointer-events-none absolute z-20 w-48 -translate-x-1/2 rounded-v-sm border border-vanguard-light-border bg-white/95 p-3 text-[11px] shadow-2xl backdrop-blur transition-all duration-200 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf/95" style={{ left: `clamp(6rem, ${(x(activeIndex!) / width) * 100}%, calc(100% - 6rem))`, top: `clamp(0.25rem, ${(y(Math.max(active.orders, active.users, active.gears)) / height) * 100 - 5}%, calc(100% - 7rem))` }}><strong>{new Date(active.date).toLocaleDateString('vi-VN')}</strong><div className="mt-1 text-vanguard-primary">● Đơn thuê: {active.orders}</div><div className="text-blue-500">● Người dùng: {active.users}</div><div className="text-emerald-500">● Thiết bị: {active.gears}</div><div className="mt-1 border-t pt-1 text-vanguard-light-textMuted">Doanh thu: {active.revenue.toLocaleString('vi-VN')} đ</div></div>}
    </div>
    <div className="mt-3 rounded-v-sm border border-vanguard-light-border/70 bg-vanguard-light-bg/40 px-3 py-2 dark:border-vanguard-dark-border/70 dark:bg-vanguard-dark-bg/40"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-vanguard-light-textMuted">Chú thích</p><div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]"><span><i className="mr-1 inline-block size-2 rounded-full bg-[#c8a96b]" />Đơn thuê mới</span><span><i className="mr-1 inline-block size-2 rounded-full bg-blue-500" />Người dùng đăng ký</span><span><i className="mr-1 inline-block size-2 rounded-full bg-emerald-500" />Thiết bị mới</span></div></div>
    <p className="mt-2 text-[10px] text-vanguard-light-textMuted">Trục X: thời gian · Trục Y: số lượng bản ghi (đơn vị: bản ghi)</p>
  </div>;
}

function QueueOverview({ queues }: { queues: Record<string, Array<{ status: string; count: number }>> }) {
  const groups = Object.entries(queues).map(([key, rows]) => ({ key, total: rows.reduce((sum, row) => sum + row.count, 0), rows }));
  const actualTotal = groups.reduce((sum, group) => sum + group.total, 0);
  return <div className="space-y-5"><div><div className="mb-2 flex items-end justify-between"><div><p className="text-2xl font-bold tracking-tight">{actualTotal}</p><p className="text-[11px] text-vanguard-light-textMuted">Tổng hồ sơ cần theo dõi</p></div><span className="text-[11px] text-vanguard-light-textMuted">Theo khoảng thời gian đã chọn</span></div><div className="flex h-4 w-full overflow-hidden rounded-full bg-vanguard-light-bg dark:bg-vanguard-dark-bg">{groups.map((group) => <div key={group.key} className={`${queueColors[group.key]?.bar ?? 'bg-vanguard-primary'} h-full transition-all`} style={{ width: `${actualTotal ? (group.total / actualTotal) * 100 : 0}%` }} title={`${queueLabels[group.key] ?? group.key}: ${group.total}`} />)}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{groups.map((group) => <span key={group.key} className="inline-flex items-center gap-1.5 text-[11px] text-vanguard-light-textMuted"><i className={`size-2 rounded-full ${queueColors[group.key]?.dot ?? 'bg-vanguard-primary'}`} />{queueLabels[group.key] ?? group.key} <strong className="text-vanguard-light-text dark:text-vanguard-dark-text">{group.total}</strong></span>)}</div></div><div className="grid grid-cols-2 gap-3">{groups.map((group) => <div key={group.key} className="rounded-v-sm border border-vanguard-light-border bg-vanguard-light-bg/40 p-3 dark:border-vanguard-dark-border dark:bg-vanguard-dark-bg/40"><div className="flex items-center justify-between"><span className={`text-[11px] font-semibold ${queueColors[group.key]?.text ?? ''}`}>{queueLabels[group.key] ?? group.key}</span><span className="text-lg font-bold">{group.total}</span></div><div className="mt-2 flex flex-wrap gap-1.5">{group.rows.map((row) => <span key={row.status} className="rounded-full border border-vanguard-light-border px-1.5 py-0.5 text-[10px] text-vanguard-light-textMuted dark:border-vanguard-dark-border">{row.status}: {row.count}</span>)}</div></div>)}</div></div>;
}

export function AdminAnalytics() {
  const { data, loading, error, range, setRange, granularity, setGranularity, refetch } = useAdminAnalytics();
  return <section className="space-y-5">
    <div className="flex flex-wrap items-end gap-3 rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-4 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"><div className="mr-2 self-center text-xs text-vanguard-light-textMuted">Bộ lọc áp dụng cho cả 3 biểu đồ</div>
      <div className="w-40"><span className="text-xs font-semibold">Từ</span><DatePicker value={range.from} max={range.to} onChange={(value) => setRange({ ...range, from: value })} className="mt-1" /></div><div className="w-40"><span className="text-xs font-semibold">Đến</span><DatePicker value={range.to} min={range.from} onChange={(value) => setRange({ ...range, to: value })} className="mt-1" /></div><div className="w-32"><span className="text-xs font-semibold">Nhóm theo</span><CustomSelect value={granularity} onValueChange={(value) => setGranularity(value as 'day' | 'week')} options={[{ value: 'day', label: 'Ngày' }, { value: 'week', label: 'Tuần' }]} className="mt-1 min-h-8 h-8 text-xs py-1" /></div><button type="button" onClick={() => void refetch()} disabled={loading} className="inline-flex items-center gap-2 rounded bg-vanguard-primary px-3 py-2 text-xs font-bold"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Cập nhật</button>
    </div>
    {error && <p className="rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">{error}</p>}{loading && !data && <p className="py-8 text-center text-sm text-vanguard-light-textMuted">Đang tải dữ liệu biểu đồ...</p>}
    {data && <div className="grid gap-5 lg:grid-cols-2"><div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-5 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf lg:col-span-2"><h2 className="mb-1 font-display text-sm font-bold">Hoạt động theo thời gian</h2><p className="mb-4 text-[11px] text-vanguard-light-textMuted">Số liệu theo {granularity === 'day' ? 'ngày' : 'tuần'}. Di chuột hoặc focus vào từng cột để xem chi tiết.</p>{data.timeline.length ? <TimelineChart timeline={data.timeline} /> : <p className="py-12 text-center text-sm text-vanguard-light-textMuted">Không có hoạt động trong khoảng thời gian này.</p>}</div><div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-5 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"><h2 className="mb-4 font-display text-sm font-bold">Đơn thuê theo trạng thái</h2>{data.ordersByStatus.length ? <BarList rows={data.ordersByStatus} /> : <p className="text-sm text-vanguard-light-textMuted">Không có dữ liệu.</p>}</div><div className="rounded-v border border-vanguard-light-border bg-vanguard-light-surf p-5 dark:border-vanguard-dark-border dark:bg-vanguard-dark-surf"><h2 className="mb-4 font-display text-sm font-bold">Hàng đợi quản trị</h2><QueueOverview queues={data.adminQueues} /></div></div>}
  </section>;
}
