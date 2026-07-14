"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { TrainerDashboardSummary } from "@/lib/types/trainer";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainerDashboardPage() {
  const summaryQuery = useQuery({
    queryKey: ["trainer", "dashboard", "summary"],
    queryFn: () => apiGet<TrainerDashboardSummary>("/trainer/dashboard/summary"),
  });

  const summary = summaryQuery.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Pelatih"
        description="Kelola program latihan untuk anggota gym"
        actions={
          <Button asChild>
            <Link href="/trainer/workout-plans/new">Buat Program</Link>
          </Button>
        }
      />

      {summaryQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Program Aktif</p>
              <p className="text-3xl font-bold">{summary?.active_plans ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Program</p>
              <p className="text-3xl font-bold">{summary?.total_plans ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="font-medium">Mulai dari sini</p>
          <p className="text-sm text-muted-foreground">
            Buat program latihan untuk anggota, atur latihan beserta sets dan reps.
            Program akan langsung muncul di aplikasi mobile anggota.
          </p>
          <Button asChild variant="outline">
            <Link href="/trainer/workout-plans">Lihat Semua Program</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
