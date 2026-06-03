"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TablePagination } from "@/components/shared/table-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

interface AttendanceRecord {
  id: string;
  check_in_time: string;
  verification_status: string;
  member?: { name: string };
}

export default function AttendanceHistoryPage() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [memberId, setMemberId] = useState("");

  const query = useQuery({
    queryKey: ["admin", "attendance", "history", { page, from, to, memberId }],
    queryFn: () =>
      apiGet<AttendanceRecord[]>("/admin/attendance/history", {
        page,
        per_page: 20,
        from: from || undefined,
        to: to || undefined,
        member_id: memberId || undefined,
      }),
  });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Riwayat Absensi" description="Filter berdasarkan tanggal atau anggota" />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Dari</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label>Sampai</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <Label>ID Anggota</Label>
          <Input
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="Opsional"
          />
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.member?.name ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(r.check_in_time)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.verification_status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {query.data?.meta && (
            <TablePagination meta={query.data.meta} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}
