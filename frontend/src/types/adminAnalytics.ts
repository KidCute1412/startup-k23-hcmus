export type AnalyticsGranularity = 'day' | 'week';

export interface AdminAnalytics {
  range: { from: string; to: string; granularity: AnalyticsGranularity };
  timeline: Array<{ date: string; orders: number; users: number; gears: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  adminQueues: Record<string, Array<{ status: string; count: number }>>;
}
