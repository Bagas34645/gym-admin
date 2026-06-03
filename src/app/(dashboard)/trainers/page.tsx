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
  status: string;
  user?: { id: string; name: string; email: string };
}

const emptyForm = {
  user_id: "",
  specialization: "",
  experience_years: 1,
  certification: "",
  bio: "",
  hourly_rate: 0,
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
    mutationFn: () =>
      editing
        ? apiPut(`/admin/trainers/${editing.id}`, form)
        : apiPost("/admin/trainers", form),
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pelatih"
        description="Kelola data pelatih"
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
                <TableHead>Spesialisasi</TableHead>
                <TableHead>Pengalaman</TableHead>
                <TableHead>Tarif/jam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.user?.name ?? "-"}</TableCell>
                  <TableCell>{t.specialization}</TableCell>
                  <TableCell>{t.experience_years} thn</TableCell>
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
                            user_id: t.user?.id ?? "",
                            specialization: t.specialization,
                            experience_years: t.experience_years,
                            certification: "",
                            bio: "",
                            hourly_rate: t.hourly_rate,
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Pelatih" : "Tambah Pelatih"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div>
                <Label>ID User (UUID)</Label>
                <Input
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label>Spesialisasi</Label>
              <Input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pengalaman (tahun)</Label>
                <Input
                  type="number"
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
                  value={form.hourly_rate}
                  onChange={(e) =>
                    setForm({ ...form, hourly_rate: Number(e.target.value) })
                  }
                />
              </div>
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
