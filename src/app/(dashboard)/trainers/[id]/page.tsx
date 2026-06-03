"use client";

import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiGet, apiPost } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [workoutUserId, setWorkoutUserId] = useState("");
  const [workoutName, setWorkoutName] = useState("");
  const [workoutStart, setWorkoutStart] = useState("");

  const scheduleQuery = useQuery({
    queryKey: ["admin", "trainers", id, "schedule"],
    queryFn: () => apiGet<Schedule[]>(`/admin/trainers/${id}/schedule`),
  });

  const performanceQuery = useQuery({
    queryKey: ["admin", "trainers", id, "performance"],
    queryFn: () => apiGet<Performance>(`/admin/trainers/${id}/performance`),
  });

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

  const workoutMutation = useMutation({
    mutationFn: () =>
      apiPost("/admin/workout-plans", {
        user_id: workoutUserId,
        trainer_id: id,
        name: workoutName,
        start_date: workoutStart,
      }),
    onSuccess: () => {
      toast.success("Rencana latihan dibuat");
      setWorkoutUserId("");
      setWorkoutName("");
      setWorkoutStart("");
    },
    onError: (e) => toast.error(e.message),
  });

  const perf = performanceQuery.data?.data;
  const schedules = scheduleQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Detail Pelatih" description={`ID: ${id}`} />

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Jadwal</TabsTrigger>
          <TabsTrigger value="performance">Performa</TabsTrigger>
          <TabsTrigger value="workout">Rencana Latihan</TabsTrigger>
        </TabsList>

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
              <CardTitle>Buat Rencana Latihan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div>
                <Label>ID Anggota</Label>
                <Input value={workoutUserId} onChange={(e) => setWorkoutUserId(e.target.value)} />
              </div>
              <div>
                <Label>Nama Program</Label>
                <Input value={workoutName} onChange={(e) => setWorkoutName(e.target.value)} />
              </div>
              <div>
                <Label>Tanggal Mulai</Label>
                <Input type="date" value={workoutStart} onChange={(e) => setWorkoutStart(e.target.value)} />
              </div>
              <Button
                onClick={() => workoutMutation.mutate()}
                disabled={workoutMutation.isPending}
              >
                Buat Rencana
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
