"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CloudRain,
  Gauge,
  Thermometer,
  Users,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";
import type {
  WeatherAttendanceItem,
  WeatherDistributionItem,
  WeatherFilterParams,
  WeatherRecord,
  WeatherSummary,
} from "@/lib/types/weather";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter } from "@/components/weather/date-range-filter";
import { WeatherAttendanceChart } from "@/components/charts/weather-attendance-chart";
import { WeatherDistributionChart } from "@/components/charts/weather-distribution-chart";
import { WeatherTable } from "@/components/weather/weather-table";

function useWeatherSummary(filter: WeatherFilterParams) {
  return useQuery({
    queryKey: ["admin", "dashboard", "weather-summary", filter],
    queryFn: () =>
      apiGet<WeatherSummary>("/admin/dashboard/weather-summary", filter),
  });
}

function useWeatherAttendance(filter: WeatherFilterParams) {
  return useQuery({
    queryKey: ["admin", "dashboard", "weather-attendance", filter],
    queryFn: () =>
      apiGet<WeatherAttendanceItem[]>(
        "/admin/dashboard/weather-attendance",
        filter,
      ),
  });
}

function useWeatherDistribution(filter: WeatherFilterParams) {
  return useQuery({
    queryKey: ["admin", "dashboard", "weather-distribution", filter],
    queryFn: () =>
      apiGet<WeatherDistributionItem[]>(
        "/admin/dashboard/weather-distribution",
        filter,
      ),
  });
}

function useWeatherData(filter: WeatherFilterParams) {
  return useQuery({
    queryKey: ["admin", "dashboard", "weather", filter],
    queryFn: () => apiGet<WeatherRecord[]>("/admin/dashboard/weather", filter),
  });
}

export default function WeatherDashboardPage() {
  const [filter, setFilter] = useState<WeatherFilterParams>({});

  const summary = useWeatherSummary(filter);
  const attendance = useWeatherAttendance(filter);
  const distribution = useWeatherDistribution(filter);
  const weatherData = useWeatherData(filter);

  const s = summary.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weather Analytics"
        description="Korelasi kondisi cuaca harian dengan kunjungan member"
      />

      <DateRangeFilter
        startDate={filter.start_date}
        endDate={filter.end_date}
        onApply={setFilter}
      />

      {summary.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : summary.isError ? (
        <p className="text-sm text-destructive">
          Gagal memuat ringkasan cuaca.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Hari"
            value={s?.total_days ?? 0}
            icon={CalendarDays}
          />
          <StatCard
            title="Total Pengunjung"
            value={s?.total_visitors ?? 0}
            icon={Users}
          />
          <StatCard
            title="Rata-rata Suhu"
            value={`${s?.average_temperature ?? 0}°C`}
            icon={Thermometer}
          />
          <StatCard
            title="Comfort Score"
            value={s?.average_comfort_score ?? 0}
            icon={Gauge}
          />
          <StatCard
            title="Hari Hujan"
            value={s?.rainy_days ?? 0}
            icon={CloudRain}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cuaca vs Kunjungan</CardTitle>
        </CardHeader>
        <CardContent>
          {attendance.isLoading ? (
            <Skeleton className="h-80" />
          ) : attendance.isError ? (
            <p className="text-sm text-destructive">
              Gagal memuat data kunjungan.
            </p>
          ) : (
            <WeatherAttendanceChart data={attendance.data?.data ?? []} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribusi Kategori Cuaca</CardTitle>
        </CardHeader>
        <CardContent>
          {distribution.isLoading ? (
            <Skeleton className="h-72" />
          ) : distribution.isError ? (
            <p className="text-sm text-destructive">
              Gagal memuat distribusi cuaca.
            </p>
          ) : (
            <WeatherDistributionChart data={distribution.data?.data ?? []} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Cuaca Harian</CardTitle>
        </CardHeader>
        <CardContent>
          {weatherData.isLoading ? (
            <Skeleton className="h-96" />
          ) : weatherData.isError ? (
            <p className="text-sm text-destructive">
              Gagal memuat tabel cuaca.
            </p>
          ) : (
            <WeatherTable data={weatherData.data?.data ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
