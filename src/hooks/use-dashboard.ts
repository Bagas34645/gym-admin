"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { DashboardStats, DashboardSummary } from "@/lib/types/api";
import {
  resolveGroupBy,
  type DashboardMetric,
  type DashboardPeriod,
} from "@/components/charts/chart-config";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["admin", "dashboard", "summary"],
    queryFn: () => apiGet<DashboardSummary>("/admin/dashboard/summary"),
    refetchInterval: 60_000,
  });
}

export function useDashboardStats(
  metric: DashboardMetric,
  period: DashboardPeriod,
) {
  const groupBy = resolveGroupBy(period);

  return useQuery({
    queryKey: ["admin", "dashboard", "stats", metric, period, groupBy],
    queryFn: () =>
      apiGet<DashboardStats>("/admin/dashboard/stats", {
        metric,
        period,
        group_by: groupBy,
      }),
  });
}

export function useDashboardRefresh() {
  const summary = useDashboardSummary();

  return {
    refresh: () => summary.refetch(),
    isRefreshing: summary.isFetching && !summary.isLoading,
  };
}
