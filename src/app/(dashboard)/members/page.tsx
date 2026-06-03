"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Upload, Download, Search } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type { MemberListItem } from "@/lib/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TablePagination } from "@/components/shared/table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatDate, resolveDownloadUrl } from "@/lib/format";
import { toast } from "sonner";
import { Users } from "lucide-react";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["admin", "members", { search, status, page }],
    queryFn: () =>
      apiGet<MemberListItem[]>("/admin/members/search", {
        search: search || undefined,
        status: status || undefined,
        page,
        per_page: 20,
      }),
  });

  const handleExport = async () => {
    try {
      const res = await apiGet<{ download_url: string }>("/admin/members/export", {
        search: search || undefined,
        status: status || undefined,
      });
      window.open(resolveDownloadUrl(res.data.download_url), "_blank");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const members = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anggota"
        description="Kelola data anggota gym"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/members/import">
                <Upload className="size-4" />
                Import
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/members/new">
                <Plus className="size-4" />
                Tambah
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nama, email, atau HP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status || "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="expired">Kedaluwarsa</SelectItem>
            <SelectItem value="inactive">Tidak aktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="Belum ada anggota" description="Tambah anggota baru atau ubah filter" />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>HP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Berakhir</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>{m.phone}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.membership_status} />
                    </TableCell>
                    <TableCell>{formatDate(m.expired_date)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/members/${m.id}`}>Detail</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {meta && <TablePagination meta={meta} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
