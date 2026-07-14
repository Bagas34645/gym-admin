"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiDelete, apiGet, apiPut } from "@/lib/api-client";
import {
  exercisesFromPlan,
  serializeExercises,
  type PlanExerciseInput,
  type WorkoutPlanItem,
} from "@/lib/types/trainer";
import { MemberSearchInput } from "@/components/shared/member-search-input";
import { PlanExerciseEditor } from "@/components/trainer/plan-exercise-editor";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function EditWorkoutPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const [userId, setUserId] = useState("");
  const [memberSearchKey, setMemberSearchKey] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("active");
  const [exercises, setExercises] = useState<PlanExerciseInput[]>([]);

  const planQuery = useQuery({
    queryKey: ["trainer", "workout-plans", id],
    queryFn: () => apiGet<WorkoutPlanItem>(`/trainer/workout-plans/${id}`),
  });

  const plan = planQuery.data?.data;

  useEffect(() => {
    if (!plan) return;
    setUserId(plan.user?.id ?? "");
    setName(plan.name);
    setDescription(plan.description ?? "");
    setGoal(plan.goal ?? "");
    setStartDate(plan.start_date);
    setEndDate(plan.end_date ?? "");
    setStatus(plan.status);
    setExercises(exercisesFromPlan(plan));
    setMemberSearchKey((value) => value + 1);
  }, [plan]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiPut(`/trainer/workout-plans/${id}`, {
        user_id: userId,
        name,
        description: description || null,
        goal: goal || null,
        start_date: startDate,
        end_date: endDate || null,
        status,
        exercises: serializeExercises(exercises),
      }),
    onSuccess: () => {
      toast.success("Program latihan diperbarui");
      qc.invalidateQueries({ queryKey: ["trainer", "workout-plans"] });
      qc.invalidateQueries({ queryKey: ["trainer", "workout-plans", id] });
    },
    onError: (error) => toast.error(error.message),
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiDelete(`/trainer/workout-plans/${id}`),
    onSuccess: () => {
      toast.success("Program latihan diarsipkan");
      router.push("/trainer/workout-plans");
    },
    onError: (error) => toast.error(error.message),
  });

  const canSubmit =
    userId &&
    name.trim() &&
    startDate &&
    exercises.length > 0 &&
    exercises.every((exercise) => exercise.name.trim());

  if (planQuery.isLoading) {
    return <Skeleton className="mx-auto h-96 max-w-3xl" />;
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-dashed p-8 text-center">
        <p className="font-medium">Program tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Kelola Program Latihan"
        description={plan.user?.name ? `Anggota: ${plan.user.name}` : undefined}
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label>Anggota</Label>
            <MemberSearchInput
              key={memberSearchKey}
              value={userId}
              onChange={setUserId}
              searchPath="/trainer/members/search"
              initialName={plan.user?.name ?? ""}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nama Program</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="archived">Diarsipkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>Tujuan</Label>
              <Input value={goal} onChange={(event) => setGoal(event.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Deskripsi</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </div>
          </div>

          <PlanExerciseEditor exercises={exercises} onChange={setExercises} />

          <div className="flex flex-wrap justify-between gap-3">
            <Button
              variant="destructive"
              onClick={() => archiveMutation.mutate()}
              disabled={archiveMutation.isPending || status === "archived"}
            >
              Arsipkan Program
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Kembali
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={!canSubmit || updateMutation.isPending}
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
