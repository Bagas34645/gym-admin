"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface LiveAttendance {
  attendance_id: string;
  member_name: string;
  check_in_time: string;
  verification_status: string;
}

export default function AttendanceLivePage() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "attendance", "live"],
    queryFn: () => apiGet<LiveAttendance[]>("/admin/attendance/live"),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });

  const verifyMutation = useMutation({
    mutationFn: (attendanceId: string) =>
      apiPost("/admin/attendance/verify", { attendance_id: attendanceId }),
    onSuccess: () => {
      toast.success("Absensi diverifikasi");
      qc.invalidateQueries({ queryKey: ["admin", "attendance", "live"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Absensi Live"
        description="Check-in hari ini (refresh otomatis 30 detik)"
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/attendance/history">Riwayat</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/attendance/recap">Rekap</Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Check-in Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.attendance_id}>
                    <TableCell>{r.member_name}</TableCell>
                    <TableCell>{formatDateTime(r.check_in_time)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.verification_status} />
                    </TableCell>
                    <TableCell>
                      {r.verification_status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyMutation.mutate(r.attendance_id)}
                        >
                          Verifikasi
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
