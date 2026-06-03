"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface MembershipRow {
  id: string;
  name: string;
  email: string;
  membership_status: string;
  package_name?: string;
  end_date?: string;
}

export default function MembershipsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "memberships", { search, page }],
    queryFn: () =>
      apiGet<MembershipRow[]>("/admin/memberships", {
        search: search || undefined,
        page,
        per_page: 20,
      }),
  });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membership"
        description="Daftar membership aktif anggota"
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/memberships/expired">Kedaluwarsa</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/memberships/activate">
                <Plus className="size-4" />
                Aktivasi
              </Link>
            </Button>
          </>
        }
      />

      <Input
        placeholder="Cari anggota..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-sm"
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
                  <TableHead>Status</TableHead>
                  <TableHead>Berakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.package_name ?? "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.membership_status} />
                    </TableCell>
                    <TableCell>{r.end_date ?? "-"}</TableCell>
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
