"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPut } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
import { useState } from "react";

interface MemberDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  membership_status?: string;
  current_membership?: {
    id: string;
    package_name: string;
    end_date: string;
    status: string;
  } | null;
  attendance_history?: { id: string; check_in_time: string; verification_status: string }[];
  payment_history?: { id: string; amount: number; payment_date: string; payment_method: string }[];
}

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("active");

  const query = useQuery({
    queryKey: ["admin", "members", id],
    queryFn: async () => {
      const res = await apiGet<MemberDetail>(`/admin/members/${id}`);
      setName(res.data.name);
      setEmail(res.data.email);
      setPhone(res.data.phone);
      setStatus(res.data.status ?? "active");
      return res;
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => apiPut(`/admin/members/${id}`, { name, email, phone, status }),
    onSuccess: () => {
      toast.success("Data anggota diperbarui");
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiDelete(`/admin/members/${id}`),
    onSuccess: () => {
      toast.success("Anggota dihapus");
      router.push("/members");
    },
    onError: (e) => toast.error(e.message),
  });

  if (query.isLoading) return <Skeleton className="h-96 w-full" />;

  const member = query.data?.data;
  if (!member) return <p>Anggota tidak ditemukan</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={member.name}
        description={member.email}
        actions={
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Hapus anggota ini?")) deleteMutation.mutate();
            }}
          >
            Hapus
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nama</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">HP</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Status akun</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak aktif</SelectItem>
                  <SelectItem value="suspended">Ditangguhkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {member.current_membership && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Membership aktif</p>
                <p>{member.current_membership.package_name}</p>
                <p className="text-muted-foreground">
                  Berakhir: {formatDate(member.current_membership.end_date)}
                </p>
                <StatusBadge status={member.current_membership.status} />
              </div>
            )}
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              Simpan Perubahan
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(member.payment_history ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.payment_date)}</TableCell>
                    <TableCell>{p.payment_method}</TableCell>
                    <TableCell>{formatCurrency(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Absensi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(member.attendance_history ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{formatDateTime(a.check_in_time)}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.verification_status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
