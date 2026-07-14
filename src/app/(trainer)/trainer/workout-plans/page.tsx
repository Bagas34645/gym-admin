"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { WorkoutPlanItem } from "@/lib/types/trainer";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  archived: "Diarsipkan",
};

export default function TrainerWorkoutPlansPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");

  const plansQuery = useQuery({
    queryKey: ["trainer", "workout-plans", { search, status }],
    queryFn: () =>
      apiGet<WorkoutPlanItem[]>("/trainer/workout-plans", {
        search: search || undefined,
        status: status === "all" ? undefined : status,
        per_page: 50,
      }),
  });

  const plans = plansQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program Latihan"
        description="Daftar program latihan yang Anda buat untuk anggota"
        actions={
          <Button asChild>
            <Link href="/trainer/workout-plans/new">Buat Program</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Cari nama program atau anggota..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="sm:max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="completed">Selesai</SelectItem>
            <SelectItem value="archived">Diarsipkan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {plansQuery.isLoading ? (
        <Skeleton className="h-64" />
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="font-medium">Belum ada program latihan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat program pertama untuk anggota Anda.
          </p>
          <Button asChild className="mt-4">
            <Link href="/trainer/workout-plans/new">Buat Program</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Anggota</TableHead>
              <TableHead>Latihan</TableHead>
              <TableHead>Mulai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>{plan.user?.name ?? "-"}</TableCell>
                <TableCell>{plan.exercises?.length ?? 0}</TableCell>
                <TableCell>{plan.start_date}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{statusLabels[plan.status] ?? plan.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/trainer/workout-plans/${plan.id}`}>Kelola</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
