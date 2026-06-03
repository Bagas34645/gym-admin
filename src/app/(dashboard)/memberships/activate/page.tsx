"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api-client";
import type { MembershipPackage } from "@/lib/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function ActivateMembershipPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [startDate, setStartDate] = useState("");

  const packagesQuery = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: () => apiGet<MembershipPackage[]>("/admin/packages"),
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiPost("/admin/memberships/activate", {
        user_id: userId,
        package_id: packageId,
        payment_method: paymentMethod,
        start_date: startDate || undefined,
      }),
    onSuccess: () => {
      toast.success("Membership diaktifkan");
      router.push("/memberships");
    },
    onError: (e) => toast.error(e.message),
  });

  const packages = packagesQuery.data?.data ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader title="Aktivasi Membership" description="Aktifkan paket untuk anggota" />
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label>ID Anggota (UUID)</Label>
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID dari halaman detail anggota"
            />
          </div>
          <div>
            <Label>Paket</Label>
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih paket" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.duration_days} hari
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Metode Pembayaran</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tanggal Mulai (opsional)</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Batal
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!userId || !packageId || mutation.isPending}
            >
              Aktifkan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
