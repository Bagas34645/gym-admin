"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet } from "@/lib/api-client";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, resolveDownloadUrl } from "@/lib/format";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [exportType, setExportType] = useState("members");
  const [exportFormat, setExportFormat] = useState("excel");

  const membersReport = useQuery({
    queryKey: ["admin", "reports", "members", from, to],
    queryFn: () =>
      apiGet<{ from: string; to: string; total: number; members: unknown[] }>(
        "/admin/reports/members",
        { from: from || undefined, to: to || undefined },
      ),
  });

  const attendanceReport = useQuery({
    queryKey: ["admin", "reports", "attendance", from, to],
    queryFn: () =>
      apiGet<{ from: string; to: string; total: number; records: unknown[] }>(
        "/admin/reports/attendance",
        { from: from || undefined, to: to || undefined },
      ),
  });

  const financeReport = useQuery({
    queryKey: ["admin", "reports", "finance", from, to],
    queryFn: () =>
      apiGet<{
        total_revenue: number;
        by_payment_method: Record<string, number>;
        timeline: { date: string; amount: number }[];
      }>("/admin/reports/finance", {
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
            <Skeleton className="h-32" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Total: {membersReport.data?.data.total ?? 0} anggota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Periode: {membersReport.data?.data.from} — {membersReport.data?.data.to}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="attendance" className="pt-4">
          {attendanceReport.isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Total: {attendanceReport.data?.data.total ?? 0} record
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="finance" className="pt-4">
          {financeReport.isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Pendapatan:{" "}
                  {formatCurrency(financeReport.data?.data.total_revenue ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metode</TableHead>
                      <TableHead>Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(
                      financeReport.data?.data.by_payment_method ?? {},
                    ).map(([method, amount]) => (
                      <TableRow key={method}>
                        <TableCell>{method}</TableCell>
                        <TableCell>{formatCurrency(amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
