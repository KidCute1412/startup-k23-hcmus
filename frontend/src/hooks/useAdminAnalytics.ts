import { useCallback, useEffect, useState } from 'react';
import { adminAnalyticsService } from '@/services/adminAnalyticsService';
import type { AdminAnalytics, AnalyticsGranularity } from '@/types/adminAnalytics';

function initialRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function useAdminAnalytics() {
  const [range, setRange] = useState(initialRange);
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('day');
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await adminAnalyticsService.get({ ...range, granularity })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu biểu đồ.'); }
    finally { setLoading(false); }
  }, [granularity, range]);

  useEffect(() => { void fetchData(); }, [fetchData]);
  return { data, loading, error, range, setRange, granularity, setGranularity, refetch: fetchData };
}
