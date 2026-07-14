"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiPost } from "@/lib/api-client";
import {
  createEmptyExercise,
  serializeExercises,
  type PlanExerciseInput,
} from "@/lib/types/trainer";
import { MemberSearchInput } from "@/components/shared/member-search-input";
import { PlanExerciseEditor } from "@/components/trainer/plan-exercise-editor";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewWorkoutPlanPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exercises, setExercises] = useState<PlanExerciseInput[]>([
    createEmptyExercise(1),
  ]);

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost("/trainer/workout-plans", {
        user_id: userId,
        name,
        description: description || undefined,
        goal: goal || undefined,
        start_date: startDate,
        end_date: endDate || undefined,
        exercises: serializeExercises(exercises),
      }),
    onSuccess: () => {
      toast.success("Program latihan berhasil dibuat");
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Buat Program Latihan"
        description="Program akan langsung tampil di aplikasi mobile anggota"
      />

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <Label>Anggota</Label>
            <MemberSearchInput
              value={userId}
              onChange={setUserId}
              searchPath="/trainer/members/search"
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

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Batal
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit || createMutation.isPending}
            >
              Simpan Program
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
