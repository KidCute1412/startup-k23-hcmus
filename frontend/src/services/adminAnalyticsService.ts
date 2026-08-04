import { apiClient } from '@/lib/apiClient';
import type { AdminAnalytics, AnalyticsGranularity } from '@/types/adminAnalytics';

export const adminAnalyticsService = {
  get: (params: { from: string; to: string; granularity: AnalyticsGranularity }) => {
    const query = new URLSearchParams(params);
    return apiClient<AdminAnalytics>(`/admin/dashboard/analytics?${query.toString()}`);
  },
};
