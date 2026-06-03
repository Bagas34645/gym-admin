"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TablePagination } from "@/components/shared/table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";

interface ExpiredRow {
  id: string;
  name: string;
  email: string;
  package_name?: string;
  end_date?: string;
  days_remaining?: number;
}

export default function ExpiredMembershipsPage() {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "memberships", "expired", page],
    queryFn: () =>
      apiGet<ExpiredRow[]>("/admin/memberships/expired", {
        status: "expiring_soon",
        days_before: 7,
        page,
        per_page: 20,
      }),
  });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership Kedaluwarsa"
        description="Anggota yang akan atau sudah berakhir"
      />
      {query.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Berakhir</TableHead>
                  <TableHead>Sisa Hari</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.package_name ?? "-"}</TableCell>
                    <TableCell>{formatDate(r.end_date)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          (r.days_remaining ?? 0) <= 0 ? "expired" : "expiring_soon"
                        }
                      />
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
