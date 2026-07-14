"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface Trainer {
  id: string;
  specialization: string;
  experience_years: number;
  hourly_rate: number;
  certification?: string | null;
  bio?: string | null;
  status: string;
  user?: { id: string; name: string; email: string; phone?: string; status?: string };
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  experience_years: 1,
  certification: "",
  bio: "",
  hourly_rate: 100000,
  status: "active",
};

export default function TrainersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [form, setForm] = useState(emptyForm);

  const query = useQuery({
    queryKey: ["admin", "trainers"],
    queryFn: () => apiGet<Trainer[]>("/admin/trainers"),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        specialization: form.specialization,
        experience_years: form.experience_years,
        certification: form.certification || null,
        bio: form.bio || null,
        hourly_rate: form.hourly_rate,
        ...(editing
          ? {
              status: form.status,
              ...(form.password ? { password: form.password } : {}),
            }
          : { password: form.password }),
      };
      return editing
        ? apiPut(`/admin/trainers/${editing.id}`, payload)
        : apiPost("/admin/trainers", payload);
    },
    onSuccess: () => {
      toast.success(editing ? "Pelatih diperbarui" : "Pelatih ditambahkan");
      qc.invalidateQueries({ queryKey: ["admin", "trainers"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/trainers/${id}`),
    onSuccess: () => {
      toast.success("Pelatih dinonaktifkan");
      qc.invalidateQueries({ queryKey: ["admin", "trainers"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const trainers = query.data?.data ?? [];

  const canSave =
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.specialization.trim() &&
    (editing || form.password.length >= 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelatih"
        description="Kelola data dan akun login pelatih"
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Tambah
          </Button>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email / Telepon</TableHead>
                <TableHead>Spesialisasi</TableHead>
                <TableHead>Tarif/jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada data pelatih
                  </TableCell>
                </TableRow>
              ) : (
                trainers.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.user?.name ?? "-"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{t.user?.email ?? "-"}</div>
                      <div className="text-xs text-muted-foreground">{t.user?.phone ?? "-"}</div>
                    </TableCell>
                    <TableCell>{t.specialization}</TableCell>
                    <TableCell>{formatCurrency(t.hourly_rate)}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/trainers/${t.id}`}>Detail</Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(t);
                            setForm({
                              name: t.user?.name ?? "",
                              email: t.user?.email ?? "",
                              phone: t.user?.phone ?? "",
                              password: "",
                              specialization: t.specialization,
                              experience_years: t.experience_years,
                              certification: t.certification ?? "",
                              bio: t.bio ?? "",
                              hourly_rate: t.hourly_rate,
                              status: t.status,
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Nonaktifkan pelatih?")) deleteMutation.mutate(t.id);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pelatih" : "Tambah Pelatih"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Pelatih</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Email (login)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="pelatih@gym.local"
                />
              </div>
              <div>
                <Label>Telepon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
            <div>
              <Label>{editing ? "Password baru (opsional)" : "Password portal"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 8 karakter"}
              />
            </div>
            <div>
              <Label>Spesialisasi</Label>
              <Input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="Strength, Cardio, Yoga, ..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pengalaman (tahun)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.experience_years}
                  onChange={(e) =>
                    setForm({ ...form, experience_years: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Tarif per jam</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.hourly_rate}
                  onChange={(e) =>
                    setForm({ ...form, hourly_rate: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Sertifikasi</Label>
              <Input
                value={form.certification}
                onChange={(e) => setForm({ ...form, certification: e.target.value })}
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            {editing && (
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !canSave}
            >
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
