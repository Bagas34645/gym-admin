"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface RecapData {
  period: string;
  total_check_ins: number;
  breakdown: { day: string; total: number }[];
}

export default function AttendanceRecapPage() {
  const [period, setPeriod] = useState("daily");
  const [date, setDate] = useState("");

  const query = useQuery({
    queryKey: ["admin", "attendance", "recap", period, date],
    queryFn: () =>
      apiGet<RecapData>("/admin/attendance/recap", {
        period,
        date: date || undefined,
      }),
  });

  const recap = query.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Rekap Absensi" description="Ringkasan check-in per periode" />

      <div className="flex flex-wrap gap-4">
        <div>
          <Label>Periode</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Tanggal</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-48" />
      ) : recap ? (
        <Card>
          <CardHeader>
            <CardTitle>Total: {recap.total_check_ins} check-in</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recap.breakdown.map((b) => (
                  <TableRow key={b.day}>
                    <TableCell>{b.day}</TableCell>
                    <TableCell>{b.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
