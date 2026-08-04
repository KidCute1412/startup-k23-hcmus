import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum DashboardAnalyticsGranularity {
  day = 'day',
  week = 'week',
}

export class GetDashboardAnalyticsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(DashboardAnalyticsGranularity)
  granularity: DashboardAnalyticsGranularity =
    DashboardAnalyticsGranularity.day;
}
