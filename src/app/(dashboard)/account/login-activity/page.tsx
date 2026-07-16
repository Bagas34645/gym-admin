"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, Monitor, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import type { LoginSession } from "@/lib/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function LoginActivityPage() {
  const queryClient = useQueryClient();
  const [revoking, setRevoking] = useState<LoginSession | null>(null);

  const query = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: () => apiGet<LoginSession[]>("/auth/sessions"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) =>
      apiDelete<{ was_current: boolean }>(`/auth/sessions/${id}`),
    onSuccess: async (result) => {
      toast.success("Perangkat berhasil dilogout");
      setRevoking(null);
      if (result.data?.was_current) {
        window.location.href = "/login";
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal logout perangkat");
    },
  });

  const sessions = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aktivitas Login"
        description="Pantau perangkat yang sedang masuk ke akun Anda"
      />

      <div className="flex gap-3 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
        <p>
          Jika ada aktivitas login yang mencurigakan, segera ganti password Anda
          dan logout perangkat yang mencurigakan yang ada di bawah ini.
        </p>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Monitor}
          title="Tidak ada sesi aktif"
          description="Belum ada aktivitas login yang tercatat."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>Alamat IP</TableHead>
                <TableHead className="text-right">Waktu Login</TableHead>
                <TableHead className="text-right">Aktivitas Terakhir</TableHead>
                <TableHead className="text-right">Waktu Logout</TableHead>
                <TableHead className="w-40 text-center">Status</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {session.platform ?? "-"}
                  </TableCell>
                  <TableCell>{session.browser ?? "-"}</TableCell>
                  <TableCell>
                    {session.ip_address ? (
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(session.ip_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-4 hover:underline"
                        title="Cek IP"
                      >
                        {session.ip_address}
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatDateTime(session.logged_in_at)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatDateTime(session.last_active_at)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatDateTime(session.logged_out_at)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-0 font-medium",
                        session.is_current
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                      )}
                    >
                      {session.is_current
                        ? "Perangkat Saat Ini"
                        : "Login Di Perangkat Lain"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {!session.is_current && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setRevoking(session)}
                      >
                        <Ban className="size-3.5" />
                        Logout
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={!!revoking}
        onOpenChange={(open) => !open && setRevoking(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logout perangkat?</DialogTitle>
            <DialogDescription>
              Sesi pada{" "}
              {[revoking?.platform, revoking?.browser]
                .filter(Boolean)
                .join(" / ") || "perangkat ini"}{" "}
              ({revoking?.ip_address ?? "-"}) akan diakhiri. Perangkat tersebut
              harus login ulang untuk mengakses akun.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevoking(null)}
              disabled={revokeMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={!revoking || revokeMutation.isPending}
              onClick={() => revoking && revokeMutation.mutate(revoking.id)}
            >
              {revokeMutation.isPending ? "Memproses…" : "Logout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
