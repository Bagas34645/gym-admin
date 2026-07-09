"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet } from "@/lib/api-client";
import type {
  AttendanceReport,
  FinanceReport,
  MembersReport,
} from "@/lib/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalyticsAreaChart } from "@/components/charts/analytics-area-chart";
import { AnalyticsBarChart } from "@/components/charts/analytics-bar-chart";
import { AnalyticsPaymentPieChart } from "@/components/charts/analytics-pie-chart";
import { ChartErrorState } from "@/components/charts/chart-empty-state";
import { metricChartConfig } from "@/components/charts/chart-config";
import { formatCurrency, resolveDownloadUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAYMENT_COLORS = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
];

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exportType, setExportType] = useState("members");
  const [exportFormat, setExportFormat] = useState("excel");

  const membersReport = useQuery({
    queryKey: ["admin", "reports", "members", from, to],
    queryFn: () =>
      apiGet<MembersReport>("/admin/reports/members", {
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const attendanceReport = useQuery({
    queryKey: ["admin", "reports", "attendance", from, to],
    queryFn: () =>
      apiGet<AttendanceReport>("/admin/reports/attendance", {
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const financeReport = useQuery({
    queryKey: ["admin", "reports", "finance", from, to],
    queryFn: () =>
      apiGet<FinanceReport>("/admin/reports/finance", {
        from: from || undefined,
        to: to || undefined,
      }),
  });

  const handleExport = async () => {
    try {
      const res = await apiGet<{ download_url: string }>("/admin/reports/export", {
        report_type: exportType,
        format: exportFormat,
        from: from || undefined,
        to: to || undefined,
      });
      window.open(resolveDownloadUrl(res.data.download_url), "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan" description="Analitik anggota, absensi, dan keuangan" />

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <Label>Dari</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label>Sampai</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <Label>Jenis Export</Label>
          <Select value={exportType} onValueChange={setExportType}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="members">Anggota</SelectItem>
              <SelectItem value="attendance">Absensi</SelectItem>
              <SelectItem value="finance">Keuangan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Format</Label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleExport}>Export</Button>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Anggota</TabsTrigger>
          <TabsTrigger value="attendance">Absensi</TabsTrigger>
          <TabsTrigger value="finance">Keuangan</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="pt-4">
          {membersReport.isLoading ? (
            <Skeleton className="h-80" />
          ) : membersReport.isError ? (
            <ChartErrorState
              onRetry={() => {
                void membersReport.refetch();
              }}
            />
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Total: {membersReport.data?.data.total ?? 0} anggota
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Periode: {membersReport.data?.data.from} —{" "}
                    {membersReport.data?.data.to}
                  </p>
                </CardHeader>
                <CardContent>
                  <AnalyticsBarChart
                    data={(membersReport.data?.data.timeline ?? []).map(
                      (item) => ({
                        date: item.date,
                        value: item.value,
                      }),
                    )}
                    config={metricChartConfig("members")}
                    categoryKey="date"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        <TabsContent value="attendance" className="pt-4">
          {attendanceReport.isLoading ? (
            <Skeleton className="h-80" />
          ) : attendanceReport.isError ? (
            <ChartErrorState
              onRetry={() => {
                void attendanceReport.refetch();
              }}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Total: {attendanceReport.data?.data.total ?? 0} record
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Periode: {attendanceReport.data?.data.from} —{" "}
                  {attendanceReport.data?.data.to}
                </p>
              </CardHeader>
              <CardContent>
                <AnalyticsBarChart
                  data={(attendanceReport.data?.data.timeline ?? []).map(
                    (item) => ({
                      date: item.date,
                      value: item.value,
                    }),
                  )}
                  config={metricChartConfig("attendance")}
                  categoryKey="date"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="finance" className="pt-4">
          {financeReport.isLoading ? (
            <Skeleton className="h-80" />
          ) : financeReport.isError ? (
            <ChartErrorState
              onRetry={() => {
                void financeReport.refetch();
              }}
            />
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>
                    Pendapatan:{" "}
                    {formatCurrency(financeReport.data?.data.total_revenue ?? 0)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tren pendapatan harian
                  </p>
                </CardHeader>
                <CardContent>
                  <AnalyticsAreaChart
                    data={(financeReport.data?.data.timeline ?? []).map(
                      (item) => ({
                        date: item.date,
                        value: Number(item.revenue),
                      }),
                    )}
                    config={metricChartConfig("revenue")}
                    valueFormatter={formatCurrency}
                  />
                </CardContent>
              </Card>
              <Card className="min-w-0 self-start">
                <CardHeader className="pb-3">
                  <CardTitle>Metode Pembayaran</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Distribusi sumber pendapatan
                  </p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const byMethod =
                      financeReport.data?.data.by_payment_method ?? {};
                    const entries = Object.entries(byMethod).filter(
                      ([, amount]) => amount > 0,
                    );
                    const total = entries.reduce(
                      (sum, [, amount]) => sum + amount,
                      0,
                    );

                    if (!entries.length) {
                      return (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          Tidak ada data pembayaran
                        </p>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <AnalyticsPaymentPieChart
                          byMethod={byMethod}
                          compact
                          className="mx-auto shrink-0 sm:mx-0"
                        />
                        <ul className="min-w-0 flex-1 divide-y rounded-lg border">
                          {entries.map(([method, amount], index) => {
                            const share =
                              total > 0
                                ? Math.round((amount / total) * 100)
                                : 0;

                            return (
                              <li
                                key={method}
                                className="flex items-center justify-between gap-3 px-3 py-2.5"
                              >
                                <div className="flex min-w-0 items-center gap-2">
                                  <span
                                    className={cn(
                                      "size-2.5 shrink-0 rounded-full",
                                      PAYMENT_COLORS[index % PAYMENT_COLORS.length],
                                    )}
                                  />
                                  <span className="truncate text-sm font-medium capitalize">
                                    {method}
                                  </span>
                                </div>
                                <div className="shrink-0 text-right">
                                  <p className="text-sm font-semibold tabular-nums">
                                    {formatCurrency(amount)}
                                  </p>
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    {share}%
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
