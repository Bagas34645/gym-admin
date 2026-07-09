"use client";

import { useState } from "react";
import {
  Users,
  ClipboardCheck,
  Banknote,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AnalyticsAreaChart } from "@/components/charts/analytics-area-chart";
import { AnalyticsBarChart } from "@/components/charts/analytics-bar-chart";
import { AnalyticsPieChart } from "@/components/charts/analytics-pie-chart";
import { ChartPeriodSelector } from "@/components/charts/chart-period-selector";
import { ChartErrorState } from "@/components/charts/chart-empty-state";
import {
  attendanceComparisonChartConfig,
  memberStatusChartConfig,
  metricChartConfig,
  resolveGroupBy,
  type DashboardMetric,
  type DashboardPeriod,
} from "@/components/charts/chart-config";
import {
  useDashboardRefresh,
  useDashboardStats,
  useDashboardSummary,
} from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/format";

function MetricChartPanel({
  metric,
  period,
}: {
  metric: DashboardMetric;
  period: DashboardPeriod;
}) {
  const groupBy = resolveGroupBy(period);
  const stats = useDashboardStats(metric, period);

  if (stats.isLoading) {
    return <Skeleton className="h-[300px]" />;
  }

  if (stats.isError) {
    return (
      <ChartErrorState
        onRetry={() => {
          void stats.refetch();
        }}
      />
    );
  }

  return (
    <AnalyticsAreaChart
      data={stats.data?.data.timeline ?? []}
      config={metricChartConfig(metric)}
      groupBy={groupBy}
      valueFormatter={metric === "revenue" ? formatCurrency : undefined}
    />
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const summary = useDashboardSummary();
  const { refresh, isRefreshing } = useDashboardRefresh();

  if (summary.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (summary.isError) {
    return (
      <ChartErrorState
        message="Gagal memuat ringkasan dashboard"
        onRetry={() => {
          void summary.refetch();
        }}
      />
    );
  }

  const s = summary.data?.data;
  const memberStatusData = [
    {
      name: "active",
      value: s?.members.active ?? 0,
    },
    {
      name: "inactive",
      value: s?.members.inactive ?? 0,
    },
  ];
  const attendanceComparisonData = [
    { label: "Hari Ini", count: s?.attendance.today ?? 0 },
    { label: "Minggu Ini", count: s?.attendance.this_week ?? 0 },
    { label: "Bulan Ini", count: s?.attendance.this_month ?? 0 },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Dashboard"
          description="Ringkasan operasional gym"
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => {
            void refresh();
          }}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Muat Ulang
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        <StatCard
          title="Total Anggota"
          value={s?.members.total ?? 0}
          description={`${s?.members.active ?? 0} aktif · ${s?.members.inactive ?? 0} tidak aktif`}
          icon={Users}
        />
        <StatCard
          title="Anggota Baru"
          value={s?.members.new_this_month ?? 0}
          description="Bulan ini"
          icon={TrendingUp}
        />
        <StatCard
          title="Absensi Hari Ini"
          value={s?.attendance.today ?? 0}
          description={`${s?.attendance.this_week ?? 0} minggu ini`}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={formatCurrency(s?.revenue.this_month ?? 0)}
          description="Total pembayaran selesai bulan berjalan"
          icon={Banknote}
          className="min-[480px]:col-span-2 xl:col-span-1"
        />
      </div>

      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:gap-4">
          <div className="min-w-0">
            <CardTitle>Tren Analisis</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Pantau perkembangan anggota, absensi, dan pendapatan
            </p>
          </div>
          <ChartPeriodSelector value={period} onChange={setPeriod} />
        </CardHeader>
        <CardContent className="min-w-0">
          <Tabs defaultValue="members">
            <TabsList className="grid h-auto w-full grid-cols-3">
              <TabsTrigger value="members" className="px-2 text-xs sm:text-sm">
                Anggota
              </TabsTrigger>
              <TabsTrigger value="attendance" className="px-2 text-xs sm:text-sm">
                Absensi
              </TabsTrigger>
              <TabsTrigger value="revenue" className="px-2 text-xs sm:text-sm">
                Pendapatan
              </TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="pt-4">
              <MetricChartPanel metric="members" period={period} />
            </TabsContent>
            <TabsContent value="attendance" className="pt-4">
              <MetricChartPanel metric="attendance" period={period} />
            </TabsContent>
            <TabsContent value="revenue" className="pt-4">
              <MetricChartPanel metric="revenue" period={period} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex h-full min-w-0 flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Perbandingan Absensi</CardTitle>
            <p className="text-sm text-muted-foreground">
              Volume check-in per periode
            </p>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col min-w-0">
            <AnalyticsBarChart
              data={attendanceComparisonData}
              config={attendanceComparisonChartConfig}
              dataKey="count"
              categoryKey="label"
              heightClassName="h-full min-h-[280px]"
            />
          </CardContent>
        </Card>

        <Card className="flex h-full min-w-0 flex-col">
          <CardHeader className="pb-3">
            <CardTitle>Status Anggota</CardTitle>
            <p className="text-sm text-muted-foreground">
              Komposisi keanggotaan aktif
            </p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-center pb-4">
            <AnalyticsPieChart
              data={memberStatusData}
              config={memberStatusChartConfig}
              showTotal
              totalLabel="Total Anggota"
              showLegend
              strokeWidth={4}
              compact
              className="flex h-full flex-col justify-center"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0" size="sm">
        <CardHeader className="pb-2">
          <CardTitle>Detail Pendapatan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Performa harian dan perbandingan dengan bulan lalu
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 divide-y rounded-lg border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground">Hari Ini</p>
              <p className="mt-1 text-base font-semibold break-words sm:text-lg">
                {formatCurrency(s?.revenue.today ?? 0)}
              </p>
            </div>
            <div className="bg-chart-3/5 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Pertumbuhan vs bulan lalu
              </p>
              <p className="mt-1 text-base font-bold text-chart-3 sm:text-lg">
                {(s?.revenue.growth_percent ?? 0) >= 0 ? "+" : ""}
                {s?.revenue.growth_percent ?? 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
