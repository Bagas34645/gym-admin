"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, ClipboardCheck, Banknote, TrendingUp } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { DashboardStats, DashboardSummary } from "@/lib/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineChart } from "@/components/charts/timeline-chart";
import { formatCurrency } from "@/lib/format";

function useDashboardSummary() {
  return useQuery({
    queryKey: ["admin", "dashboard", "summary"],
    queryFn: () => apiGet<DashboardSummary>("/admin/dashboard/summary"),
  });
}

function useDashboardStats(metric: string) {
  return useQuery({
    queryKey: ["admin", "dashboard", "stats", metric],
    queryFn: () =>
      apiGet<DashboardStats>("/admin/dashboard/stats", {
        metric,
        period: "30d",
        group_by: "day",
      }),
  });
}

export default function DashboardPage() {
  const summary = useDashboardSummary();
  const membersStats = useDashboardStats("members");
  const attendanceStats = useDashboardStats("attendance");
  const revenueStats = useDashboardStats("revenue");

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

  const s = summary.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Ringkasan operasional gym"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Anggota"
          value={s?.members.total ?? 0}
          description={`${s?.members.active ?? 0} aktif`}
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
          description={`${s?.attendance.this_month ?? 0} bulan ini`}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Pendapatan Bulan Ini"
          value={formatCurrency(s?.revenue.this_month ?? 0)}
          description={`Hari ini: ${formatCurrency(s?.revenue.today ?? 0)} · +${s?.revenue.growth_percent ?? 0}%`}
          icon={Banknote}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tren 30 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Anggota</TabsTrigger>
              <TabsTrigger value="attendance">Absensi</TabsTrigger>
              <TabsTrigger value="revenue">Pendapatan</TabsTrigger>
            </TabsList>
            <TabsContent value="members" className="pt-4">
              {membersStats.isLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <TimelineChart data={membersStats.data?.data.timeline ?? []} />
              )}
            </TabsContent>
            <TabsContent value="attendance" className="pt-4">
              {attendanceStats.isLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <TimelineChart data={attendanceStats.data?.data.timeline ?? []} />
              )}
            </TabsContent>
            <TabsContent value="revenue" className="pt-4">
              {revenueStats.isLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <TimelineChart
                  data={revenueStats.data?.data.timeline ?? []}
                  valueFormatter={formatCurrency}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
