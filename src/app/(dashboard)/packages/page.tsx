"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import type { MembershipPackage } from "@/lib/types/api";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatCurrency } from "@/lib/format";
import { Package } from "lucide-react";

const emptyPkg = {
  name: "",
  type: "monthly",
  duration_days: 30,
  price: 0,
  description: "",
  status: "active",
};

export default function PackagesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MembershipPackage | null>(null);
  const [form, setForm] = useState(emptyPkg);

  const query = useQuery({
    queryKey: ["admin", "packages"],
    queryFn: () => apiGet<MembershipPackage[]>("/admin/packages"),
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return apiPut(`/admin/packages/${editing.id}`, form);
      }
      return apiPost("/admin/packages", form);
    },
    onSuccess: () => {
      toast.success(editing ? "Paket diperbarui" : "Paket ditambahkan");
      qc.invalidateQueries({ queryKey: ["admin", "packages"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyPkg);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/packages/${id}`),
    onSuccess: () => {
      toast.success("Paket dinonaktifkan");
      qc.invalidateQueries({ queryKey: ["admin", "packages"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const packages = query.data?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyPkg);
    setOpen(true);
  };

  const openEdit = (pkg: MembershipPackage) => {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      type: pkg.type,
      duration_days: pkg.duration_days,
      price: pkg.price,
      description: pkg.description ?? "",
      status: pkg.status,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paket Membership"
        description="Kelola paket langganan gym"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Tambah Paket
          </Button>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-64" />
      ) : packages.length === 0 ? (
        <EmptyState icon={Package} title="Belum ada paket" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>{pkg.type}</TableCell>
                  <TableCell>{pkg.duration_days} hari</TableCell>
                  <TableCell>{formatCurrency(pkg.price)}</TableCell>
                  <TableCell>
                    <StatusBadge status={pkg.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("Nonaktifkan paket ini?")) deleteMutation.mutate(pkg.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Paket" : "Tambah Paket"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipe</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Harian</SelectItem>
                    <SelectItem value="weekly">Mingguan</SelectItem>
                    <SelectItem value="monthly">Bulanan</SelectItem>
                    <SelectItem value="yearly">Tahunan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Durasi (hari)</Label>
                <Input
                  type="number"
                  value={form.duration_days}
                  onChange={(e) =>
                    setForm({ ...form, duration_days: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Harga (IDR)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
