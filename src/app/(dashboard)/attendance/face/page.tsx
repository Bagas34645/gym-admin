"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ScanFace, X } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTime } from "@/lib/format";

interface FaceRegistration {
  id: string;
  member_id: string;
  member_name: string | null;
  member_email: string | null;
  face_image_url: string | null;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  registered_at: string | null;
  verified_at: string | null;
}

type StatusFilter = "pending" | "verified" | "rejected";

export default function FaceVerificationPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<FaceRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const query = useQuery({
    queryKey: ["admin", "faces", { status, page }],
    queryFn: () =>
      apiGet<FaceRegistration[]>("/admin/faces", { status, page, per_page: 12 }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "faces"] });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => apiPost(`/admin/faces/${id}/verify`),
    onSuccess: () => {
      toast.success("Wajah berhasil diverifikasi");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiPost(`/admin/faces/${id}/reject`, { reason: reason || undefined }),
    onSuccess: () => {
      toast.success("Pendaftaran wajah ditolak");
      setRejecting(null);
      setRejectReason("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const items = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi Wajah"
        description="Tinjau dan setujui pendaftaran wajah anggota sebelum dipakai check-in"
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/attendance">Absensi Live</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/kiosk" target="_blank">
                <ScanFace className="size-4" />
                Buka Kiosk
              </Link>
            </Button>
          </>
        }
      />

      <Tabs
        value={status}
        onValueChange={(v) => {
          setStatus(v as StatusFilter);
          setPage(1);
        }}
      >
        <TabsList>
          <TabsTrigger value="pending">Menunggu</TabsTrigger>
          <TabsTrigger value="verified">Terverifikasi</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <ScanFace className="size-10 text-muted-foreground" />
            <p className="font-medium">Tidak ada data</p>
            <p className="text-sm text-muted-foreground">
              Belum ada pendaftaran wajah dengan status ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative aspect-square w-full bg-muted">
                  {item.face_image_url ? (
                    <Image
                      src={item.face_image_url}
                      alt={item.member_name ?? "Wajah anggota"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ScanFace className="size-12" />
                    </div>
                  )}
                  <div className="absolute right-2 top-2">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback>
                        {(item.member_name ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {item.member_name ?? "Tanpa nama"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.member_email ?? "-"}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Didaftarkan: {item.registered_at ? formatDateTime(item.registered_at) : "-"}
                  </p>
                  {item.status === "rejected" && item.rejection_reason && (
                    <p className="text-xs text-red-600">Alasan: {item.rejection_reason}</p>
                  )}

                  {item.status !== "verified" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={verifyMutation.isPending}
                        onClick={() => verifyMutation.mutate(item.id)}
                      >
                        <Check className="size-4" />
                        Verifikasi
                      </Button>
                      {item.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setRejecting(item);
                            setRejectReason("");
                          }}
                        >
                          <X className="size-4" />
                          Tolak
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {meta && <TablePagination meta={meta} onPageChange={setPage} />}
        </>
      )}

      <Dialog open={!!rejecting} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pendaftaran Wajah</DialogTitle>
            <DialogDescription>
              Anggota {rejecting?.member_name ?? ""} akan diminta mendaftarkan ulang wajahnya.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Alasan penolakan (opsional), mis. foto buram / banyak wajah"
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
                rejectMutation.mutate({ id: rejecting.id, reason: rejectReason })
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
