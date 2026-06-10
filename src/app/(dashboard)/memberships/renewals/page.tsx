"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ExternalLink, X } from "lucide-react";
import { apiGet, apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TablePagination } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, resolveDownloadUrl } from "@/lib/format";

interface RenewalRow {
  id: string;
  member_name: string;
  email: string;
  package_name: string;
  amount_paid: number;
  payment_method: "transfer" | "cash" | "qris";
  payment_proof_url: string | null;
  previous_end_date: string | null;
  new_end_date: string;
  status: "pending_verification" | "approved" | "rejected";
  created_at: string | null;
}

type StatusFilter = "pending_verification" | "approved" | "rejected" | "all";

const paymentMethodLabels: Record<string, string> = {
  transfer: "Transfer",
  cash: "Tunai",
  qris: "QRIS",
};

export default function MembershipRenewalsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("pending_verification");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<RenewalRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const query = useQuery({
    queryKey: ["admin", "memberships", "renewals", { status, page }],
    queryFn: () =>
      apiGet<RenewalRow[]>("/admin/memberships/renewals", {
        status,
        page,
        per_page: 20,
      }),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin", "memberships", "renewals"] });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiPost(`/admin/memberships/renewals/${id}/approve`),
    onSuccess: () => {
      toast.success("Perpanjangan disetujui & membership diaktifkan");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiPost(`/admin/memberships/renewals/${id}/reject`, {
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success("Perpanjangan ditolak");
      setRejecting(null);
      setRejectReason("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Perpanjangan Membership"
        description="Tinjau dan verifikasi pengajuan perpanjangan dari anggota"
      />

      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as StatusFilter);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="pending_verification">Menunggu</TabsTrigger>
          <TabsTrigger value="approved">Disetujui</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak</TabsTrigger>
          <TabsTrigger value="all">Semua</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">Tidak ada data</p>
            <p className="text-sm text-muted-foreground">
              Belum ada pengajuan perpanjangan dengan status ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Bukti</TableHead>
                  <TableHead>Berlaku s/d</TableHead>
                  <TableHead>Diajukan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.member_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.email}
                      </div>
                    </TableCell>
                    <TableCell>{r.package_name}</TableCell>
                    <TableCell>{formatCurrency(r.amount_paid)}</TableCell>
                    <TableCell>
                      {paymentMethodLabels[r.payment_method] ??
                        r.payment_method}
                    </TableCell>
                    <TableCell>
                      {r.payment_proof_url ? (
                        <a
                          href={resolveDownloadUrl(r.payment_proof_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="size-3.5" />
                          Lihat
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(r.new_end_date)}</TableCell>
                    <TableCell>{formatDate(r.created_at)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending_verification" ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={approveMutation.isPending}
                            onClick={() => approveMutation.mutate(r.id)}
                          >
                            <Check className="size-4" />
                            Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRejecting(r);
                              setRejectReason("");
                            }}
                          >
                            <X className="size-4" />
                            Tolak
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {meta && <TablePagination meta={meta} onPageChange={setPage} />}
        </>
      )}

      <Dialog
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Perpanjangan</DialogTitle>
            <DialogDescription>
              Pengajuan {rejecting?.member_name ?? ""} untuk paket{" "}
              {rejecting?.package_name ?? ""} akan ditolak.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan (opsional), mis. bukti pembayaran tidak valid"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() =>
                rejecting &&
                rejectMutation.mutate({
                  id: rejecting.id,
                  reason: rejectReason,
                })
              }
            >
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
