"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
}

interface Performance {
  total_sessions: number;
  completed_sessions: number;
  total_members: number;
  average_rating: number;
}

interface TrainerDetail {
  id: string;
  specialization: string;
  experience_years: number;
  hourly_rate: number;
  certification?: string | null;
  bio?: string | null;
  status: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status?: string;
  };
}

const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function TrainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [capacity, setCapacity] = useState(5);

  const [accountForm, setAccountForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    specialization: "",
    experience_years: 0,
    certification: "",
    bio: "",
    hourly_rate: 0,
    status: "active",
  });

  const trainerQuery = useQuery({
    queryKey: ["admin", "trainers", id],
    queryFn: () => apiGet<TrainerDetail>(`/admin/trainers/${id}`),
  });

  const scheduleQuery = useQuery({
    queryKey: ["admin", "trainers", id, "schedule"],
    queryFn: () => apiGet<Schedule[]>(`/admin/trainers/${id}/schedule`),
  });

  const performanceQuery = useQuery({
    queryKey: ["admin", "trainers", id, "performance"],
    queryFn: () => apiGet<Performance>(`/admin/trainers/${id}/performance`),
  });

  const trainer = trainerQuery.data?.data;

  useEffect(() => {
    if (!trainer) return;
    setAccountForm({
      name: trainer.user?.name ?? "",
      email: trainer.user?.email ?? "",
      phone: trainer.user?.phone ?? "",
      password: "",
      specialization: trainer.specialization,
      experience_years: trainer.experience_years,
      certification: trainer.certification ?? "",
      bio: trainer.bio ?? "",
      hourly_rate: trainer.hourly_rate,
      status: trainer.status,
    });
  }, [trainer]);

  const addScheduleMutation = useMutation({
    mutationFn: () =>
      apiPost(`/admin/trainers/${id}/schedule`, {
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        capacity,
      }),
    onSuccess: () => {
      toast.success("Jadwal ditambahkan");
      qc.invalidateQueries({ queryKey: ["admin", "trainers", id, "schedule"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateAccountMutation = useMutation({
    mutationFn: () =>
      apiPut(`/admin/trainers/${id}`, {
        name: accountForm.name,
        email: accountForm.email,
        phone: accountForm.phone,
        specialization: accountForm.specialization,
        experience_years: accountForm.experience_years,
        certification: accountForm.certification || null,
        bio: accountForm.bio || null,
        hourly_rate: accountForm.hourly_rate,
        status: accountForm.status,
        ...(accountForm.password ? { password: accountForm.password } : {}),
      }),
    onSuccess: () => {
      toast.success("Data & akun pelatih diperbarui");
      setAccountForm((prev) => ({ ...prev, password: "" }));
      qc.invalidateQueries({ queryKey: ["admin", "trainers", id] });
      qc.invalidateQueries({ queryKey: ["admin", "trainers"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const perf = performanceQuery.data?.data;
  const schedules = scheduleQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={trainer?.user?.name ?? "Detail Pelatih"}
        description={trainer?.user?.email ?? `ID: ${id}`}
        actions={
          <Button variant="outline" asChild>
            <Link href="/trainers">Kembali</Link>
          </Button>
        }
      />

      {trainerQuery.isLoading ? (
        <Skeleton className="h-40" />
      ) : trainer ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Status</p>
              <StatusBadge status={trainer.status} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Spesialisasi</p>
              <p className="font-medium">{trainer.specialization}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pengalaman</p>
              <p className="font-medium">{trainer.experience_years} tahun</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tarif / jam</p>
              <p className="font-medium">{formatCurrency(trainer.hourly_rate)}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Akun & Data</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal</TabsTrigger>
          <TabsTrigger value="performance">Performa</TabsTrigger>
          <TabsTrigger value="workout">Portal Program</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Akun Pelatih</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div>
                <Label>Nama</Label>
                <Input
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Email (login portal)</Label>
                  <Input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Telepon</Label>
                  <Input
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Password baru (opsional)</Label>
                <Input
                  type="password"
                  value={accountForm.password}
                  onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                  placeholder="Kosongkan jika tidak diubah"
                />
              </div>
              <div>
                <Label>Spesialisasi</Label>
                <Input
                  value={accountForm.specialization}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, specialization: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Pengalaman (tahun)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={accountForm.experience_years}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        experience_years: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Tarif per jam</Label>
                  <Input
                    type="number"
                    min={0}
                    value={accountForm.hourly_rate}
                    onChange={(e) =>
                      setAccountForm({
                        ...accountForm,
                        hourly_rate: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Sertifikasi</Label>
                <Input
                  value={accountForm.certification}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, certification: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Bio</Label>
                <Textarea
                  rows={3}
                  value={accountForm.bio}
                  onChange={(e) => setAccountForm({ ...accountForm, bio: e.target.value })}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={accountForm.status}
                  onValueChange={(value) => setAccountForm({ ...accountForm, status: value })}
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
              <Button
                onClick={() => updateAccountMutation.mutate()}
                disabled={
                  updateAccountMutation.isPending ||
                  !accountForm.name.trim() ||
                  !accountForm.email.trim() ||
                  !accountForm.phone.trim()
                }
              >
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tambah Jadwal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-4">
              <div>
                <Label>Hari</Label>
                <Input
                  type="number"
                  min={0}
                  max={6}
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{days[Number(dayOfWeek)]}</p>
              </div>
              <div>
                <Label>Mulai</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label>Selesai</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <div>
                <Label>Kapasitas</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </div>
              <Button
                className="sm:col-span-4 sm:w-fit"
                onClick={() => addScheduleMutation.mutate()}
              >
                Tambah Jadwal
              </Button>
            </CardContent>
          </Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hari</TableHead>
                <TableHead>Jam</TableHead>
                <TableHead>Kapasitas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{days[s.day_of_week]}</TableCell>
                  <TableCell>
                    {s.start_time} - {s.end_time}
                  </TableCell>
                  <TableCell>{s.capacity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="performance" className="pt-4">
          {performanceQuery.isLoading ? (
            <Skeleton className="h-32" />
          ) : perf ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Total Sesi</p>
                  <p className="text-2xl font-bold">{perf.total_sessions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Selesai</p>
                  <p className="text-2xl font-bold">{perf.completed_sessions}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Anggota</p>
                  <p className="text-2xl font-bold">{perf.total_members}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold">{perf.average_rating}</p>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="workout" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Portal Program Latihan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-w-lg text-sm text-muted-foreground">
              <p>
                Program latihan dikelola oleh pelatih melalui portal{" "}
                <span className="font-medium text-foreground">/trainer</span> setelah login
                dengan email & password yang Anda atur di tab <strong>Akun & Data</strong>.
              </p>
              <p>
                Dari portal tersebut pelatih dapat membuat program lengkap (latihan, sets, reps)
                yang langsung muncul di aplikasi mobile anggota.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
