"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherRecord } from "@/lib/types/weather";
import { WEATHER_CATEGORY_BADGE_CLASS } from "@/lib/types/weather";

const PAGE_SIZE = 10;

export function WeatherTable({ data }: { data: WeatherRecord[] }) {
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [data]);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) =>
      sortAsc
        ? a.weather_date.localeCompare(b.weather_date)
        : b.weather_date.localeCompare(a.weather_date),
    );
  }, [data, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  if (!data.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Tidak ada data untuk periode ini
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left font-medium">
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={() => {
                    setSortAsc((v) => !v);
                    setPage(1);
                  }}
                >
                  Tanggal <ArrowUpDown className="size-3" />
                </button>
              </th>
              <th className="p-3 text-left font-medium">Suhu (Min/Avg/Max)</th>
              <th className="p-3 text-left font-medium">Curah Hujan</th>
              <th className="p-3 text-left font-medium">Comfort Score</th>
              <th className="p-3 text-left font-medium">Kategori</th>
              <th className="p-3 text-left font-medium">Angin</th>
              <th className="p-3 text-left font-medium">Weekend</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((item) => (
              <tr key={item.weather_date} className="border-t">
                <td className="p-3">{item.weather_date}</td>
                <td className="p-3">
                  {item.temperature.min}&deg; / {item.temperature.avg}&deg; /{" "}
                  {item.temperature.max}&deg;
                </td>
                <td className="p-3">{item.precipitation.mm} mm</td>
                <td className="p-3">{item.comfort_score}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      WEATHER_CATEGORY_BADGE_CLASS[item.weather.category] ??
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.weather.category}
                  </span>
                </td>
                <td className="p-3">{item.wind.speed_kmh} km/h</td>
                <td className="p-3">{item.day.is_weekend ? "Ya" : "Tidak"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Halaman {currentPage} dari {totalPages} ({sorted.length} data)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
